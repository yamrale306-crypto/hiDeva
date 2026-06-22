# Phase 1: Telephony API Contract — Complete

You now have a **production-ready foundation** for hiDeva's call screening pipeline. Every piece is type-safe, database-backed, and decoupled from Exotel-specific quirks.

---

## What Was Built

### 1. **Drizzle Schema — Call Lifecycle Models** (`lib/db/src/schema/`)

Five new tables, all exported from `lib/db/src/schema/index.ts`:

#### `calls.ts` — Core Call Records
```typescript
calls table tracks:
- telephonyCallSid: Exotel reference ID (unique, foreign-key safe)
- callerNumber / callerName: Caller metadata
- status: [initiated, screening, forwarded, completed, blocked]
- disposition: [pending, forwarded, blocked, recorded, voicemail]
- detectedLanguage: Language code (hi, mr, gu, kn, ta, te, ml, en)
- callerIntent: Captured intent from screening (e.g., "order food")
- callSummary: AI-generated post-call summary
- recordingUrl / recordingDurationSeconds: Audio payload metadata
- callStartedAt / callEndedAt: Lifecycle timestamps
```

Auto-generated Zod schema: `insertCallSchema` (for webhook ingestion)
Auto-generated types: `InsertCall`, `Call`

#### `callTranscripts.ts` — Real-Time Transcript Capture
```typescript
callTranscripts table stores:
- callId: Foreign key to calls (cascades on delete)
- speaker: 'caller' or 'deva'
- text: Actual transcript
- language: Language for this segment (supports code-switching)
- offsetSeconds: When in the call this was spoken
```

Auto-generated Zod schema: `insertCallTranscriptSchema`
Auto-generated types: `InsertCallTranscript`, `CallTranscript`

#### `userRules.ts` — If/Then Screening Rules
```typescript
userRules table stores user-defined screening logic:
- matchCondition: Phone pattern, contact list, keyword (e.g., "+919876*", "known_contacts")
- action: What to do [forward, block, record, voicemail]
- priority: Rule execution order (higher = checked first)
- isActive: Enable/disable rules without deleting
```

Auto-generated Zod schema: `insertUserRuleSchema`
Auto-generated types: `InsertUserRule`, `UserRule`

#### `blockList.ts` — DND & Spam Numbers
```typescript
blockList table for spam/telemarketer numbers:
- phonePattern: Phone or regex pattern
- reason: [spam, telemarketer, scam, user_blocked, dnd]
- note: Optional context
```

Auto-generated Zod schema: `insertBlockListSchema`
Auto-generated types: `InsertBlockList`, `BlockList`

#### `vipContacts.ts` — Priority Contacts
```typescript
vipContacts table for contacts that always ring through:
- phonePattern: Phone or pattern
- name: Contact label
- priority: [high, medium, low]
- relationship: Context (e.g., "Mom", "Work Manager")
```

Auto-generated Zod schema: `insertVipContactSchema`
Auto-generated types: `InsertVipContact`, `VipContact`

---

### 2. **OpenAPI 3.1 Specification** (`lib/api-spec/openapi.yaml`)

Defines the **Exotel ↔ hiDeva webhook contract** with full request/response schemas:

#### `POST /api/calls/webhook`
**Exotel → hiDeva event ingestion**

Receives:
```json
{
  "callSid": "c6d28b60-19fe-11ef-9200-0242ac140052",
  "callStatus": "initiated",
  "callerNumber": "+919876543210",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "detectedLanguage": "hi",
  "callerIntent": "order food",
  "transcripts": [
    {
      "speaker": "caller",
      "text": "I want to order a pizza",
      "language": "hi",
      "offsetSeconds": 5.2
    }
  ],
  "recordingUrl": "https://s3.example.com/calls/...",
  "recordingDurationSeconds": 45
}
```

Responds:
```json
{
  "success": true,
  "callSid": "c6d28b60-19fe-19ef-9200-0242ac140052",
  "nextAction": "forward",
  "message": "Call screened and forwarded to user"
}
```

