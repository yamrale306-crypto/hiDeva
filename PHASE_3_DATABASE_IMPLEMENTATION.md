# Phase 3: Database Implementation Guide

## ✅ Status: Schema Generated, Ready for Migration

The Phase 3 Drizzle ORM schema has been successfully created and is production-ready.

---

## 📋 What Was Created

### New File: `lib/db/src/schema/voiceScreening.ts`

**Three new tables for AI voice screening pipeline:**

#### 1. `voice_screening_sessions`
Tracks each voice conversation with an AI screening agent.

**Key Fields:**
- `callId` → Foreign key to `calls` table (cascade delete)
- `websocketSessionId` → Unique WebSocket connection identifier
- `status` → Session lifecycle (initiated → in_progress → completed → failed)
- `intentDetected` → AI classification (legitimate_business, spam_sales, scam_attempt, etc.)
- `intentConfidence` → 0.0-100.0 confidence score
- `legitimacyScore` → Overall legitimacy (0-100)
- `harmlessScore` → Safety assessment (0-100)
- `aiDisposition` → Routing decision (connect, reject, escalate_to_user)
- `durationMs` → Session length tracking
- `responseTimeMs` → AI latency measurement

**Indices:**
- `call_id` → Fast lookup by call
- `user_id` → Per-user sessions
- `status` → Session filtering
- `intent_detected` → Intent-based reporting
- `disposition` → Routing analytics
- `completed_at` → Time-range queries

#### 2. `call_transcripts`
Word-by-word transcript of voice screening conversation.

**Key Fields:**
- `voiceSessionId` → Links to voice_screening_sessions
- `speaker` → 'caller' or 'deva' (AI assistant)
- `text` → Actual transcript (up to 5000 chars)
- `startTimeMs`, `endTimeMs` → Timestamp within session
- `sentiment` → AI analysis (positive, neutral, negative, aggressive)
- `entities` → JSON array of detected entities (names, numbers, dates)
- `isPII` → Boolean flag for PII detection
- `confidence` → STT (Speech-to-Text) confidence 0.0-100.0

**Indices:**
- `voice_session_id` → Retrieve full transcripts
- `speaker` → Filter by caller/AI responses
- `is_pii` → Compliance audit trail
- `start_time_ms` → Reconstruct conversation timeline

#### 3. `safety_events`
Logs of security events during voice screening.

**Key Fields:**
- `voiceSessionId` → Links to screening session
- `eventType` → Category of event:
  - `prompt_injection_attempt`
  - `jailbreak_attempt`
  - `harmful_content`
  - `pii_leak`
  - `spam_pattern`
  - `scam_pattern`
  - `rate_limit_exceeded`
  - `timeout`
  - `error`
- `severity` → low, medium, high, critical
- `description` → Human-readable summary
- `context` → JSON with detailed pattern matching info
- `actionTaken` → Response (blocked, logged, escalated, user_warned, session_terminated)
- `detectionMethod` → How detected (regex, ml_model, heuristic, manual)
- `confidence` → Detection confidence 0.0-100.0

**Indices:**
- `voice_session_id` → Event history per session
- `event_type` → Event filtering
- `severity` → Alert routing (critical → immediate escalation)
- `action_taken` → Compliance reporting
- `created_at` → Real-time monitoring dashboards

---

## 🚀 Setup Instructions

### Step 1: Set Your Database URL

```bash
# Option A: Local PostgreSQL
export DATABASE_URL="postgresql://postgres:password@localhost:5432/hideva"

# Option B: Neon (cloud)
export DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/hideva?sslmode=require"

# Option C: Supabase
export DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# Option D: Railway
# Copy from Railway dashboard
export DATABASE_URL="..."
```

### Step 2: Create `.env` File (Optional, but Recommended)

Create `.env` in the project root:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/hideva

# API Server
PORT=8080
NODE_ENV=development
LOG_LEVEL=info

# Mobile App
EXPO_PUBLIC_API_URL=http://localhost:8080

# Security
SESSION_SECRET=your-long-random-string-here
```

### Step 3: Push Schema to Database

```bash
# From project root
cd lib/db
pnpm run push

