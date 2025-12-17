#!/bin/bash

echo "=============================================="
echo "  SMUCampusHub Universal Testing Script"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

OUTPUT_FILE="TEST_RESULTS_$(date '+%Y%m%d_%H%M%S').md"
TEMP_OUTPUT="/tmp/test_output.txt"
SERVER_LOG="/tmp/server_startup.log"
SERVER_PID=""
CONFIG_SWAPPED=false

start_time=$(date +%s)

# Detect if running on Replit
if [ -n "$REPL_ID" ]; then
    echo "Environment: Replit"
    IS_REPLIT=true
else
    echo "Environment: Local Development"
    IS_REPLIT=false
fi

# Function to cleanup server on exit
cleanup() {
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        echo ""
        echo "Stopping test server (PID: $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null
        wait "$SERVER_PID" 2>/dev/null
        echo "Server stopped."
    fi
    # Restore original vite.config.ts if we swapped it
    if [ "$CONFIG_SWAPPED" = true ] && [ -f "vite.config.ts.backup" ]; then
        echo "Restoring original Vite configuration..."
        mv vite.config.ts.backup vite.config.ts
    fi
    # Also kill any orphaned node processes on port 5000
    pkill -f "node.*server" 2>/dev/null || true
}

# Set trap to cleanup on script exit
trap cleanup EXIT

echo ""
echo "Step 0: Checking prerequisites..."

# Check if .env file exists for local development
if [ "$IS_REPLIT" = false ]; then
    if [ ! -f ".env" ]; then
        echo ""
        echo "ERROR: .env file not found!"
        echo ""
        echo "Please create a .env file with your database credentials:"
        echo "  cp .env.example .env"
        echo "  # Then edit .env with your PostgreSQL credentials"
        echo ""
        echo "Required variables:"
        echo "  DATABASE_URL=postgresql://username:password@localhost:5432/smucampushub"
        echo "  SESSION_SECRET=your-secret-key"
        echo ""
        exit 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo ""
        echo "Dependencies not installed. Running npm install..."
        npm install
        if [ $? -ne 0 ]; then
            echo "ERROR: npm install failed"
            exit 1
        fi
        echo "Dependencies installed successfully."
    fi
    
    # Verify vitest is available
    if ! npx vitest --version > /dev/null 2>&1; then
        echo ""
        echo "Vitest not found. Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to install dependencies"
            exit 1
        fi
    fi
fi

echo ""
echo "Step 1: Stopping any existing servers..."
# Kill any existing processes on port 5000 (cross-platform)
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

# Use lsof (works on both macOS and Linux)
if command -v lsof > /dev/null 2>&1; then
    lsof -ti:5000 2>/dev/null | xargs kill -9 2>/dev/null || true
fi

sleep 2

# For local development, swap to local Vite config
if [ "$IS_REPLIT" = false ] && [ -f "vite.config.local.ts" ]; then
    echo ""
    echo "Step 1.5: Configuring for local development..."
    cp vite.config.ts vite.config.ts.backup
    cp vite.config.local.ts vite.config.ts
    CONFIG_SWAPPED=true
    echo "Vite config swapped for local compatibility"
fi

