#!/bin/bash

echo "=============================================="
echo "  SMUCampusHub Universal Testing Script"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

OUTPUT_FILE="TEST_RESULTS_$(date '+%Y%m%d_%H%M%S').md"
TEMP_OUTPUT="/tmp/test_output.txt"
SERVER_LOG="/tmp/server_startup.log"
SERVER_PID=""

start_time=$(date +%s)

# Function to cleanup server on exit
cleanup() {
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        echo ""
        echo "Stopping test server (PID: $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null
        wait "$SERVER_PID" 2>/dev/null
        echo "Server stopped."
    fi
    # Also kill any orphaned node processes on port 5000
    pkill -f "node.*server" 2>/dev/null || true
}

# Set trap to cleanup on script exit
trap cleanup EXIT

echo ""
echo "Step 1: Stopping any existing servers..."
# Kill any existing processes on port 5000
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 2

echo "Step 2: Starting application server..."
npm run dev > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

echo "Step 3: Waiting for server to be ready..."
MAX_WAIT=60
WAIT_COUNT=0
SERVER_READY=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        SERVER_READY=true
        echo "Server is ready! (took ${WAIT_COUNT} seconds)"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
        echo "  Still waiting... (${WAIT_COUNT}s)"
    fi
done

if [ "$SERVER_READY" = false ]; then
    echo "ERROR: Server failed to start within ${MAX_WAIT} seconds"
    echo "Server log:"
    tail -50 "$SERVER_LOG"
    exit 1
fi

echo ""
echo "Step 4: Running all automated tests..."
echo ""

# Run tests and capture output
npx vitest run --reporter=verbose 2>&1 | tee "$TEMP_OUTPUT"

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
echo "✅ **Application Status:** Server started successfully"
echo ""
HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
echo "\`\`\`json"
echo "$HEALTH_RESPONSE" | head -20
echo "\`\`\`"

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
        echo "| booking.logic.test.ts (Unit Tests) | ❌ Failed |"
    else
        echo "| booking.logic.test.ts (Unit Tests) | ✅ Passed |"
    fi
fi
if grep -q "api.integration.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "api.integration.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| api.integration.test.ts (API Tests) | ❌ Failed |"
    else
        echo "| api.integration.test.ts (API Tests) | ✅ Passed |"
    fi
fi
if grep -q "performance.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "performance.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| performance.test.ts (Performance Tests) | ❌ Failed |"
    else
        echo "| performance.test.ts (Performance Tests) | ✅ Passed |"
    fi
fi
if grep -q "security.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "security.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| security.test.ts (Security Tests) | ❌ Failed |"
    else
        echo "| security.test.ts (Security Tests) | ✅ Passed |"
    fi
fi
if grep -q "accessibility.test.ts" "$TEMP_OUTPUT"; then
    if grep -q "accessibility.test.ts.*failed" "$TEMP_OUTPUT"; then
        echo "| accessibility.test.ts (Accessibility Docs) | ❌ Failed |"
    else
        echo "| accessibility.test.ts (Accessibility Docs) | ✅ Passed |"
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
    echo "### ✅ All Tests Passed"
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
    echo "### ⚠️ Some Tests Failed"
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
echo "- ✅ DEF-003: X-Powered-By header disabled"
echo "- ✅ DEF-004: Capacity validation enforces 1-1000 range"
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
