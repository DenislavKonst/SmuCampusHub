# Testing Documentation - SMUCampusHub
**CPS6002 Software Testing and Quality Assurance Assessment**

---

## Quick Start: Running Tests

### Prerequisites
- Node.js v20.x installed
- PostgreSQL database running
- Application dependencies installed (`npm install`)
- Server running on port 5000 (`npm run dev`)

### Run All Automated Tests
```bash
npx vitest run
```

### Run Tests by Quadrant

**Quadrant 1 - Unit Tests:**
```bash
npx vitest run server/__tests__/booking.logic.test.ts
```

**Quadrant 2 - API Integration Tests:**
```bash
npx vitest run server/__tests__/api.integration.test.ts
```

**Quadrant 4 - Performance Tests:**
```bash
npx vitest run server/__tests__/performance.test.ts
```

**Quadrant 4 - Security Tests:**
```bash
npx vitest run server/__tests__/security.test.ts
```

### Run Tests in Watch Mode
```bash
npx vitest
```

### Run Tests with Coverage
```bash
npx vitest run --coverage
```

### Run Tests with UI
```bash
npx vitest --ui
```

---

## Test Deliverables

### 1. Planning Documents
- **TEST_PLAN.md** - Comprehensive test plan covering all four quadrants
  - Scope, objectives, approach
  - Test environment and data
  - Effort estimation and schedule
  - Risk assessment

