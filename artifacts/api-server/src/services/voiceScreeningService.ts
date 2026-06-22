/**
 * Voice Screening Service
 *
 * Handles AI-powered voice screening pipeline:
 * 1. Accept incoming WebSocket connections from Exotel AgentStream
 * 2. Parse binary audio frames
 * 3. Send dynamic greeting prompt (TTS)
 * 4. Transcribe caller audio (STT)
 * 5. Classify intent using AI model
 * 6. Generate response and disposition
 * 7. Log transcript, events, and outcomes to database
 *
 * Phase 3 - Week 1: Foundation (WebSocket + Greeting)
 * Phase 3 - Week 2: Intent Classification (AI integration)
 * Phase 3 - Week 3: Safety Guardrails (PII, injection, harmful content)
 * Phase 3 - Week 4: Integration & Deploy
 */

import { db } from '@workspace/db';
import {
  voiceScreeningSessions,
  voiceCallTranscripts as callTranscripts,
  safetyEvents,
  type VoiceScreeningSession,
  type InsertVoiceScreeningSession,
  type InsertCallTranscript,
  type InsertSafetyEvent,
} from '@workspace/db/schema';
import { calls } from '@workspace/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../lib/logger';

/**
 * Voice Screening Session Lifecycle
 *
 * Manages state machine:
 * initiated → greeting_sent → listening → processing → completed
 */