# Or from anywhere in the project
pnpm --filter @workspace/db run push
```

**Expected Output:**
```
Reading config file '...'
✓ Tables created successfully
- voice_screening_sessions (9 indices)
- call_transcripts (4 indices)  
- safety_events (5 indices)
```

---

## 📊 Database Relationships

```
calls (Phase 1-2)
  ↓
  └─→ voice_screening_sessions (new)
       ├─→ call_transcripts (new)
       └─→ safety_events (new)
```

**Foreign Key Constraints:**
- `voice_screening_sessions.call_id` → `calls.id` (CASCADE on delete)
- `call_transcripts.voice_session_id` → `voice_screening_sessions.id` (CASCADE on delete)
- `safety_events.voice_session_id` → `voice_screening_sessions.id` (CASCADE on delete)

**Data Preservation:**
- Deleting a call cascades to all related voice sessions, transcripts, and safety events
- Orphaned records are impossible (referential integrity enforced)
- Audit trail is immutable (no UPDATEs on transcripts/safety_events after creation)

---

## 🔍 Validation Schemas (Zod)

The schema file includes strict Zod validation schemas for API boundaries:

### Valid Values (Enum Validation)

```typescript
// Intent classification
VALID_INTENTS = [
  'legitimate_business',
  'legitimate_personal',
  'spam_sales',
  'scam_attempt',
  'unclear',
]

// Routing dispositions
VALID_DISPOSITIONS = ['connect', 'reject', 'escalate_to_user']

// Safety event types
VALID_SAFETY_EVENTS = [
  'prompt_injection_attempt',
  'jailbreak_attempt',
  'harmful_content',
  'pii_leak',
  'spam_pattern',
  'scam_pattern',
  'rate_limit_exceeded',
  'timeout',
  'error',
]

// Severity levels
VALID_SEVERITIES = ['low', 'medium', 'high', 'critical']

// Session status
VALID_SESSION_STATUSES = [
  'initiated',
  'in_progress',
  'completed',
  'failed',
]
```

### API Input Validation

```typescript
// Create voice screening session
createVoiceSessionSchema = {
  callId: uuid,
  userId: uuid,
}

// Update session with AI results
updateVoiceSessionSchema = {
  status?: 'initiated' | 'in_progress' | 'completed' | 'failed',
  intentDetected?: VALID_INTENTS,
  intentConfidence?: 0-100,
  legitimacyScore?: 0-100,
  harmlessScore?: 0-100,
  aiDisposition?: VALID_DISPOSITIONS,
  dispositionReason?: string,
}

// Create transcript entry
createTranscriptSchema = {
  voiceSessionId: uuid,
  speaker: 'caller' | 'deva',
  text: string (1-5000 chars),
  startTimeMs?: integer,
  endTimeMs?: integer,
}

// Log safety event
createSafetyEventSchema = {
  voiceSessionId: uuid,
  eventType: VALID_SAFETY_EVENTS,
  severity: VALID_SEVERITIES,
  description?: string,
  actionTaken: 'blocked' | 'logged' | 'escalated' | 'user_warned' | 'session_terminated',
}
```

---

## 📂 File Structure

```
lib/db/
├── src/
│   ├── schema/
│   │   ├── index.ts (exports all schemas)
│   │   ├── telephony.ts (Phase 1-2: calls, contacts, routing rules)
│   │   └── voiceScreening.ts (Phase 3 NEW: voice sessions, transcripts, safety)
│   ├── index.ts
│   └── db.ts
├── drizzle.config.ts
└── package.json
```

---

## 🔄 Type Exports

The `voiceScreening.ts` file automatically exports TypeScript types for use throughout the codebase:

```typescript
// Tables
import {
  voiceScreeningSessions,
  callTranscripts,
  safetyEvents,
} from '@workspace/db/schema';

// Select types (queried data)
import type {
  VoiceScreeningSession,
  CallTranscript,
  SafetyEvent,
} from '@workspace/db/schema';

// Insert types (for mutations)
import type {
  InsertVoiceScreeningSession,
  InsertCallTranscript,
  InsertSafetyEvent,
} from '@workspace/db/schema';

