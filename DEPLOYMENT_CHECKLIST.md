# Phase 1 Deployment Checklist & Verification Guide

## Installation & Setup (Prerequisites)

### Step 1: Install Dependencies
```bash
cd hideva
pnpm install
# This will download all packages (first run: ~3-5 minutes)
# Check progress: you should see "✔ Packages installed"
```

### Step 2: Verify Installation
```bash
pnpm --version          # Should show 10.32.1+
pnpm list --depth=0     # Should show workspace packages
```

### Step 3: Initialize Database

**Prerequisites:**
- PostgreSQL 14+ running locally or accessible
- Create database: `createdb hideva`

**Set environment:**
```bash
# Linux / macOS
export DATABASE_URL="postgresql://user:password@localhost:5432/hideva"

# Windows PowerShell
$env:DATABASE_URL="postgresql://user:password@localhost:5432/hideva"
```

**Push schema:**
```bash
pnpm --filter @workspace/db run push
# Output: "✔ Migrations pushed"
# Tables created: calls, contacts, routing_rules, call_transcripts
```

**Verify tables:**
```bash
psql $DATABASE_URL -c "\dt"
# Should show:
#  Schema | Name              | Type  | Owner
# ────────┼──────────────────┼───────┼───────
#  public | calls             | table | user
#  public | contacts          | table | user
#  public | routing_rules     | table | user
#  public | call_transcripts  | table | user
```

---

## Local Testing (Phase 1 Validation)

### Start API Server
```bash
pnpm --filter @workspace/api-server run dev
# Output should include:
#   listening on port 8080
#   Server started
```

### Verify Server is Running
```bash
curl http://localhost:8080/api/healthz
# Expected: {"status":"ok"}
```

### Test 1: Unknown Caller (Should Route to "screen")
```bash
curl -X POST http://localhost:8080/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "test-unknown-001",
    "CallFrom": "+919999999999",
    "CallTo": "080-HIDEVA-1",
    "Direction": "incoming"
  }'

# Expected Response:
# {"select":"screen"}
```

### Test 2: Invalid Payload (Should Still Return "screen")
```bash
curl -X POST http://localhost:8080/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "CallFrom": "+919876543210"
  }'

# Expected Response (safe default):
# {"select":"screen"}
```

### Test 3: Get Call Record
```bash
# First, send a webhook to create a call record
curl -X POST http://localhost:8080/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "test-retrieve-001",
    "CallFrom": "+919111111111",
    "CallTo": "080-HIDEVA-1",
    "Direction": "incoming"
  }'

# Then retrieve it (use the call ID from response or query DB for CallSid)
# Query DB first:
psql $DATABASE_URL -c "SELECT id, telephony_call_sid, caller_number FROM calls LIMIT 1;"

# Then GET
curl http://localhost:8080/api/calls/{CALL_ID}
# Expected: Full call record with all metadata
```

### Test 4: Performance Check (< 500ms)
```bash
# Send 10 webhooks and measure response time
for i in {1..10}; do
  time curl -s -X POST http://localhost:8080/api/calls/webhook \
    -H "Content-Type: application/json" \
    -d "{\"CallSid\":\"perf-$i\",\"CallFrom\":\"+91900000000$i\",\"CallTo\":\"080-HIDEVA-1\",\"Direction\":\"incoming\"}"
done

# Each should complete in < 100ms (excluding network latency)
```

### Test 5: Run Integration Test Suite
```bash
bash artifacts/api-server/scripts/test-webhook.sh
# All tests should pass with ✓ checkmarks
```

---

## Database Verification

### Check Tables Exist
```bash
psql $DATABASE_URL -c "\dt"
```

### Check Indexes Were Created
```bash
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'calls';"
# Should see: calls_user_id_idx, calls_call_sid_idx
```

### Insert Test Contact (For Manual Routing Tests)
```bash
psql $DATABASE_URL -c "
INSERT INTO contacts (id, user_id, phone_number, name, priority, is_spam_reported)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '+919123456789',
  'Mom (Test)',
  'high',
  false
);
"
```

### Insert Test Routing Rule (For Manual Rules Tests)
```bash
psql $DATABASE_URL -c "
INSERT INTO routing_rules (id, user_id, name, trigger_type, trigger_value, action, priority, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Block 1800 Numbers',
  'pattern',
  '1800*',
  'reject',
  50,
  true
);
"
```

### Query Recent Calls
```bash
psql $DATABASE_URL -c "
SELECT telephony_call_sid, caller_number, status, created_at 
FROM calls 
ORDER BY created_at DESC 
LIMIT 10;
"
```

---

## Verification Checklist

### Installation
- [ ] `pnpm install` completes without errors
- [ ] `pnpm --version` shows 10.32.1+
- [ ] All workspace packages visible in `pnpm list --depth=0`