export class VoiceScreeningService {
  /**
   * Create a new voice screening session
   *
   * Called when:
   * 1. Webhook decision is "screen"
   * 2. WebSocket endpoint receives new connection
   *
   * @param callId - Reference to the call in the calls table
   * @param userId - User who owns this call
   * @param websocketSessionId - Unique ID for this WebSocket connection
   * @returns Created session with ID
   */
  static async createSession(
    callId: string,
    userId: string,
    websocketSessionId?: string
  ): Promise<VoiceScreeningSession> {
    try {
      // Verify the call exists and belongs to this user
      const callRecord = await db
        .select()
        .from(calls)
        .where(and(eq(calls.id, callId), eq(calls.userId, userId)))
        .limit(1);

      if (callRecord.length === 0) {
        throw new Error(`Call ${callId} not found for user ${userId}`);
      }

      const session = await db
        .insert(voiceScreeningSessions)
        .values({
          callId,
          userId,
          websocketSessionId,
          status: 'initiated',
        })
        .returning();

      logger.info({ sessionId: session[0].id, callId, userId, websocketSessionId }, 'Voice screening session created');

      return session[0];
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), callId, userId }, 'Failed to create voice screening session');
      throw error;
    }
  }

  /**
   * Start the voice greeting
   *
   * Called after WebSocket connection established.
   * Generates TTS greeting and sends to Exotel.
   *
   * @param sessionId - Session ID to update
   * @returns Updated session
   */
  static async sendGreeting(sessionId: string): Promise<VoiceScreeningSession> {
    try {
      // Fetch session to get user context
      const session = await db
        .select()
        .from(voiceScreeningSessions)
        .where(eq(voiceScreeningSessions.id, sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // TODO (Phase 3 Week 2): Generate dynamic greeting based on user's custom rule
      // For MVP: Use hardcoded greeting
      const greetingPrompt =
        "Hello! Thanks for calling. To better serve you, I'll be screening this call. Please go ahead and tell me why you're calling.";

      // TODO (Phase 3 Week 2): Integrate TTS engine
      // For now, just mark that greeting was sent
      const updated = await db
        .update(voiceScreeningSessions)
        .set({
          status: 'in_progress',
          updatedAt: new Date(),
        })
        .where(eq(voiceScreeningSessions.id, sessionId))
        .returning();

      logger.info({ sessionId, prompt: greetingPrompt, timestamp: new Date().toISOString() }, 'Greeting sent to caller');

      return updated[0];
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), sessionId }, 'Failed to send greeting');
      throw error;
    }
  }

  /**
   * Log a transcript turn (caller or AI response)
   *
   * Called whenever speaker says something.
   * Stores word-by-word transcript with metadata.
   *
   * @param sessionId - Voice screening session
   * @param speaker - 'caller' or 'deva' (AI)
   * @param text - What was said
   * @param startTimeMs - When utterance started
   * @param endTimeMs - When utterance ended
   * @returns Created transcript record
   */
  static async logTranscript(
    sessionId: string,
    speaker: 'caller' | 'deva',
    text: string,
    startTimeMs?: number,
    endTimeMs?: number
  ): Promise<void> {
    try {
      await db.insert(callTranscripts).values({
        voiceSessionId: sessionId,
        speaker,
        text,
        startTimeMs,
        endTimeMs,
        language: 'en',
      });

      logger.debug({ sessionId, speaker, textLength: text.length, startTimeMs, endTimeMs }, 'Transcript logged');
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), sessionId, speaker }, 'Failed to log transcript');
      // Don't throw; transcription failures shouldn't block the call
    }
  }

  /**
   * Record a safety event (potential security concern)
   *
   * Called when:
   * - Prompt injection pattern detected
   * - Jailbreak attempt identified
   * - Harmful content flagged
   * - PII leaked
   *
   * @param sessionId - Voice screening session
   * @param eventType - Category of event
   * @param severity - Alert severity
   * @param description - Human-readable summary
   * @param actionTaken - What the system did about it
   * @returns Created safety event record
   */
  static async logSafetyEvent(
    sessionId: string,
    eventType:
      | 'prompt_injection_attempt'
      | 'jailbreak_attempt'
      | 'harmful_content'
      | 'pii_leak'
      | 'spam_pattern'
      | 'scam_pattern'
      | 'rate_limit_exceeded'
      | 'timeout'
      | 'error',
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    actionTaken:
      | 'blocked'
      | 'logged'
      | 'escalated'
      | 'user_warned'
      | 'session_terminated'
  ): Promise<void> {
    try {
      await db.insert(safetyEvents).values({
        voiceSessionId: sessionId,
        eventType,
        severity,
        description,
        actionTaken,
        detectionMethod: 'heuristic', // TODO: Update based on actual detection method
      });

      logger.warn({ sessionId, eventType, severity, actionTaken }, 'Safety event logged');

      // TODO (Phase 3 Week 3): Route critical events to monitoring dashboard
      if (severity === 'critical') {
        logger.error({ sessionId, eventType, description }, 'CRITICAL SAFETY EVENT');
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), sessionId, eventType }, 'Failed to log safety event');
      // Don't throw; event logging shouldn't block the call
    }
  }

  /**
   * Complete the voice screening session
   *
   * Called when:
   * - Caller hangs up
   * - Session timeout reached
   * - Error occurred
   *
   * @param sessionId - Session to complete
   * @param disposition - Final routing decision
   * @param reason - Why this decision was made
   * @returns Updated session
   */
  static async completeSession(
    sessionId: string,
    disposition: 'connect' | 'reject' | 'escalate_to_user',
    reason: string
  ): Promise<VoiceScreeningSession> {
    try {
      const now = new Date();
      const updated = await db
        .update(voiceScreeningSessions)
        .set({
          status: 'completed',
          aiDisposition: disposition,
          dispositionReason: reason,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(voiceScreeningSessions.id, sessionId))
        .returning();

      if (updated.length === 0) {
        throw new Error(`Session ${sessionId} not found`);
      }

      logger.info({ sessionId, disposition, reason, duration: updated[0].startedAt
          ? now.getTime() - updated[0].startedAt.getTime()
          : undefined }, 'Voice screening session completed');

      return updated[0];
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), sessionId }, 'Failed to complete voice screening session');
      throw error;
    }
  }

  /**
   * Fail the voice screening session
   *
   * Called when an unrecoverable error occurs.
   *
   * @param sessionId - Session to fail
   * @param errorMessage - What went wrong
   * @returns Updated session
   */
  static async failSession(
    sessionId: string,
    errorMessage: string
  ): Promise<VoiceScreeningSession> {
    try {
      const now = new Date();
      const updated = await db
        .update(voiceScreeningSessions)
        .set({
          status: 'failed',
          updatedAt: now,
        })
        .where(eq(voiceScreeningSessions.id, sessionId))
        .returning();

      if (updated.length === 0) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Log this as a critical safety event
      await this.logSafetyEvent(
        sessionId,
        'error',
        'high',
        `Session failed: ${errorMessage}`,
        'logged'
      );

      logger.error({ sessionId, error: errorMessage }, 'Voice screening session failed');

      return updated[0];
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), sessionId }, 'Failed to mark session as failed');
      throw error;
    }
  }

  /**
   * Get session history (for analytics/debugging)
   *
   * @param sessionId - Session to retrieve
   * @returns Session with full transcript and events
   */
  static async getSessionHistory(
    sessionId: string
  ): Promise<{
    session: VoiceScreeningSession;
    transcripts: typeof callTranscripts.$inferSelect[];
    safetyEvents: typeof safetyEvents.$inferSelect[];
  }> {
    try {
      const session = await db
        .select()
        .from(voiceScreeningSessions)
        .where(eq(voiceScreeningSessions.id, sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const transcripts = await db
        .select()
        .from(callTranscripts)
        .where(eq(callTranscripts.voiceSessionId, sessionId))
        .orderBy(callTranscripts.startTimeMs);

      const events = await db
        .select()
        .from(safetyEvents)
        .where(eq(safetyEvents.voiceSessionId, sessionId))
        .orderBy(safetyEvents.createdAt);

      return {
        session: session[0],
        transcripts,
        safetyEvents: events,
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), sessionId }, 'Failed to get session history');
      throw error;
    }
  }
}

/**
 * TODO (Phase 3 Week 1): WebSocket Handler
 *
 * Integrate with Exotel's AgentStream WebSocket endpoint.
 * Handle binary audio frames and real-time bidirectional communication.
 *
 * Reference: PHASE_3_TECHNICAL_SPEC.md → "Voice Screening Flow"
 */

/**
 * TODO (Phase 3 Week 2): Intent Classification
 *
 * Integrate AI model (Claude 3, GPT-4, etc.) for:
 * - Transcription (STT)
 * - Intent detection (business, spam, scam, etc.)
 * - Confidence scoring
 * - Response generation
 *
 * Reference: PHASE_3_TECHNICAL_SPEC.md → "Intent Classification"
 */

/**
 * TODO (Phase 3 Week 3): Safety Guardrails
 *
 * Implement multi-layer safety:
 * - Prompt injection detection (regex + ML patterns)
 * - PII masking (Aadhaar, PAN, SSN, credit card)
 * - Harmful content filtering
 * - Jailbreak attempt detection
 * - Rate limiting & abuse prevention
 *
 * Reference: PHASE_3_TECHNICAL_SPEC.md → "Safety Guardrails"
 */

export default VoiceScreeningService;