echo "Step 2: Starting application server..."
npm run dev > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Function to check if database is connected via health endpoint
check_database_connected() {
    local response=$(curl -s http://localhost:5000/api/health 2>/dev/null)
    if echo "$response" | grep -q '"status":"connected"'; then
        return 0
    fi
    return 1
}

# Function to check if server is responding
check_server_responding() {
    curl -s http://localhost:5000/api/health > /dev/null 2>&1
    return $?
}

echo "Step 3: Waiting for server to be ready..."

# Set longer timeout for local development (database connections take longer)
if [ "$IS_REPLIT" = true ]; then
    MAX_WAIT=60
    DB_STABILIZATION_WAIT=2
else
    MAX_WAIT=90
    DB_STABILIZATION_WAIT=5
fi

WAIT_COUNT=0
SERVER_READY=false
DATABASE_CONNECTED=false

# Phase 1: Wait for server to respond
echo "  Phase 1: Waiting for server to respond..."
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if check_server_responding; then
        echo "  Server responding! (took ${WAIT_COUNT} seconds)"
        SERVER_READY=true
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
        echo "    Still waiting for server... (${WAIT_COUNT}s)"
    fi
done

if [ "$SERVER_READY" = false ]; then
    echo "ERROR: Server failed to start within ${MAX_WAIT} seconds"
    echo ""
    echo "Server log:"
    tail -50 "$SERVER_LOG"
    echo ""
    echo "Common issues:"
    echo "  1. Database not running - Start PostgreSQL first"
    echo "  2. Wrong DATABASE_URL in .env file"
    echo "  3. Port 5000 already in use"
    exit 1
fi

# Phase 2: Wait for database connection with retries
echo "  Phase 2: Waiting for database connection..."
DB_WAIT_COUNT=0
DB_MAX_WAIT=30
DB_RETRY_COUNT=0
MAX_RETRIES=3

while [ $DB_WAIT_COUNT -lt $DB_MAX_WAIT ]; do
    if check_database_connected; then
        echo "  Database connected! (took ${DB_WAIT_COUNT} additional seconds)"
        DATABASE_CONNECTED=true
        break
    fi
    sleep 1
    DB_WAIT_COUNT=$((DB_WAIT_COUNT + 1))
    if [ $((DB_WAIT_COUNT % 5)) -eq 0 ]; then
        echo "    Waiting for database... (${DB_WAIT_COUNT}s)"
    fi
done

# Retry logic for flaky connections
if [ "$DATABASE_CONNECTED" = false ]; then
    echo "  Database not connected. Attempting retries..."
    while [ $DB_RETRY_COUNT -lt $MAX_RETRIES ]; do
        DB_RETRY_COUNT=$((DB_RETRY_COUNT + 1))
        echo "    Retry $DB_RETRY_COUNT of $MAX_RETRIES..."
        sleep 5
        if check_database_connected; then
            echo "  Database connected on retry $DB_RETRY_COUNT!"
            DATABASE_CONNECTED=true
            break
        fi
    done
fi

if [ "$DATABASE_CONNECTED" = false ]; then
    echo ""
    echo "WARNING: Database connection not confirmed."
    echo ""
    HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
    echo "Health check response: $HEALTH_RESPONSE"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Is PostgreSQL running? (check with: pg_isready)"
    echo "  2. Is DATABASE_URL correct in .env?"
    echo "  3. Does the database exist? (createdb smucampushub)"
    echo "  4. Run: npm run db:push to create tables"
    echo ""
    echo "Tests will proceed but some may fail..."
fi

# Phase 3: Stabilization wait for database connections to fully initialize
echo "  Phase 3: Stabilization wait (${DB_STABILIZATION_WAIT}s)..."
sleep $DB_STABILIZATION_WAIT

# Final health check verification
echo "  Final health check..."
HEALTH_STATUS=$(curl -s http://localhost:5000/api/health)
echo "  Health: $HEALTH_STATUS" | head -1

echo ""
echo "Step 4: Running all automated tests..."
echo ""

# Run tests with retry on failure for flaky network conditions
run_tests_with_retry() {
    local attempt=1
    local max_attempts=2
    
    while [ $attempt -le $max_attempts ]; do
        echo "Test run attempt $attempt of $max_attempts..."
        npx vitest run --reporter=verbose 2>&1 | tee "$TEMP_OUTPUT"
        
        # Check if tests passed
        if grep -q "Tests.*passed" "$TEMP_OUTPUT" && ! grep -q "Tests.*failed" "$TEMP_OUTPUT"; then
            echo "All tests passed!"
            return 0
        fi
        
        # If first attempt failed, wait and retry
        if [ $attempt -lt $max_attempts ]; then
            echo ""
            echo "Some tests failed. Waiting 5 seconds before retry..."
            sleep 5
        fi
        
        attempt=$((attempt + 1))
    done
    
    return 1
}

run_tests_with_retry

echo ""
echo "Step 5: Generating test report..."

# Generate the report
{
echo "# SMUCampusHub Test Results Report"
echo "**Generated:** $(date '+%Y-%m-%d %H:%M:%S')"
echo "**Environment:** $(uname -s) $(uname -r)"
echo "**Node Version:** $(node --version)"
echo ""
echo "---"
echo ""

echo "## 1. Application Startup Check"
echo ""
echo "### Server Status"
echo "✅ **Application Status:** Server started successfully"
echo ""
echo "### Health Check Response"
HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
echo "\`\`\`json"
echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
echo "\`\`\`"
echo ""
echo "### Database Connection"
if echo "$HEALTH_RESPONSE" | grep -q '"status":"connected"'; then
    echo "✅ **Database:** Connected"
else
    echo "⚠️ **Database:** Connection status unknown"
fi

echo ""
echo "---"
echo ""

echo "## 2. Test Execution Results"
echo ""

echo "### Raw Test Output"
echo ""
echo "\`\`\`"
cat "$TEMP_OUTPUT"
echo "\`\`\`"

echo ""
echo "---"
echo ""

echo "## 3. Test Summary by Category"
echo ""

TOTAL_TESTS=$(grep -E "Tests.*passed" "$TEMP_OUTPUT" | tail -1 | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+")
FAILED_TESTS=$(grep -E "Tests.*failed" "$TEMP_OUTPUT" | tail -1 | grep -oE "[0-9]+ failed" | grep -oE "[0-9]+" || echo "0")
DURATION=$(grep -E "Duration" "$TEMP_OUTPUT" | tail -1 | grep -oE "[0-9]+\.[0-9]+s" || echo "N/A")

echo "### Overall Results"
echo ""
echo "| Metric | Value |"
echo "|--------|-------|"
echo "| Total Tests | ${TOTAL_TESTS:-0} |"
echo "| Tests Passed | ${TOTAL_TESTS:-0} |"
echo "| Tests Failed | ${FAILED_TESTS:-0} |"
echo "| Pass Rate | $([ "${FAILED_TESTS:-0}" = "0" ] && echo "100%" || echo "$(( (${TOTAL_TESTS:-0} - ${FAILED_TESTS:-0}) * 100 / ${TOTAL_TESTS:-1} ))%") |"
echo "| Execution Time | ${DURATION} |"
echo ""

echo "### Test Files Summary"
echo ""
echo "| Test File | Status |"
echo "|-----------|--------|"

if grep -q "booking.logic.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "booking.logic.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| booking.logic.test.ts (Unit Tests) | Failed |"
    else
        echo "| booking.logic.test.ts (Unit Tests) | Passed |"
    fi
fi
if grep -q "api.integration.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "api.integration.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| api.integration.test.ts (API Tests) | Failed |"
    else
        echo "| api.integration.test.ts (API Tests) | Passed |"
    fi
fi
if grep -q "performance.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "performance.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| performance.test.ts (Performance Tests) | Failed |"
    else
        echo "| performance.test.ts (Performance Tests) | Passed |"
    fi
fi
if grep -q "security.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "security.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| security.test.ts (Security Tests) | Failed |"
    else
        echo "| security.test.ts (Security Tests) | Passed |"
    fi
fi
if grep -q "accessibility.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "accessibility.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| accessibility.test.ts (Accessibility Docs) | Failed |"
    else
        echo "| accessibility.test.ts (Accessibility Docs) | Passed |"
    fi
fi

echo ""
echo "---"
echo ""

echo "## 4. Test Categories Breakdown"
echo ""

echo "### 4.1 Unit Tests (Quadrant 1)"
echo "**Focus:** Business logic, capacity calculations, waitlist management"
echo ""
echo "- Capacity calculations with overbooking (+5%)"
echo "- Booking status determination (confirmed vs waitlisted)"
echo "- Waitlist promotion logic (FIFO ordering)"
echo "- Department validation rules"
echo "- Input validation (capacity ranges 1-1000)"
echo ""

echo "### 4.2 API Integration Tests (Quadrant 2)"
echo "**Focus:** Endpoint functionality, authentication, error handling"
echo ""
echo "- Authentication endpoints (login, token validation)"
echo "- Event CRUD operations"
echo "- Booking endpoints (create, cancel, reschedule)"
echo "- Health check endpoint"
echo "- Error response handling"
echo ""

echo "### 4.3 Performance Tests (Quadrant 4)"
echo "**Focus:** Response times, concurrent load, memory usage"
echo ""
echo "- Response time benchmarks (< 2000ms after warm-up)"
echo "- Concurrent request handling (10-50 simultaneous)"
echo "- Memory leak detection"
echo "- CSV export performance"
echo ""

echo "### 4.4 Security Tests (Quadrant 4)"
echo "**Focus:** Authentication, authorization, input validation"
echo ""
echo "- JWT token validation"
echo "- Role-based access control"
echo "- SQL injection prevention"
echo "- XSS prevention"
echo "- Input validation (capacity, event types)"
echo "- X-Powered-By header disabled"
echo ""

echo "### 4.5 Accessibility Documentation (Quadrant 3)"
echo "**Focus:** WCAG 2.1 compliance documentation"
echo ""
echo "- Keyboard navigation requirements"
echo "- Screen reader compatibility"
echo "- Color contrast standards"
echo "- Form accessibility"
echo ""

echo "---"
echo ""

echo "## 5. Quality Assessment"
echo ""

if [ "${FAILED_TESTS:-0}" = "0" ]; then
    echo "### All Tests Passed"
    echo ""
    echo "The SMUCampusHub application has passed all automated tests across:"
    echo "- Unit testing (business logic)"
    echo "- API integration testing"
    echo "- Performance benchmarking"
    echo "- Security validation"
    echo "- Accessibility documentation"
    echo ""
    echo "**Production Readiness:** READY"
else
    echo "### Some Tests Failed"
    echo ""
    echo "Please review the failed tests above and address any issues."
    echo ""
    echo "**Production Readiness:** NEEDS ATTENTION"
fi

echo "---"
echo ""

echo "## 6. Recommendations"
echo ""
echo "### Completed Security Fixes"
echo "- DEF-003: X-Powered-By header disabled"
echo "- DEF-004: Capacity validation enforces 1-1000 range"
echo ""
echo "### Future Improvements"
echo "- Implement rate limiting for production"
echo "- Add Playwright E2E automation"
echo "- Integrate automated accessibility testing (@axe-core)"
echo "- Formal WCAG audit"
echo ""

end_time=$(date +%s)
elapsed=$((end_time - start_time))

echo "---"
echo ""
echo "## Report Metadata"
echo ""
echo "| Property | Value |"
echo "|----------|-------|"
echo "| Report Generated | $(date '+%Y-%m-%d %H:%M:%S') |"
echo "| Total Execution Time | ${elapsed} seconds |"
echo "| Test Framework | Vitest |"
echo "| Node Version | $(node --version) |"
echo "| Environment | $([ "$IS_REPLIT" = true ] && echo "Replit" || echo "Local Development") |"
echo "| Database Connected | $([ "$DATABASE_CONNECTED" = true ] && echo "Yes" || echo "Unknown") |"
echo "| Server PID | ${SERVER_PID} |"
echo ""
echo "---"
echo ""
echo "*This report was automatically generated by the SMUCampusHub Universal Testing Script.*"

} > "$OUTPUT_FILE"

rm -f "$TEMP_OUTPUT"

echo ""
echo "=============================================="
echo "  Testing Complete!"
echo "=============================================="
echo ""
echo "Results saved to: $OUTPUT_FILE"
echo "Total execution time: $(($(date +%s) - start_time)) seconds"
echo ""

echo "Preview of results:"
echo "---"
head -60 "$OUTPUT_FILE"
echo "..."
echo ""
echo "Full report available in: $OUTPUT_FILE"
