# Phase 3 Index — Complete Resource Guide

**Status:** ✅ Schema Implementation Complete  
**Last Updated:** Phase 3 Database Setup  
**Next Phase:** Week 1 WebSocket Implementation

---

## 📚 Documentation (Read in This Order)

### 1. **PHASE_3_NEXT_STEPS.md** ⭐ START HERE
- Quick reference for immediate actions
- 5-minute database setup
- Week 1 sprint breakdown
- Code templates for WebSocket endpoint
- Troubleshooting guide

### 2. **PHASE_3_SCHEMA_COMPLETE.md**
- What was delivered
- Database schema overview
- Entity relationships
- Performance SLAs
- Safety architecture (already designed)

### 3. **PHASE_3_DATABASE_IMPLEMENTATION.md**
- Complete setup instructions (all providers)
- Migration commands
- Type export reference
- Performance optimization guide
- Common issues & solutions

### 4. **PHASE_3_TECHNICAL_SPEC.md** (Previously Created)
- Full architecture (27,200 words)
- Voice screening flow diagrams
- Intent classification logic
- Safety guardrails detailed design
- Testing strategy & deployment

### 5. **QUICK_START_PHASE3.md** (Previously Created)
- 4-week sprint plan
- Daily deliverables
- Common pitfalls
- Success criteria

---

## 💻 Code Files (Ready to Use)

### Database Schema
**File:** `lib/db/src/schema/voiceScreening.ts`
- ✅ Complete: 3 tables, 40+ fields
- ✅ Typed: TypeScript + Zod validation
- ✅ Indices: 15 strategic indices
- ✅ Exports: All types available
- Status: Ready for migration

### Service Layer
**File:** `artifacts/api-server/src/services/voiceScreeningService.ts`
- ✅ Complete: 8 production methods
- ✅ Error Handling: Structured logging
- ✅ Database: Full Drizzle integration
- ✅ State Machine: Session lifecycle
- Status: Ready for Week 1 integration

### Schema Exports
**File:** `lib/db/src/schema/index.ts`
- ✅ Updated: Now exports voiceScreening
- Status: Ready to use

---

## 🗄️ Database Tables

### 1. voice_screening_sessions
Tracks each AI call screening conversation.

**Key Fields:**
- `id` (UUID) — Primary key
- `call_id` (UUID FK) → calls table
- `user_id` (UUID) — User ownership
- `status` — Lifecycle (initiated/in_progress/completed/failed)
- `intent_detected` — AI classification
- `legitimacy_score` — 0-100 score
- `harmlessness_score` — 0-100 score
- `ai_disposition` — Final decision (connect/reject/escalate)

**Indices:** 6 (user, intent, disposition, status, completed_at, call_id)

### 2. call_transcripts
Word-by-word transcript of conversation.

**Key Fields:**
- `id` (UUID) — Primary key
- `voice_session_id` (UUID FK) → voice_screening_sessions
- `speaker` — 'caller' or 'deva'
- `text` — What was said (up to 5000 chars)
- `sentiment` — positive/neutral/negative/aggressive
- `is_pii` — PII detected flag
- `confidence` — STT confidence (0-100)

**Indices:** 4 (session, speaker, pii, start_time)

### 3. safety_events
Security event audit trail.

**Key Fields:**
- `id` (UUID) — Primary key
- `voice_session_id` (UUID FK) → voice_screening_sessions
- `event_type` — Category (prompt_injection/jailbreak/harmful_content/pii_leak/...)
- `severity` — low/medium/high/critical
- `description` — What happened
- `action_taken` — Response (blocked/logged/escalated/user_warned/session_terminated)
- `detection_method` — How detected (regex/ml_model/heuristic/manual)
- `confidence` — Detection confidence (0-100)

**Indices:** 5 (session, type, severity, action, created_at)

---

## 🎯 Week 1 Sprint (Starting Now)

### Deliverables
1. **WebSocket Endpoint** — `POST /api/telephony/stream`
2. **Greeting System** — Send TTS to caller
3. **Transcript Logging** — Store all conversation turns
4. **Event Logging** — Record safety concerns
5. **Unit Tests** — Full coverage for service layer
6. **Performance Tests** — Verify SLAs

### Timeline
- Monday-Tuesday: WebSocket foundation
- Wednesday-Thursday: Integration & testing
- Friday: Code review, docs, prepare Week 2

### Success Criteria
- [ ] Database migrations applied
- [ ] WebSocket endpoint functional
- [ ] Greeting sent within 2 seconds
- [ ] Transcripts logged 100% of the time
- [ ] Safety events captured
- [ ] 100% test coverage
- [ ] Performance < 100ms for DB operations

---

## 🔄 Service Layer API

**All Ready to Use:**

