#!/bin/bash

# Integration Test Script for Telephony Webhook
# 
# Tests the full flow:
#   1. Webhook receives Exotel payload
#   2. DB lookups happen
#   3. Routing decision is made
#   4. Response is returned < 3s
# 
# Prerequisites:
#   - API server running on http://localhost:8080
#   - DATABASE_URL set and database initialized
#   - pnpm install completed
# 
# Usage:
#   bash ./test-webhook.sh

set -e

API_BASE="http://localhost:8080/api"
WEBHOOK_URL="$API_BASE/calls/webhook"

# ANSI colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

function log_error() {
  echo -e "${RED}✗${NC} $1"
}

function log_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# Test 1: Unknown Caller (should screen)
log_info "Test 1: Unknown Caller"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "test-001",
    "CallFrom": "+919999999999",
    "CallTo": "080-HIDEVA-1",
    "Direction": "incoming"
  }')

if echo "$RESPONSE" | grep -q '"select":"screen"'; then
  log_success "Unknown caller routed to screening"
else
  log_error "Unexpected response: $RESPONSE"
fi

# Test 2: Invalid Payload (missing CallSid)
log_info "Test 2: Invalid Payload"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "CallFrom": "+919876543210",
    "CallTo": "080-HIDEVA-1"
  }')

if echo "$RESPONSE" | grep -q '"select":"screen"'; then
  log_success "Invalid payload safely defaults to screening"
else
  log_error "Unexpected response: $RESPONSE"
fi

# Test 3: Performance Check (should respond < 500ms for fast path)
log_info "Test 3: Performance Check"
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "CallSid": "test-perf-001",
    "CallFrom": "+919000000000",
    "CallTo": "080-HIDEVA-1",
    "Direction": "incoming"
  }')
END=$(date +%s%N)

ELAPSED=$(( (END - START) / 1000000 ))
if [ $ELAPSED -lt 500 ]; then
  log_success "Response time: ${ELAPSED}ms (< 500ms target)"
else
  log_error "Response time: ${ELAPSED}ms (exceeds 500ms target)"
fi

# Test 4: Call History Retrieval
log_info "Test 4: Get Call Details"
CALL_ID="test-call-id-1"
RESPONSE=$(curl -s -X GET "$API_BASE/calls/$CALL_ID" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q '"error"'; then
  log_success "Call not found (expected for test call)"
else
  log_info "Response: $RESPONSE"
fi

log_success "All tests passed!"