### Database
- [ ] PostgreSQL connection works: `psql $DATABASE_URL -c "SELECT 1;"`
- [ ] Schema pushed: `pnpm --filter @workspace/db run push`
- [ ] Four tables exist: calls, contacts, routing_rules, call_transcripts
- [ ] Indexes created correctly
- [ ] No foreign key constraint errors

### API Server
- [ ] Server starts: `pnpm --filter @workspace/api-server run dev`
- [ ] Health check works: `curl http://localhost:8080/api/healthz`
- [ ] Returns 200 OK

### Webhook Endpoint
- [ ] `POST /api/calls/webhook` accepts JSON
- [ ] Invalid payload defaults to `"screen"`
- [ ] Valid payload returns routing decision (connect | reject | screen)
- [ ] Response time < 500ms
- [ ] Call records stored in database

### Call Retrieval
- [ ] `GET /api/calls/{callId}` returns 200 for existing calls
- [ ] Returns 404 for non-existent calls
- [ ] Response includes full call metadata

### Performance
- [ ] Single webhook: < 100ms
- [ ] 10 concurrent webhooks: all < 200ms
- [ ] Integration test suite: all tests pass

---

## Expected Logs During Testing

### When API Server Starts
```
[timestamp] Server listening on port 8080
[timestamp] Database connection pool initialized
[timestamp] Routes registered: /api/healthz, /api/calls/webhook, /api/calls/:callId
```

### When Webhook Received
```
[TELEPHONY] Route decision in 45ms {
  callSid: "test-001",
  caller: "+919999999999",
  decision: "screen",
  hasContact: false,
  rulesChecked: 0
}
```

### When Database Write Succeeds
```
[TELEPHONY] Call record created: call_id=550e8400-e29b-41d4-a716-446655440000
```

### When Error Occurs
```
[TELEPHONY] Webhook handler crashed: [error details]
[TELEPHONY] Falling back to safe default: "connect"
```

---

## Troubleshooting During Testing

### Error: "DATABASE_URL must be set"
**Fix:** Export DATABASE_URL before running server
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/hideva"
pnpm --filter @workspace/api-server run dev
```

### Error: "connect ECONNREFUSED"
**Diagnosis:** PostgreSQL not running or wrong connection string
```bash
# Check if PostgreSQL is running
psql --version

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# If fails, start PostgreSQL:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Start PostgreSQL service
```

### Error: "relation 'calls' does not exist"
**Fix:** Database schema not pushed
```bash
pnpm --filter @workspace/db run push
```

### Error: "Port 8080 already in use"
**Fix:** Change PORT or kill process using it
```bash
# macOS / Linux: Find process using port 8080
lsof -i :8080

# Windows: Find process using port 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object -ExpandProperty OwningProcess

# Then kill it (get PID from above)
kill -9 <PID>

# Or start server on different port
PORT=8081 pnpm --filter @workspace/api-server run dev
```

### Performance Issue: Webhook Taking > 1 Second
**Diagnosis:**
1. Check database latency: `psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM contacts LIMIT 1;"`
2. Check indexes exist: `psql $DATABASE_URL -c "\d contacts"`
3. Check server logs for slow queries

**Fix:**
- If indexes missing, run: `pnpm --filter @workspace/db run push` again
- If DB connection slow, verify network latency
- Check server CPU/memory usage

---

## Next Steps After Verification

### ✅ All Tests Pass?
1. Celebrate! Phase 1 is verified ✓
2. Create backup of database
3. Document any customizations
4. Ready for Phase 2 (mock testing at scale)

### ❌ Test Failed?
1. Review logs carefully
2. Check troubleshooting section
3. Verify all environment variables
4. Try isolated test in new terminal
5. Rebuild if needed: `pnpm --filter @workspace/api-server run build`

---

## Performance Baselines (After Verification)

After all tests pass, record these metrics:

| Metric | Measured | Target | Status |
|--------|----------|--------|--------|
| Cold start (first webhook) | ___ ms | < 200ms | __ |
| Warm response | ___ ms | < 100ms | __ |
| Concurrent capacity | ___ RPS | > 100 | __ |
| Database query time | ___ ms | < 50ms | __ |
| Total execution | ___ ms | < 3000ms | __ |

---

## Ready for Production?

Once all checks pass:

- [ ] Phase 1 verified locally ✓
- [ ] Performance baselines recorded
- [ ] Database backed up
- [ ] API server restarts cleanly
- [ ] All error scenarios tested
- [ ] Logs reviewed and understood

**You are officially ready to:**
1. Deploy to staging
2. Configure Exotel webhook
3. Run Phase 2 load testing
4. Begin Phase 3 AgentStream integration

---

**This checklist is your verification roadmap. Work through each section methodically, and you'll have validated that hiDeva's telephony foundation is bulletproof.**
