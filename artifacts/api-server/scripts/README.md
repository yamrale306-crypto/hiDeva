# Phase 2: Mock Telephony Server & Verification Loop

## Overview

Phase 2 provides a complete local testing infrastructure for the hiDeva telephony system. This allows us to:

- ✅ Simulate Exotel webhook payloads without spending credits
- ✅ Stress-test the Express backend under concurrent load
- ✅ Verify response contracts match Exotel expectations
- ✅ Populate test data for realistic scenarios
- ✅ Measure performance and identify bottlenecks

## Quick Start

### 1. Seed the Test Database

Populate PostgreSQL with VIP contacts, spam flags, and routing rules:

```bash
pnpm run seed
```

**What this does:**
- Creates 8 test contacts (VIPs, spammers, unknowns)
- Configures 4 routing rules (pattern matching, priority blocking)
- Clears previous test data (safe to run multiple times)

### 2. Start the API Server

In one terminal:

```bash
pnpm run dev
```

The server will start on `https://localhost:8080` (self-signed cert for local testing).

### 3. Run Tests

In another terminal, choose your test:

#### a) Validate Response Contracts

Ensures the Express backend returns correct decision outcomes:

```bash
pnpm run test:validate
```

Tests:
- VIP contacts → `connect`
- Spam contacts → `reject`
- Unknown callers → `screen`
- Pattern matching (1800*, 140*)
- Safe defaults for malformed payloads
- Response time SLAs (< 500ms)

#### b) Stress Test (Concurrent Load)

Simulate 50 concurrent webhook bursts to measure performance:

```bash
pnpm run test:stress --concurrency 50 --bursts 5
```

Metrics:
- Requests/second throughput
- Response time percentiles (min, avg, p95, p99, max)
- Success rate and failure patterns
- Memory usage during burst

#### c) Webhook Integration Test

Classic curl-based test using shell script:

```bash
pnpm run test:webhook
```

#### d) Manual Payload Testing

Generate a mock payload and inspect the response:

```bash
# Generate a VIP contact scenario
node scripts/mock-exotel.ts known-vip | jq

# Or pipe directly to curl
curl -X POST https://localhost:8080/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d "$(tsx scripts/mock-exotel.ts known-vip)"
```

Available scenarios in `mock-exotel.ts`:
- `known-vip` → Contacts with high priority
- `known-spam` → Marked spam / low priority
- `unknown-caller` → Not in contacts
- `telemarketer-pattern` → Matches 1800* rule

## Test Data

### Contacts (from seed)

| Name | Phone | Priority | Spam | Behavior |
|------|-------|----------|------|----------|
| Dad (VIP) | +919999999999 | high | no | → connect |
| Mom (VIP) | +919123456789 | high | no | → connect |
| Co-founder | +918765432109 | high | no | → connect |
| Telemarketer | +911400000000 | low | yes | → reject |
| Spam (1800) | +911800112233 | low | yes | → reject |
| College Friend | +918888888888 | medium | no | → screen |
| Work Contact | +919876543210 | medium | no | → screen |
| Local Number | 08067123456 | medium | no | → screen |

### Routing Rules (from seed)

| Name | Trigger | Action | Priority | Status |
|------|---------|--------|----------|--------|
| Default Unknown | unknown | screen | 100 | active |
| Block 1800 | +911800* | reject | 50 | active |
| Block 140 | +91140* | reject | 51 | active |
| Alt: Screen 1800 | +918000* | screen | 150 | **inactive** |

## Understanding the Flow

### Request → Decision → Response

```
1. Exotel sends webhook (CallSid, CallFrom, CallTo)
     ↓
2. DB lookups in parallel:
   - Find contact by (userId, phoneNumber)
   - Fetch active routing rules
     ↓
3. Decision engine (priority order):
   a) Contact priority checks
      - high priority → "connect"
      - low/spam → "reject"
   b) Custom routing rules
      - Evaluate in priority order
      - First match wins
   c) Default fallback → "screen"
     ↓
4. Return to Exotel: { select: "connect" | "screen" | "reject" }
     ↓
5. Background: Log call record to calls table (async, non-blocking)
```

### Response SLA

- Target: < 3 seconds (Exotel timeout)
- Typical: 50-200ms
- Bottleneck analysis: See stress test percentiles (p95, p99)

## Troubleshooting

### Test fails with "Connection refused"

Ensure:
1. API server is running: `pnpm run dev`
2. Server is listening on correct port (check console output)
3. DATABASE_URL is set in `.env` or environment

### "Invalid payload" errors

Verify test data was seeded:
```bash
pnpm run seed
```

If tests still fail, check DB connection:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM contacts;"
```

### Stress test shows high latency

Check:
- Database connection pool exhaustion: Monitor `ps aux | grep postgres`
- CPU/Memory usage: `top` or `htop`
- Network latency: `ping localhost`

## Integration with Phase 1

Phase 1 established:
- ✅ Telephony schema (contacts, calls, routingRules)
- ✅ Express route handler with decision engine
- ✅ Drizzle ORM type-safety

Phase 2 adds:
- ✅ Test data population (seeds)
- ✅ Contract verification (validator)
- ✅ Load testing (stress tester)
- ✅ Performance benchmarks (metrics)

## Next: Phase 3 - AI Screening Pipeline

Once Phase 2 is validated, Phase 3 will implement:
- AgentStream WebSocket integration
- Voice screening with hiDeva AI
- Intent classification & dynamic responses
- Call transcription & logging

---

**Ready to ship Phase 2?** 🚀

Run all tests in sequence:
```bash
pnpm run seed && \
pnpm run test:validate && \
pnpm run test:webhook && \
pnpm run test:stress --concurrency 20 --bursts 3
```

Expected output: All tests pass ✅, response times < 500ms, success rate > 99%