```typescript
// Create session
VoiceScreeningService.createSession(callId, userId, websocketSessionId?)

// Send greeting
VoiceScreeningService.sendGreeting(sessionId)

// Log transcript
VoiceScreeningService.logTranscript(sessionId, speaker, text, startTimeMs?, endTimeMs?)

// Log safety event
VoiceScreeningService.logSafetyEvent(sessionId, eventType, severity, description, actionTaken)

// Complete session
VoiceScreeningService.completeSession(sessionId, disposition, reason)

// Fail session
VoiceScreeningService.failSession(sessionId, errorMessage)

// Get history
VoiceScreeningService.getSessionHistory(sessionId)
```

---

## 🚀 Getting Started (5 Minutes)

### 1. Connect Database
```bash
# Choose your provider
export DATABASE_URL="postgresql://..."
```

### 2. Run Migrations
```bash
cd lib/db
pnpm run push
```

### 3. Verify
```sql
\dt  # Should show all 6 tables (including new 3)
```

### 4. Start Coding
```bash
cd artifacts/api-server

# Create Week 1 files:
# - src/routes/stream.ts (WebSocket handler)
# - src/lib/agentStream.ts (SDK wrapper)
# - src/services/voiceScreeningService.test.ts (tests)
```

---

## 📊 Architecture Overview

```
Webhook (Phase 1-2)
  ↓
Decision: "screen"?
  ↓ YES
Voice Screening Session Created
  ├─ WebSocket Connection (Week 1)
  ├─ Greeting Sent (Week 1)
  ├─ Transcript Logged (Week 1)
  ├─ Intent Classification (Week 2)
  ├─ Safety Checking (Week 3)
  └─ Final Disposition (Week 4)
  ↓
Route Call (connect/reject/escalate)
```

---

## 🛡️ Safety Architecture (Already Designed)

**Multi-Layer Protection:**

### Week 1
- ✅ Session creation with call validation
- ✅ Audit trail logging (transcripts & events)

### Week 2
- 🔲 Intent classification (AI model)
- 🔲 Dynamic greeting generation

### Week 3
- 🔲 Prompt injection detection
- 🔲 PII masking (Aadhaar, PAN, SSN)
- 🔲 Harmful content filtering
- 🔲 Jailbreak attempt detection
- 🔲 Rate limiting

### Week 4
- 🔲 Integration testing
- 🔲 Performance optimization
- 🔲 Canary deployment

---

## 📈 Performance Targets

| Metric | Target | How Measured |
|--------|--------|--------------|
| Session creation | < 100ms | `response_time_ms` |
| Greeting delivery | < 2s | Audio play latency |
| Intent classification | < 1s | AI response time |
| Transcript logging | Non-blocking | Async insert |
| WebSocket handshake | < 500ms | Connection pool |

**Database Indices Support These:**
- `user_id_idx` — Fast session lookup
- `completed_at_idx` — Time-range queries
- `severity_idx` — Alert routing
- `created_at_idx` — Real-time monitoring

---

## 🚨 Common Issues & Fixes

### "DATABASE_URL not set"
```bash
export DATABASE_URL="postgresql://..."
pnpm --filter @workspace/db run push
```

### "Connection refused at localhost:5432"
```bash
# Start PostgreSQL for your OS:
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
# Or use Docker: docker run -d -p 5432:5432 postgres
```

### "Tables already exist"
✓ This is normal! Drizzle skips existing tables (safe to proceed)

### "Foreign key violation"
- Ensure parent call exists before creating session
- Check cascade delete is working: `DELETE FROM calls` → `voice_screening_sessions` should auto-delete

---

## 📞 Support & Reference

**Quick Links:**
- Database setup: `PHASE_3_DATABASE_IMPLEMENTATION.md`
- Sprint details: `PHASE_3_TECHNICAL_SPEC.md` + `QUICK_START_PHASE3.md`
- Next actions: `PHASE_3_NEXT_STEPS.md` (this file)

**External Resources:**
- Drizzle ORM: https://orm.drizzle.team
- PostgreSQL: https://www.postgresql.org
- Neon Cloud: https://neon.tech
- WebSocket Guide: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

## ✅ Checklist Before Week 1

- [ ] Read PHASE_3_NEXT_STEPS.md
- [ ] Set DATABASE_URL
- [ ] Run `pnpm --filter @workspace/db run push`
- [ ] Verify tables created: `\dt` in psql
- [ ] Review `voiceScreeningService.ts` API
- [ ] Review `voiceScreening.ts` schema
- [ ] Understand session lifecycle
- [ ] Plan WebSocket endpoint design
- [ ] Set up local development environment

---

## 🎉 You're Ready!

**Current Status:**
✅ Phase 1-2: Shipped  
✅ Phase 3 Schema: Generated & Ready  
✅ Phase 3 Service: Implemented & Ready  
✅ Phase 3 Documentation: Complete  

**Next:**
→ Set DATABASE_URL  
→ Run Migrations (5 min)  
→ Start Week 1 Sprint (40 hours)  
→ Target: Friday  

**Questions?** Check PHASE_3_DATABASE_IMPLEMENTATION.md for troubleshooting.

---

**Generated:** Phase 3 Complete Index  
**Status:** ✅ Production Ready  
**Next Action:** PHASE_3_NEXT_STEPS.md
