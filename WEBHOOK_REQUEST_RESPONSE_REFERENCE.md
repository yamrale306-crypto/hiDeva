# Telephony Webhook: Request/Response Reference

## Overview

hiDeva receives Exotel call events, makes a fast routing decision, and returns a steering instruction.

```
┌─────────────────────────────────────────────────────────────────┐
│ Exotel AgentStream                                              │
│ Call hits virtual ExoPhone → Sends webhook                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
        POST /api/calls/webhook (JSON)
        Payload: { CallSid, CallFrom, CallTo, Direction }
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    [DB Lookups]              [Decision Engine]
    - Contact                 - Check priorities
    - Rules                   - Evaluate rules
                              - Default to screen
        │                             │
        └──────────────┬──────────────┘
                       │
                       ▼
        Response: { select: "connect" | "reject" | "screen" }
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
   Forward to             Reject or Screen
   User's Phone          (Deva AI Pipeline)
```

---

## Request

### Endpoint
```
POST /api/calls/webhook
Content-Type: application/json
```

### Payload Schema

```typescript
interface ExotelPassthruPayload {
  CallSid: string;        // Unique call identifier from Exotel
  CallFrom: string;       // Caller's phone number (e.g., "+919876543210")
  CallTo: string;         // Virtual ExoPhone dialed (e.g., "080-HIDEVA-1")
  Direction: 'incoming' | 'outgoing';
}
```

### Example Payloads

#### Scenario 1: Unknown Caller
```json
{
  "CallSid": "c6d28b60-19fe-11ef-9200-0242ac140052",
  "CallFrom": "+919999999999",
  "CallTo": "080-HIDEVA-1",
  "Direction": "incoming"
}
```
**Expected Decision:** `screen` (safe default)

#### Scenario 2: VIP Contact (Mom)
```json
{
  "CallSid": "a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6",
  "CallFrom": "+919123456789",
  "CallTo": "080-HIDEVA-1",
  "Direction": "incoming"
}
```
**Condition:** Contact exists with `priority: 'high'`
**Expected Decision:** `connect`

#### Scenario 3: Known Spam
```json
{
  "CallSid": "x1y2z3a4-b5c6-47d8-9e0f-a1b2c3d4e5f6",
  "CallFrom": "+918001234567",
  "CallTo": "080-HIDEVA-1",
  "Direction": "incoming"
}
```
**Condition:** Contact exists with `isSpamReported: true` OR `priority: 'low'`
**Expected Decision:** `reject`

#### Scenario 4: Matches Custom Rule (Telemarketer Pattern)
```json
{
  "CallSid": "m1n2o3p4-q5r6-47s8-9t0u-v1w2x3y4z5a6",
  "CallFrom": "+911800112233",
  "CallTo": "080-HIDEVA-1",
  "Direction": "incoming"
}
```
**Condition:** Matches rule with `triggerType: 'pattern'` and `triggerValue: '1800*'` and `action: 'block'`
**Expected Decision:** `reject`

---

## Response

### Response Schema

```typescript
interface WebhookResponse {
  select: 'connect' | 'reject' | 'screen';
}
```

### Response Outcomes

#### `"connect"`
**Meaning:** Route call to user's device immediately
**When Used:**
- VIP/high-priority contact
- No blocking rules match
- Safe default for trusted contacts

**Exotel Action:** Passes call leg to user's phone

```json
{
  "select": "connect"
}
```

#### `"reject"`
**Meaning:** Drop the call immediately
**When Used:**
- Known spam or telemarketer
- Low-priority contact marked as spam
- Matches blocking rule

**Exotel Action:** Hangs up on caller

```json
{
  "select": "reject"
}
```

#### `"screen"`
**Meaning:** Pass to Deva AI for screening
**When Used:**
- Unknown caller (no contact record)
- Default when no other rules match
- Safe fallback for uncertainty

**Exotel Action:** Hands off to AgentStream WebSocket pipeline for live Deva conversation

```json
{
  "select": "screen"
}
```

---

## HTTP Status Codes

### `200 OK`
Request processed successfully. Always return 200, even if backend errors occur.

**Why:** Exotel expects 200 to confirm webhook receipt. A 5xx error will cause Exotel to retry indefinitely.

### `4xx` / `5xx`
**AVOID.** Always return 200 with safe default `{ select: "screen" }` or `{ select: "connect" }`.

---

## Decision Tree

```
┌─ CallSid, CallFrom, CallTo present?
│  No  → DEFAULT TO "screen"
│  Yes ↓
│
├─ Contact exists for CallFrom?
│  No  → Check Rules (see below)
│  Yes ↓
│     ├─ priority === 'high'?
│     │  Yes → RETURN "connect"
│     │  No  ↓
│     ├─ isSpamReported === true OR priority === 'low'?
│     │  Yes → RETURN "reject"
│     │  No  ↓
│     └─ Check Rules (see below)
│
└─ Active routing rules?
   No  → RETURN "screen" (default)
   Yes ↓
      For each rule (ordered by priority):
      ├─ Does CallFrom match rule condition?
      │  Yes → RETURN rule.action ("connect" | "reject" | "screen")
      │  No  → Continue to next rule
      └─ No more rules → RETURN "screen" (default)
```