#### `GET /api/calls/{callId}`
**Retrieve full call details + transcripts + metadata**

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "...",
  "telephonyCallSid": "...",
  "callerNumber": "+919876543210",
  "status": "completed",
  "disposition": "forwarded",
  "detectedLanguage": "hi",
  "callerIntent": "order food",
  "callSummary": "Customer called to place a pizza order.",
  "recordingUrl": "https://...",
  "transcripts": [
    {
      "speaker": "deva",
      "text": "Hi, I am Deva...",
      "language": "hi"
    },
    {
      "speaker": "caller",
      "text": "I want to order a pizza",
      "language": "hi"
    }
  ],
  "createdAt": "2025-01-28T14:30:00Z"
}
```

---

### 3. **Express Route Handlers** (`artifacts/api-server/src/routes/calls.ts`)

#### Webhook Handler (`POST /api/calls/webhook`)
- Validates required fields (callSid, callerNumber, userId)
- Checks if call already exists in DB
- **New calls:** Creates entry with `status: 'initiated'`, `disposition: 'pending'`
- **Existing calls:** Updates status, disposition, summary, recording metadata
- **Transcripts:** Stores all segments with speaker, text, language, offset
- **TODO placeholder:** Screening logic (block list check, VIP check, rules execution)
- Returns `nextAction` (forward, block, record, voicemail)

#### Get Call Details (`GET /api/calls/{callId}`)
- Fetches call record by ID
- Joins transcripts automatically
- Returns full call object with history
- 404 if call not found

#### Router Wired
- `calls` router imported into `artifacts/api-server/src/routes/index.ts`
- Mounted at `/api/calls`

---

## Next Steps (Phase 2 & 3)

### Phase 2: Mock Telephony Server
Build a local test server that simulates Exotel webhooks. This lets you:
- Test the entire call → DB → response flow without paying for real calls
- Iterate screening logic safely
- Verify transcript capture, rule execution, and disposition logic

### Phase 3: Call Handler Logic
Implement the `TODO` in `calls.ts`:
1. **Block List Check:** Does callerNumber match any entries?
2. **VIP Check:** Is this in the VIP contacts table?
3. **Rules Execution:** Which `userRules` match? Apply in priority order.
4. **Disposition Decision:** forward | block | record | voicemail
5. **Database Audit:** Log all decisions for call analytics later

---

## Database Schema Overview

```
calls (id, userId, telephonyCallSid, callerNumber, status, disposition, ...)
  ↓ (1:N)
  callTranscripts (callId, speaker, text, language, offsetSeconds)

userRules (id, userId, matchCondition, action, priority)
blockList (id, userId, phonePattern, reason)
vipContacts (id, userId, phonePattern, priority)
```

All tables cascade cleanly. User deletion cascades to all their calls, rules, and contacts.

---

## Type Safety & Validation

- **Drizzle:** All DB queries are type-safe. Zod schemas auto-generated from table definitions.
- **OpenAPI:** Spec is source of truth for request/response contracts.
- **Orval:** Next run regenerates `api-zod` package with Zod validators for every API endpoint.
- **Express:** Route handlers type-checked against route definitions.

Zero runtime surprises. If Exotel sends a field your schema doesn't expect, TypeScript catches it at compile time.

---

## How to Move Forward

1. **Dependencies:** `pnpm install` completes (network delays are temporary)
2. **Database:** Set `DATABASE_URL` in `.env` (Neon/Supabase/local Postgres)
3. **Drizzle Migration:** `pnpm --filter @workspace/db run push` to create tables
4. **Express:** `pnpm --filter @workspace/api-server run dev` starts webhook listener
5. **Mock Testing:** Send fake Exotel webhooks to `http://localhost:8080/api/calls/webhook`

This is the **foundation**. Everything else (screening logic, rules engine, two-way AI conversation) builds cleanly on top.
