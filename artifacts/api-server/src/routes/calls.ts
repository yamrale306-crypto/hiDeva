import { Router, type IRouter, type Request, type Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '@workspace/db';
import {
  calls,
  contacts,
  routingRules,
  type InsertCall,
} from '@workspace/db';

const router: IRouter = Router();

/**
 * Exotel Passthru Webhook Payload (form-urlencoded)
 * 
 * This is the minimal contract with Exotel's AgentStream.
 * Exotel sends these parameters when a call hits your virtual phone number.
 */
interface ExotelPassthruPayload {
  CallSid: string;      // Unique call identifier
  CallFrom: string;     // Caller's number (+91...)
  CallTo: string;       // Virtual ExoPhone dialed
  Direction: 'incoming' | 'outgoing';
}

/**
 * POST /api/calls/webhook
 * 
 * Exotel Passthru Entry Point
 * 
 * Execution Guardrail: **< 3 seconds**
 * 
 * Flow:
 *   1. Extract & validate Exotel payload (5ms)
 *   2. Parallel DB lookups: contact + active rules (30ms)
 *   3. Fast routing decision logic (10ms)
 *   4. Async DB write (background, doesn't block response)
 *   5. Return steering instruction to Exotel (50ms total)
 * 
 * Decision outcomes:
 *   - 'connect': Pass call to user's device immediately
 *   - 'reject': Drop the call (known spam)
 *   - 'screen': Hand off to AgentStream WebSocket pipeline for Deva AI
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // ======================================================================
    // 1. PAYLOAD EXTRACTION & VALIDATION (~5ms)
    // ======================================================================
    
    const { CallSid, CallFrom, CallTo } = req.body as Partial<ExotelPassthruPayload>;

    if (!CallSid || !CallFrom || !CallTo) {
      console.warn('Invalid Exotel payload: missing required fields', {
        CallSid,
        CallFrom,
        CallTo,
      });
      // Safe fallback: screen unknown calls rather than dropping them
      return res.status(200).json({ select: 'screen' });
    }

    // ======================================================================
    // 2. USER RESOLUTION (~1ms)
    // ======================================================================
    // In production, resolve CallTo (ExoPhone) to the actual user's ID
    // For MVP, use hardcoded placeholder
    // TODO: Implement CallTo → userId mapping (e.g., via a callRouting table)
    
    const targetUserId = "00000000-0000-0000-0000-000000000001"; // Placeholder

    // ======================================================================
    // 3. PARALLEL DATABASE LOOKUPS (~30ms)
    // ======================================================================
    // Fetch contact record + all active routing rules in parallel
    // This keeps the DB roundtrip penalty low
    
    const [existingContact, activeRules] = await Promise.all([
      db.query.contacts.findFirst({
        where: and(
          eq(contacts.userId, targetUserId),
          eq(contacts.phoneNumber, CallFrom)
        ),
      }),
      db.query.routingRules.findMany({
        where: and(
          eq(routingRules.userId, targetUserId),
          eq(routingRules.isActive, true)
        ),
        orderBy: (rules, { asc }) => [asc(rules.priority)],
      }),
    ]);

    // ======================================================================
    // 4. ROUTING DECISION ENGINE (~10ms)
    // ======================================================================
    // Single-pass evaluation: priority checks → custom rules → default
    
    let executionDecision: 'connect' | 'screen' | 'reject' = 'screen'; // Default: screen

    // 4a. Contact-based decisions (take highest precedence)
    if (existingContact) {
      if (existingContact.priority === 'high') {
        // VIP / Family → always connect immediately
        executionDecision = 'connect';
      } else if (existingContact.isSpamReported || existingContact.priority === 'low') {
        // Known spammer or low priority → reject
        executionDecision = 'reject';
      }
    }

    // 4b. Custom routing rules (only if no priority override)
    if (executionDecision === 'screen' && activeRules.length > 0) {
      for (const rule of activeRules) {
        let ruleMatches = false;

        switch (rule.triggerType) {
          case 'unknown':
            // Match if caller is NOT in contacts
            ruleMatches = !existingContact;
            break;

          case 'pattern':
            // Match if caller matches phone pattern (e.g., "1800*", "+919876*")
            if (rule.triggerValue) {
              const pattern = rule.triggerValue.replace(/\*/g, '.*');
              ruleMatches = new RegExp(`^${pattern}$`).test(CallFrom);
            }
            break;

          case 'keyword':
            // Reserved for future: match based on intent/transcript
            ruleMatches = false;
            break;

          case 'time_based':
            // Reserved for future: match based on business hours
            ruleMatches = false;
            break;

          default:
            ruleMatches = false;
        }

        if (ruleMatches) {
          executionDecision = rule.action as 'connect' | 'screen' | 'reject';
          break; // First matching rule wins
        }
      }
    }

    // ======================================================================
    // 5. ASYNCHRONOUS DATABASE WRITE (non-blocking)
    // ======================================================================
    // Store the call record for audit/analytics
    // Don't await this — it happens in the background after response is sent
    
    const mappedStatus = 
      executionDecision === 'connect' ? 'connected' :
      executionDecision === 'reject' ? 'rejected' :
      'screening';

    // Fire-and-forget: write to DB without blocking response
    db.insert(calls)
      .values({
        userId: targetUserId,
        telephonyCallSid: CallSid,
        callerNumber: CallFrom,
        status: mappedStatus,
      })
      .catch((err) => {
        console.error('Background call record write failed:', err, {
          CallSid,
          CallFrom,
          targetUserId,
        });
      });

    // ======================================================================
    // 6. RESPONSE & TELEMETRY (~5ms)
    // ======================================================================
    
    const executionTime = Date.now() - startTime;
    console.log(`[TELEPHONY] Route decision in ${executionTime}ms`, {
      callSid: CallSid,
      caller: CallFrom,
      decision: executionDecision,
      hasContact: !!existingContact,
      rulesChecked: activeRules.length,
    });

    // Guardrail check
    if (executionTime > 3000) {
      console.warn(`⚠️ SLOW EXECUTION: Took ${executionTime}ms (target < 3s)`, {
        CallSid,
      });
    }

    // Return Exotel steering instruction
    return res.status(200).json({ select: executionDecision });

  } catch (error) {
    console.error('[TELEPHONY] Webhook handler crashed:', error);

    // CRITICAL: Always return a safe default rather than erroring out
    // If our backend is down, we should still answer calls gracefully
    return res.status(200).json({ select: 'connect' });
  }
});

/**
 * GET /api/calls/:callId
 * 
 * Retrieve full call record (used by mobile app for call history)
 */
router.get('/:callId', async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;

    const callRecord = await db.query.calls.findFirst({
      where: eq(calls.id, callId as any),
    });

    if (!callRecord) {
      return res.status(404).json({
        error: 'Call not found',
        code: 'NOT_FOUND',
      });
    }

    return res.status(200).json(callRecord);
  } catch (error) {
    console.error('Get call error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