### 2. Test Execution Evidence
- **TEST_EXECUTION_REPORT.txt** - Automated test run results
- **test-results.json** - Machine-readable test results
- **server/__tests__/** - Automated test scripts
  - `booking.logic.test.ts` - 31 unit tests
  - `api.integration.test.ts` - 20 API integration tests
  - `performance.test.ts` - 11 performance tests
  - `security.test.ts` - 22 security tests
- **client/src/__tests__/** - Frontend tests
  - `accessibility.test.ts` - Accessibility documentation tests

### 3. Defect Tracking
- **DEFECT_LOG.csv** - Complete defect tracking log
  - 10 defects identified
  - 2 critical issues resolved
  - Steps to reproduce, expected vs actual behavior
  - Resolution status and recommendations

### 4. Usability & Exploratory Testing
- **USABILITY_EVALUATION.md** - Heuristic evaluation and cognitive walkthrough
  - Overall rating: 8/10
  - Task success rates
  - WCAG 2.1 compliance assessment
  - 12 recommendations
  
- **EXPLORATORY_TESTING_FINDINGS.md** - Charter-based exploratory testing
  - 3 sessions, 270 minutes total
  - 15 findings documented
  - Boundary conditions, workflows, error handling
  - Test coverage gaps identified

### 5. Final Report
- **FINAL_TEST_REPORT.md** - Integrated test report
  - Executive summary
  - Results across all four quadrants
  - Metrics and analysis
  - Risk assessment
  - Recommendations and next steps

---

## Test Statistics

### Overall Test Metrics
- **Total Automated Tests:** 94
- **Passing Tests:** 91
- **Pass Rate:** 96.8%
- **Execution Time:** ~12 seconds

### Coverage by Quadrant
| Quadrant | Tests | Pass Rate |
|----------|-------|-----------|
| Q1: Unit & Component | 31 | 100% |
| Q2: Functional & API | 30 | 96.7% |
| Q3: Usability & Exploratory | 3 sessions | N/A |
| Q4: Performance & Security | 33 | 97% |

### Defect Summary
- **Total Defects:** 10
- **Critical:** 0
- **High:** 1 (resolved)
- **Medium:** 5 (2 resolved, 3 open)
- **Low:** 4 (open, low impact)

---

## Test Environment Setup

### Database Seeding
The test environment uses seeded data:
- **Users:** 5 users (3 students, 2 staff)
  - Students: alice, bob, charlie
  - Staff: dr.smith, prof.jones
- **Password:** All users use `password123`
- **Events:** 10+ sample events across departments
- **Bookings:** Dynamic test data created during execution

### Test Data Credentials
```javascript
// Student accounts
{ username: 'alice', password: 'password123', department: 'Computer Science' }
{ username: 'bob', password: 'password123', department: 'Computer Science' }
{ username: 'charlie', password: 'password123', department: 'Computer Science' }

// Staff accounts
{ username: 'dr.smith', password: 'password123', department: 'Computer Science' }
{ username: 'prof.jones', password: 'password123', department: 'Mathematics' }
```

---

## Test Quadrants Coverage

### Quadrant 1: Technology-Facing Tests Supporting Development
**Focus:** Unit and component tests

**Files:**
- `server/__tests__/booking.logic.test.ts`

**Coverage:**
- ✅ Capacity calculations (base + 5% overbooking)
- ✅ Booking status determination
- ✅ Waitlist promotion (FIFO logic)
- ✅ Department validation
- ✅ Input validation
- ✅ Concurrent booking scenarios

**Result:** 31/31 tests passing (100%)

### Quadrant 2: Business-Facing Tests Supporting Development
**Focus:** Functional and acceptance testing

**Files:**
- `server/__tests__/api.integration.test.ts`
- Playwright E2E tests (executed separately)

**Coverage:**
- ✅ Authentication flows
- ✅ Event CRUD operations
- ✅ Booking lifecycle (book → cancel)
- ✅ Waitlist automation
- ✅ CSV export
- ✅ Role-based authorization

**Result:** 
- API Tests: 19/20 passing (95%)
- E2E Tests: 10/10 passing (100%)

### Quadrant 3: Business-Facing Tests Critiquing the Product
**Focus:** Usability, exploratory, and accessibility

**Files:**
- `USABILITY_EVALUATION.md`
- `EXPLORATORY_TESTING_FINDINGS.md`
- `client/src/__tests__/accessibility.test.ts`

**Activities:**
- ✅ Heuristic evaluation (Nielsen's 10 usability heuristics)
- ✅ Cognitive walkthrough (key user tasks)
- ✅ WCAG 2.1 accessibility review
- ✅ 3 exploratory testing sessions
- ✅ Responsive design verification

**Result:** 8/10 usability rating, 85% WCAG compliance estimated

### Quadrant 4: Technology-Facing Tests Critiquing the Product
**Focus:** Performance, security, and compatibility

**Files:**
- `server/__tests__/performance.test.ts`
- `server/__tests__/security.test.ts`

**Coverage:**
- ✅ Response time benchmarks
- ✅ Concurrent request handling
- ✅ Memory leak detection
- ✅ Authentication security
- ✅ Authorization enforcement
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ Cross-browser compatibility

**Result:** 
- Performance: 11/11 passing (100%)
- Security: 21/22 passing (95.5%)

---

## Key Test Scenarios

### Critical User Flows Tested

1. **Student Booking Flow**
   ```
   Login → Browse Events → Filter by Department → 
   View Event Details → Book Event → View Dashboard → Cancel Booking
   ```
   **Status:** ✅ All steps validated

2. **Staff Event Management**
   ```
   Login → Create Event (with overbooking) → Edit Event → 
   Export Attendees (CSV) → Delete Event
   ```
   **Status:** ✅ All steps validated

3. **Waitlist Automation**
   ```
   Fill Event to Capacity → Additional Booking (Waitlisted) → 
   Cancel Confirmed Booking → Verify Automatic Promotion
   ```
   **Status:** ✅ Promotion logic verified

4. **Security Validation**
   ```
   Invalid Credentials → SQL Injection Attempt → 
   Unauthorized Access → XSS Attempt
   ```
   **Status:** ✅ All attacks prevented

---

## Continuous Integration

### Running Tests in CI/CD

```yaml
# Example GitHub Actions workflow
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npx vitest run
```

### Test Exit Codes
- **0:** All tests passed
- **1:** One or more tests failed

---

## Troubleshooting

### Common Issues

**Issue:** Tests fail with "Connection refused"
```bash
# Solution: Ensure server is running
npm run dev
```

**Issue:** Database tests fail
```bash
# Solution: Verify DATABASE_URL environment variable is set
echo $DATABASE_URL
```

**Issue:** API tests timeout
```bash
# Solution: Increase test timeout in vitest.config.ts
testTimeout: 30000  // 30 seconds
```

**Issue:** Permission errors on test files
```bash
# Solution: Ensure test files are in correct directories
server/__tests__/*.test.ts  # Backend tests
client/src/__tests__/*.test.ts  # Frontend tests
```

---

## Test Maintenance

### Adding New Tests

1. **Unit Tests:** Add to `server/__tests__/booking.logic.test.ts` or create new file
2. **API Tests:** Add to `server/__tests__/api.integration.test.ts`
3. **Performance Tests:** Add to `server/__tests__/performance.test.ts`
4. **Security Tests:** Add to `server/__tests__/security.test.ts`

### Test Naming Conventions
```typescript
describe('Feature Name', () => {
  it('should do specific thing when condition', () => {
    // Test implementation
  });
});
```

### Best Practices
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Keep tests independent (no shared state)
- ✅ Use appropriate data-testid attributes in UI components
- ✅ Mock external dependencies when needed

---

## Contact & Support

**Assessment:** CPS6002 Software Testing and Quality Assurance  
**Project:** SMUCampusHub  
**Date:** January 2026

For questions about test execution or results, refer to:
- **FINAL_TEST_REPORT.md** - Comprehensive test results
- **TEST_PLAN.md** - Test strategy and approach
- **DEFECT_LOG.csv** - Known issues and their status

---

## Appendix: Test File Structure

```
/
├── server/
│   └── __tests__/
│       ├── booking.logic.test.ts      # 31 unit tests
│       ├── api.integration.test.ts    # 20 API tests
│       ├── performance.test.ts        # 11 performance tests
│       ├── security.test.ts           # 22 security tests
│       └── setup.ts                   # Test environment setup
├── client/
│   └── src/
│       └── __tests__/
│           └── accessibility.test.ts  # Accessibility tests
├── vitest.config.ts                   # Test configuration
├── TEST_PLAN.md                       # Test planning document
├── TEST_EXECUTION_REPORT.txt          # Test run results
├── DEFECT_LOG.csv                     # Defect tracking
├── USABILITY_EVALUATION.md            # Usability findings
├── EXPLORATORY_TESTING_FINDINGS.md    # Exploratory test results
├── FINAL_TEST_REPORT.md               # Integrated test report
└── TESTING_README.md                  # This file
```

---

**Last Updated:** January 2026  
**Test Suite Version:** 1.0  
**Compatibility:** Node.js 20.x, PostgreSQL, Vitest 4.x
