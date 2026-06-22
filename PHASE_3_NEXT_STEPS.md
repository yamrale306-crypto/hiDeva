# ⚡ Phase 3: Next Steps (Quick Reference)

**Current Status:** Schema implementation complete, ready for database migration  
**Time to Full Database Setup:** 5 minutes  
**Time to Week 1 Start:** Immediate after DB setup

---

## 🎯 Immediate Action (Do This Now)

### Step 1: Set Your Database Connection (Choose One)

**Option A: Local PostgreSQL** (Development)
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/hideva"
```

**Option B: Neon** (Cloud, free tier)
```bash
# 1. Sign up at https://neon.tech
# 2. Create project "hideva"
# 3. Copy connection string:
export DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/hideva?sslmode=require"
```

**Option C: Supabase** (PostgreSQL + extras)
```bash
# 1. Sign up at https://supabase.com
# 2. Create project
# 3. Copy connection string from dashboard:
export DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

**Option D: Railway** (CI/CD friendly)
```bash
# 1. Connect GitHub to Railway
# 2. Copy connection string from Railway dashboard
export DATABASE_URL="postgresql://..."
```

### Step 2: Run Database Migrations

```bash
# From project root
cd lib/db
pnpm run push

# You should see:
# ✓ Tables created successfully
# - voice_screening_sessions
# - call_transcripts
# - safety_events
```

✅ **Done!** Your database is ready.

---

## 📋 What Was Created

### In Your Database

```sql
-- Table 1: Voice Screening Sessions
CREATE TABLE voice_screening_sessions (
  id UUID PRIMARY KEY,
  call_id UUID FOREIGN KEY → calls,
  user_id UUID,
  status VARCHAR (initiated/in_progress/completed/failed),
  intent_detected VARCHAR (legitimate_business/spam/scam/unclear),
  legitimacy_score NUMERIC (0-100),
  harmlessness_score NUMERIC (0-100),
  ai_disposition VARCHAR (connect/reject/escalate_to_user),
  -- ... 20+ more fields
  created_at TIMESTAMP DEFAULT now()
);

-- Table 2: Call Transcripts
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY,
  voice_session_id UUID FOREIGN KEY → voice_screening_sessions,
  speaker VARCHAR (caller/deva),
  text TEXT (what was said),
  sentiment VARCHAR (positive/neutral/negative/aggressive),
  is_pii BOOLEAN (PII detected?),
  confidence NUMERIC (0-100) (STT confidence),
  created_at TIMESTAMP DEFAULT now()
);

-- Table 3: Safety Events
CREATE TABLE safety_events (
  id UUID PRIMARY KEY,
  voice_session_id UUID FOREIGN KEY → voice_screening_sessions,
  event_type VARCHAR (prompt_injection/jailbreak/harmful_content/pii_leak/...),
  severity VARCHAR (low/medium/high/critical),
  action_taken VARCHAR (blocked/logged/escalated/user_warned/session_terminated),
  created_at TIMESTAMP DEFAULT now()
);
```

### In Your Codebase

**New Files:**
- ✅ `lib/db/src/schema/voiceScreening.ts` (12,368 bytes)
  - 3 tables with full TypeScript typing
  - Zod validation schemas
  - API input/output types
  
- ✅ `artifacts/api-server/src/services/voiceScreeningService.ts` (12,991 bytes)
  - 8 production-ready methods
  - Error handling & logging
  - Database integration

**Updated Files:**
- ✅ `lib/db/src/schema/index.ts`
  - Now exports voiceScreening types

**Documentation:**
- ✅ `PHASE_3_DATABASE_IMPLEMENTATION.md` (12,450 bytes)
- ✅ `PHASE_3_SCHEMA_COMPLETE.md` (13,347 bytes)

---

## 🚀 Phase 3 Week 1: Your Next Sprint

**Goal:** Accept WebSocket connections, send greeting, log transcripts

### Deliverables (In Order)

#### 1. Express WebSocket Endpoint (1 hour)
**File:** `artifacts/api-server/src/routes/stream.ts`

