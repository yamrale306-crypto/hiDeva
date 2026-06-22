#!/bin/bash

# Phase 2 Setup Verification
# Checks all prerequisites before running tests

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function check() {
  echo -e "${BOLD}→${NC} $1"
}

function success() {
  echo -e "${GREEN}✓${NC} $1"
}

function error() {
  echo -e "${RED}✗${NC} $1"
}

function info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

echo -e "\n${BOLD}🔍 Phase 2 Setup Verification${NC}\n"

# 1. Check Node/pnpm
check "Checking Node.js and pnpm..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  success "Node.js $NODE_VERSION"
else
  error "Node.js not found"
  exit 1
fi

if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  success "pnpm $PNPM_VERSION"
else
  error "pnpm not found"
  exit 1
fi

# 2. Check DATABASE_URL
check "Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    source .env
    if [ -z "$DATABASE_URL" ]; then
      error "DATABASE_URL not set in .env"
      exit 1
    fi
  else
    error "DATABASE_URL not set and no .env file found"
    echo "  → Copy .env.example to .env and fill in DATABASE_URL"
    exit 1
  fi
fi
success "DATABASE_URL is set"

# 3. Check database connectivity
check "Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
  success "Database connection OK"
else
  error "Cannot connect to database"
  echo "  → DATABASE_URL: $DATABASE_URL"
  exit 1
fi

# 4. Check dependencies
check "Checking npm dependencies..."
if [ -d "node_modules" ] && [ -d "artifacts/api-server/node_modules" ]; then
  success "Dependencies installed"
else
  info "Installing dependencies (this may take a few minutes)..."
  pnpm install
fi

# 5. Check scripts
check "Verifying test scripts..."
SCRIPTS=(
  "scripts/seed-test-matrix.ts"
  "scripts/applet-validator.ts"
  "scripts/stress-test.ts"
  "scripts/test-webhook.sh"
)

for script in "${SCRIPTS[@]}"; do
  if [ -f "artifacts/api-server/$script" ]; then
    success "Found $script"
  else
    error "Missing $script"
    exit 1
  fi
done

# 6. Check schema tables
check "Checking database schema..."
TABLES=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_name IN ('contacts', 'calls', 'routing_rules');
")

if [ "$TABLES" -eq 3 ]; then
  success "All schema tables exist"
else
  info "Schema tables not fully created"
  info "Run 'pnpm run seed' to create tables and populate test data"
fi

echo -e "\n${GREEN}✅ All checks passed!${NC}\n"

echo -e "${BOLD}📋 Next Steps:${NC}\n"
echo "1. Seed test data:"
echo -e "   ${YELLOW}pnpm run seed${NC}\n"
echo "2. Start the API server (in one terminal):"
echo -e "   ${YELLOW}pnpm run dev${NC}\n"
echo "3. Run tests (in another terminal):"
echo -e "   ${YELLOW}pnpm run test:validate${NC}"
echo -e "   ${YELLOW}pnpm run test:webhook${NC}"
echo -e "   ${YELLOW}pnpm run test:stress${NC}\n"

echo "For more details, see: artifacts/api-server/scripts/README.md"
echo ""
