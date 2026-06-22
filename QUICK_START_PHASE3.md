# Phase 3: Quick Start Guide

**Status:** Ready to build  
**Timeline:** 4 weeks  
**Owner:** Backend/AI Team  

---

## What's Phase 3?

Transform screening from silent to intelligent.

**Before (Phase 1-2):**  
Call arrives → Decision engine → Return: `{ select: "connect"|"reject"|"screen" }`

**After (Phase 3):**  
Call arrives → Decision says "screen" → AI greets caller → Conversation → Intent classification → Smart disposition

---

## Quick Setup

### 1. Database Migration

```bash
# Add 3 new tables
pnpm run db:migrate

# Verify
psql $DATABASE_URL \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

**Tables Created:**
- `voice_screening_sessions` (voice conversations)
- `call_transcripts` (who said what, when)
- `safety_events` (jailbreak attempts, PII detection)

### 2. Environment Setup

```bash
# Add to .env
AGENTSTREAM_URL=wss://stream.agentstream.com
AGENTSTREAM_TOKEN=sk-...
OPENAI_API_KEY=sk-...  # For embeddings/moderation

# Optional
VECTOR_DB_URL=https://pinecone.io/api  # For personal memory (Phase 3.5)
```

### 3. Code Changes

```bash
# New service
artifacts/api-server/src/services/voiceScreeningService.ts

# New DB schema
lib/db/src/schema/voiceScreening.ts

# Updated webhook handler
artifacts/api-server/src/routes/calls.ts (handle 'screen' decision)

# New endpoints
POST /api/calls/:callId/voice-screening/start
POST /api/calls/:callId/voice-screening/complete
GET /api/calls/:callId/voice-screening
```

### 4. Test Locally

```bash
# Unit tests
pnpm test:unit voiceScreening

# Integration tests
pnpm test:integration voiceScreening

# Load test with voice
pnpm test:stress --concurrent 10 --scenario voice
```

---

## Implementation Phases (Weekly)

### Week 1: WebSocket & Greeting
- [ ] AgentStream connection
- [ ] Greeting prompt
- [ ] Basic event handling
- [ ] Error recovery

**Test:** Can establish WebSocket and send greeting

### Week 2: Voice → Intent
- [ ] Speech-to-text
- [ ] Intent classification
- [ ] Confidence scoring
- [ ] Response generation

**Test:** Classify test calls (legitimate, spam, scam)

### Week 3: Safety & Persistence
- [ ] Jailbreak detection
- [ ] Harmful content filtering
- [ ] Transcript logging
- [ ] Session completion

**Test:** Jailbreak attempts blocked, transcripts saved

### Week 4: Integration & Deploy
- [ ] End-to-end flow
- [ ] Fallback mechanisms
- [ ] Performance tuning
- [ ] Production deployment

**Test:** Live calls routed correctly, metrics green

---

## Safety Checklist

Before every commit:

- [ ] No prompt injection patterns in code
- [ ] Jailbreak tests pass
- [ ] PII detection working
- [ ] Rate limiting enforced
- [ ] Error handling complete
- [ ] Fallback to non-AI works
- [ ] Audit logging in place
- [ ] Secrets not in code

---

## Performance Targets

| Metric | Target | How to Test |
|--------|--------|-----------|
| Greeting time | < 2s | WebSocket latency test |
| Intent classification | < 1s | AI response time test |
| Session duration | < 5 min | Timeout test |
| Accuracy | 95%+ | Manual verification |
| Error rate | < 0.1% | Stress test |

---

## Key Decision Points

### 1. AI Model
- **Use:** Claude 3 (safer) + GPT-4 (faster)
- **Fallback:** Rule-based classification
- **Testing:** Try both, measure accuracy

### 2. Intent Categories
- `legitimate_business` — "I'm calling to discuss..."
- `legitimate_personal` — "Hi, this is..."
- `spam_sales` — "Have you been in accident?"
- `scam_attempt` — "I need your SSN"
- `unclear` — "Uh... hello?"

### 3. Disposition Logic
```
Intent + Confidence → Decision

legitimate_business + HIGH → connect
legitimate_personal + HIGH → connect
spam_sales + ANY → reject
scam_attempt + ANY → reject
unclear + LOW → escalate_to_user
```

### 4. Failure Mode
If AI unavailable → Fallback to Phase 1-2 decision engine

---

## Success Criteria

✅ Phase 3 complete when:
- [ ] 95% screening accuracy verified
- [ ] All safety tests pass
- [ ] Performance targets met
- [ ] Zero data loss
- [ ] All transcripts saved
- [ ] Audit logging working
- [ ] Fallback mechanisms tested
- [ ] Documentation complete

---

## Common Pitfalls to Avoid

❌ **Don't:**
- Hardcode API keys (use env vars)
- Skip safety testing
- Ignore error handling
- Assume AI always responds
- Log sensitive data
- Deploy without monitoring
- Skip performance testing
- Forget fallback paths

✅ **Do:**
- Validate all inputs
- Test jailbreak attempts
- Log all decisions
- Implement timeouts
- Mask PII in logs
- Monitor in production
- Load test early
- Have fallback ready

---

## Monitoring & Metrics

Add to dashboards:

```typescript
// Events to track
metrics.increment('voice_screening.initiated', { user_id });
metrics.increment('voice_screening.completed', { disposition });
metrics.gauge('voice_screening.duration_ms', durationMs);
metrics.gauge('voice_screening.confidence', confidenceScore);

// Alerts
if (failureRate > 1%) → Page on-call
if (responseTime > 3s) → Alert engineering
if (jailbreakAttempts > 10/hour) → Escalate to security
```

---

## Documentation Required

Before shipping:

- [ ] API endpoint documentation
- [ ] Intent classification guide
- [ ] Safety guardrails explanation
- [ ] Database schema diagram
- [ ] Flow diagram (voice path)
- [ ] Troubleshooting guide
- [ ] Runbook for on-call
- [ ] Migration guide for teams

---

## Next Steps

1. **Read full specs:**
   - `PHASE_3_TECHNICAL_SPEC.md` (27,000 words)
   - `HIDEVA_STRATEGIC_ENHANCEMENT_PLAN.md` (15,000 words)

2. **Schedule design review:**
   - Present architecture to team
   - Validate approach
   - Confirm timeline

3. **Set up environment:**
   - AgentStream account
   - API keys
   - Database migrations

4. **Start Week 1:**
   - WebSocket connection
   - Basic greeting flow
   - Error handling

---

## Questions?

**Technical Details:**  
→ See `PHASE_3_TECHNICAL_SPEC.md`

**Architecture Decisions:**  
→ See `HIDEVA_STRATEGIC_ENHANCEMENT_PLAN.md`

**Testing Strategy:**  
→ See "Testing Strategy" in technical spec

**Safety Guardrails:**  
→ See "Safety Guardrails" section

---

**Ready? Let's build Phase 3. 🚀**

Next milestone: Production voice screening in 4 weeks.

**Go ship it!** ✨