```typescript
import { Router } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import VoiceScreeningService from '../services/voiceScreeningService';

const router = Router();

// Upgrade HTTP to WebSocket
router.ws('/stream', async (ws, req) => {
  try {
    // 1. Extract call ID from query params
    const { callId, userId } = req.query;
    
    // 2. Create voice screening session
    const session = await VoiceScreeningService.createSession(
      callId as string,
      userId as string,
      ws.url // Use WebSocket URL as session ID
    );
    
    // 3. Send greeting
    await VoiceScreeningService.sendGreeting(session.id);
    
    // 4. Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      // Parse binary audio frames from Exotel
      // TODO: Implement audio parsing
    });
    
    ws.on('close', async () => {
      // Clean up session
      await VoiceScreeningService.completeSession(
        session.id,
        'connect',
        'Caller disconnected'
      );
    });
  } catch (error) {
    logger.error('WebSocket error', error);
    ws.close(1008, 'Internal server error');
  }
});

export default router;
```

**Testing:**
```bash
# Test WebSocket connection
wscat -c "ws://localhost:8080/api/telephony/stream?callId=abc&userId=xyz"
```

#### 2. AgentStream Integration (1 hour)
**File:** `artifacts/api-server/src/lib/agentStream.ts`

```typescript
// Wrapper for Exotel AgentStream SDK
// Handles connection setup, binary frame parsing, and error recovery

export class AgentStreamClient {
  connect(sessionId: string) {
    // Connect to Exotel's WebSocket
  }
  
  sendAudio(buffer: Buffer) {
    // Send TTS audio to caller
  }
  
  onCallerAudio(callback: (buffer: Buffer) => void) {
    // Receive STT from caller
  }
}
```

#### 3. Transcript Logging (30 minutes)
**Implemented By:** Service layer ready

```typescript
// Already built in VoiceScreeningService
await VoiceScreeningService.logTranscript(
  sessionId,
  'caller', // or 'deva'
  'Hello, I want to cancel my order',
  100, // startTimeMs
  2500 // endTimeMs
);
```

#### 4. Unit Tests (2 hours)
**File:** `artifacts/api-server/src/services/voiceScreeningService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import VoiceScreeningService from './voiceScreeningService';

describe('VoiceScreeningService', () => {
  it('should create a session', async () => {
    const session = await VoiceScreeningService.createSession(
      'call-123',
      'user-456'
    );
    
    expect(session.id).toBeDefined();
    expect(session.status).toBe('initiated');
  });
  
  it('should log transcripts', async () => {
    // Test transcript logging...
  });
  
  it('should complete session with disposition', async () => {
    // Test session completion...
  });
});
```

### Week 1 Timeline

```
Day 1 (Monday)
  - Set up database (5 min)
  - Plan WebSocket endpoint (1 hour)
  - Start implementation (2 hours)

Day 2-3 (Tue-Wed)
  - Complete WebSocket endpoint (3 hours)
  - Integrate AgentStream SDK (2 hours)

Day 4 (Thursday)
  - Build unit tests (2 hours)
  - Test with mock client (1 hour)
  - Performance profiling (1 hour)

Day 5 (Friday)
  - Code review & refactoring (1 hour)
  - Documentation (1 hour)
  - Prepare for Week 2 AI integration (1 hour)

Total: 40 hours → Ship by Friday
```

---

## 📊 Database Verification

**Check that tables were created:**

```bash
# Connect to your database
psql $DATABASE_URL

# List tables
\dt

# Should show:
#           List of relations
# Schema |          Name           | Type  | Owner
#--------+-------------------------+-------+-------
# public | calls                   | table | postgres
# public | contacts                | table | postgres
# public | routing_rules           | table | postgres
# public | voice_screening_sessions| table | postgres
# public | call_transcripts        | table | postgres
# public | safety_events           | table | postgres

# Inspect voice_screening_sessions
\d voice_screening_sessions

# Inspect indices
\di
```

---

## 🔐 Data Integrity Check

**Verify foreign key constraints are in place:**

```sql
-- Should be enforced at database level
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'voice_screening_sessions'
AND constraint_type = 'FOREIGN KEY';

-- Should return:
-- voice_screening_sessions_call_id_fkey
```

**Test cascade delete:**

```sql
-- Create test call
INSERT INTO calls (id, user_id, telephony_call_sid, caller_number)
VALUES ('test-call', 'test-user', 'sid-123', '+919999999999');

-- Create test session
INSERT INTO voice_screening_sessions (id, call_id, user_id, status)
VALUES ('test-session', 'test-call', 'test-user', 'initiated');

-- Delete call (should cascade to session)
DELETE FROM calls WHERE id = 'test-call';

-- Verify session was deleted
SELECT * FROM voice_screening_sessions WHERE id = 'test-session';
-- Should return: (0 rows)
```