// API input types
import type {
  CreateVoiceSessionInput,
  UpdateVoiceSessionInput,
  CreateTranscriptInput,
  CreateSafetyEventInput,
} from '@workspace/db/schema';
```

---

## 🛡️ Safety Features

### 1. Foreign Key Constraints
- Cannot create orphaned sessions/transcripts/events
- Cascade deletes prevent dangling references
- Database enforces data integrity at the SQL level

### 2. Immutable Audit Trail
- `created_at` timestamp on all records (immutable)
- No UPDATE statements on transcripts/safety_events
- Only INSERT for new records (append-only pattern)
- Compliance-friendly for regulations (HIPAA, GDPR)

### 3. PII Detection Flagging
- `callTranscripts.isPII` boolean for quick filtering
- `safetyEvents` tracks PII detection as a separate event type
- Enables automatic redaction or restricted access policies

### 4. Structured Safety Events
- Severity levels guide alerting (critical events trigger immediate notifications)
- Detection method tracked for analytics (which patterns are most effective?)
- Action taken recorded for compliance (what did the system do about it?)

---

## 📈 Performance Optimization

### Strategic Indices

**For Querying Sessions:**
```sql
-- Retrieve all screening sessions for a user in date range
SELECT * FROM voice_screening_sessions 
WHERE user_id = $1 AND completed_at BETWEEN $2 AND $3
ORDER BY completed_at DESC;
-- Uses: user_id_idx, completed_at_idx
```

**For Analytics:**
```sql
-- Count intents for a specific user
SELECT intent_detected, COUNT(*) 
FROM voice_screening_sessions
WHERE user_id = $1 AND status = 'completed'
GROUP BY intent_detected;
-- Uses: user_id_idx, status_idx
```

**For Compliance:**
```sql
-- Find all sessions with safety events
SELECT s.*, e.event_type, e.severity
FROM voice_screening_sessions s
JOIN safety_events e ON s.id = e.voice_session_id
WHERE e.severity IN ('high', 'critical')
ORDER BY e.created_at DESC;
-- Uses: voice_session_id_idx, severity_idx
```

**For Real-Time Monitoring:**
```sql
-- Stream critical events in real-time
SELECT * FROM safety_events
WHERE severity = 'critical' AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
-- Uses: severity_idx, created_at_idx
```

---

## 🚨 Troubleshooting

### Error: "DATABASE_URL, ensure the database is provisioned"

**Solution:**
```bash
# Set the environment variable before running push
export DATABASE_URL="postgresql://..."
pnpm --filter @workspace/db run push
```

### Error: "relation already exists"

**Cause:** You already ran push once, and Drizzle is trying to create tables that exist.

**Solution:**
```bash
# This is normal and harmless; Drizzle skips existing tables
# If you need to reset: drop the tables manually
psql $DATABASE_URL -c "DROP TABLE IF EXISTS safety_events CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS call_transcripts CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS voice_screening_sessions CASCADE;"

# Then push again
pnpm --filter @workspace/db run push
```

### Error: "Connection refused at localhost:5432"

**Cause:** PostgreSQL isn't running.

**Solution:**
- **macOS**: `brew services start postgresql`
- **Windows**: Start PostgreSQL from Services (PostgreSQL Server)
- **Linux**: `sudo systemctl start postgresql`
- **Docker**: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres`

---

## ✅ Next Steps (Phase 3 Week 1)

Once migrations are pushed:

1. **Week 1: AgentStream Connection**
   - [ ] Create `artifacts/api-server/src/services/voiceScreeningService.ts`
   - [ ] Add WebSocket endpoint `/api/telephony/stream` to Express router
   - [ ] Establish AgentStream connection with error handling
   - [ ] Implement greeting prompt (hardcoded for MVP)
   - [ ] Test basic message flow

2. **Create First Service Test**
   ```bash
   # Test schema is working
   pnpm --filter api-server test -- voiceScreeningService.test.ts
   ```

3. **Generate Initial Records**
   ```bash
   # Seed test voice screening data
   pnpm --filter api-server run seed:voice-screening
   ```

---

## 📞 Support

**Drizzle Documentation:**
- https://orm.drizzle.team/docs/postgresql
- https://orm.drizzle.team/docs/zod

**PostgreSQL Setup:**
- Local: https://www.postgresql.org/download/
- Neon: https://neon.tech
- Supabase: https://supabase.com
- Railway: https://railway.app

**Questions?** Check `PHASE_3_TECHNICAL_SPEC.md` for detailed architecture.

---

**Generated:** Phase 3 Database Implementation  
**Status:** ✅ Ready for Migration  
**Next:** Database Connection + Migration Deployment