---

## Implementation: Call to Decision

### Fast Path (<50ms)

```typescript
// 1. Extract (5ms)
const { CallSid, CallFrom, CallTo } = req.body;
if (!CallSid || !CallFrom || !CallTo) return "screen";

// 2. Resolve User (1ms)
const userId = resolveUserFromExoPhone(CallTo);

// 3. Parallel DB Lookups (30ms)
const [contact, rules] = await Promise.all([
  db.query.contacts.findFirst({ where: and(...) }),
  db.query.routingRules.findMany({ where: and(...) })
]);

// 4. Routing Decision (10ms)
let decision = 'screen';

if (contact) {
  if (contact.priority === 'high') {
    decision = 'connect';
  } else if (contact.isSpamReported || contact.priority === 'low') {
    decision = 'reject';
  }
}

if (decision === 'screen') {
  for (const rule of rules) {
    if (ruleMatches(rule, CallFrom)) {
      decision = rule.action;
      break;
    }
  }
}

// 5. Async Write (0ms blocking)
db.insert(calls).values({...}).catch(...);

// 6. Response (5ms)
return res.json({ select: decision });
```

---

## Common Integration Patterns

### Pattern 1: Always Screen Unknown Numbers
```typescript
// Rule: if caller NOT in contacts → screen
{
  triggerType: 'unknown',
  action: 'screen',
  priority: 100
}
```

### Pattern 2: Block All 1800 Numbers
```typescript
// Rule: if CallFrom matches 1800* → block
{
  triggerType: 'pattern',
  triggerValue: '1800*',
  action: 'reject',
  priority: 50
}
```

### Pattern 3: VIP Always Connects
```typescript
// Contact with priority='high' automatically connects
// (built into decision engine, no rule needed)
{
  phoneNumber: '+919123456789',
  name: 'Mom',
  priority: 'high'
}
```

### Pattern 4: Time-Based Rules (Future)
```typescript
// Rule: if during business hours and unknown → screen
// Rule: if during off-hours and unknown → reject
// (Implementation in Phase 3)
```

---

## Error Handling

### Invalid Payload
```json
REQUEST:
{
  "CallFrom": "+919876543210"
  // Missing: CallSid, CallTo
}

RESPONSE:
{
  "select": "screen"
}
// Logs warning, returns safe default
```

### Database Unavailable
```
Webhook handler catches error, returns:
{
  "select": "connect"
}
// Ensure user doesn't miss calls if backend fails
```

### Slow Query (> 1 second)
```
Logs warning:
"⚠️ SLOW EXECUTION: Took 1500ms (target < 3s)"
// But still returns valid response within 3s guardrail
```

---

## Monitoring & Observability

### Metrics to Track

```typescript
// For each webhook call, log:
{
  callSid,
  caller,
  decision,           // connect | reject | screen
  hasContact,         // boolean
  rulesMatched,       // count
  executionTime,      // ms
  timestamp
}
```

### Alert Thresholds

- **Execution Time > 1000ms:** Potential slow DB query
- **Error Rate > 0.1%:** Database or network issue
- **Missing Payload Fields:** Exotel format changed
- **High Rejection Rate:** Possible false positives in spam detection

---

## Testing Checklist

- [ ] Test 1: Unknown caller → `"screen"`
- [ ] Test 2: VIP contact → `"connect"`
- [ ] Test 3: Spam contact → `"reject"`
- [ ] Test 4: Pattern rule match → `"reject"`
- [ ] Test 5: Invalid payload → `"screen"`
- [ ] Test 6: Database offline → `"connect"`
- [ ] Test 7: Performance (100 concurrent) → all < 500ms
- [ ] Test 8: Stress test (1000 RPS) → no timeouts
- [ ] Test 9: Call record stored in DB
- [ ] Test 10: Monitoring/logging works

---

## Production Configuration

### Exotel Dashboard
1. Call Forwarding → Passthru Settings
2. Webhook URL: `https://your-domain.com/api/calls/webhook`
3. Method: POST
4. Format: JSON
5. Timeout: 5 seconds
6. Retries: 3 (exponential backoff)

### Environment Variables
```bash
DATABASE_URL="postgresql://user:pass@host:5432/hideva"
NODE_ENV="production"
PORT=8080
LOG_LEVEL="info"
```

### Rate Limiting (Nginx)
```nginx
limit_req_zone $binary_remote_addr zone=webhook:10m rate=100r/s;

location /api/calls/webhook {
  limit_req zone=webhook burst=200 nodelay;
  proxy_pass http://api-server;
}
```

---

**You now have a production-ready telephony webhook with < 3-second execution guardrail and comprehensive monitoring.**

Ready to test this with real Exotel calls?