---

## 📞 Service Layer API Reference

**Already implemented and ready to use:**

```typescript
// Create session
const session = await VoiceScreeningService.createSession(
  callId,     // string (UUID)
  userId,     // string (UUID)
  websocketSessionId  // optional
);
// Returns: VoiceScreeningSession object

// Send greeting
const updated = await VoiceScreeningService.sendGreeting(sessionId);

// Log transcript
await VoiceScreeningService.logTranscript(
  sessionId,
  'caller' | 'deva',
  'Actual text',
  startTimeMs?,
  endTimeMs?
);

// Log safety event
await VoiceScreeningService.logSafetyEvent(
  sessionId,
  'prompt_injection_attempt' | 'jailbreak_attempt' | 'harmful_content' | ...,
  'low' | 'medium' | 'high' | 'critical',
  'Description',
  'blocked' | 'logged' | 'escalated' | 'user_warned' | 'session_terminated'
);

// Complete session
const final = await VoiceScreeningService.completeSession(
  sessionId,
  'connect' | 'reject' | 'escalate_to_user',
  'Reason for this decision'
);

// Get full history
const { session, transcripts, safetyEvents } = 
  await VoiceScreeningService.getSessionHistory(sessionId);
```

---

## 🎯 Success Criteria for Week 1

- [ ] Database migrations applied successfully
- [ ] WebSocket endpoint accepts connections at `/api/telephony/stream`
- [ ] Greeting is sent to caller within 2 seconds of connection
- [ ] Transcript logging works (caller + AI turns)
- [ ] Safety events can be logged with full context
- [ ] Session completes gracefully on disconnect
- [ ] 100% test coverage for service layer
- [ ] Performance: < 100ms for all DB operations
- [ ] Zero data loss: cascade deletes work correctly
- [ ] Error handling: graceful degradation on failures
- [ ] Logging: all operations logged with structured format
- [ ] Documentation: README updated for new endpoints

---

## 🚨 Troubleshooting

**Error: "DATABASE_URL not set"**
```bash
# Verify env var is set
echo $DATABASE_URL

# If empty, set it:
export DATABASE_URL="postgresql://..."
```

**Error: "Connection refused at localhost:5432"**
```bash
# Start PostgreSQL:
# macOS:
brew services start postgresql

# Windows: Start "PostgreSQL Server" from Services

# Linux:
sudo systemctl start postgresql

# Docker:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```

**Error: "relation already exists"**
```bash
# This is fine! Drizzle is idempotent
# Tables already created from previous push
# Safe to proceed to Week 1
```

**Error: "Foreign key violation"**
```bash
# You tried to create a session without a parent call
# Fix: Ensure call exists first
INSERT INTO calls (...) VALUES (...)  -- Then
INSERT INTO voice_screening_sessions (...) VALUES (...)
```

---

## 📚 Reference Material

**Documentation to Review:**

1. **PHASE_3_DATABASE_IMPLEMENTATION.md**
   - Full setup instructions
   - Provider-specific guides
   - Performance optimization

2. **PHASE_3_TECHNICAL_SPEC.md**
   - Complete architecture
   - Voice screening flow
   - Safety guardrails design

3. **QUICK_START_PHASE3.md**
   - 4-week sprint breakdown
   - Daily milestones
   - Common pitfalls

**Code to Study:**

1. `lib/db/src/schema/voiceScreening.ts`
   - Table definitions
   - Type exports
   - Validation schemas

2. `artifacts/api-server/src/services/voiceScreeningService.ts`
   - Ready-to-use methods
   - Error handling patterns
   - Database integration

---

## 🎉 You're All Set!

**Next Commands:**

```bash
# 1. Set database connection
export DATABASE_URL="postgresql://..."

# 2. Run migrations
cd lib/db && pnpm run push

# 3. Start coding Week 1
cd ../../artifacts/api-server

# 4. Create the WebSocket endpoint
# Create src/routes/stream.ts (use template above)

# 5. Run tests
pnpm test

# 6. Ship it! 🚀
```

**Estimated Time to Week 1 completion:** 40 hours  
**Date to target:** Next Friday  
**Current Status:** ✅ Ready to start immediately

---

**Generated:** Phase 3 Schema Implementation Complete  
**Next:** Set DATABASE_URL → Run Migrations → Week 1 Sprint  
**Questions?** Check PHASE_3_TECHNICAL_SPEC.md for detailed architecture
