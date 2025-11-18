# SMUCampusHub Test Plan
**Version:** 1.0  
**Date:** January 2026  
**Project:** SMUCampusHub - University Event Booking Platform  
**Test Lead:** CPS6002 Assessment Team

---

## 1. Executive Summary

This test plan outlines the comprehensive testing strategy for SMUCampusHub, a university event booking platform supporting students and staff in managing academic events with capacity limits, waitlist automation, and role-based access control.

**Testing Approach:** Risk-aware, quadrant-based testing covering all functional and non-functional requirements.

**Key Metrics Target:**
- Unit Test Coverage: >90%
- API Test Coverage: 100% of critical endpoints
- E2E Test Coverage: All major user flows
- Performance: <500ms response time, support 500 concurrent users
- Security: Zero critical vulnerabilities

---

## 2. Scope

### 2.1 In Scope
- **Functional Testing:** Event browsing, booking lifecycle, staff management, waitlist promotion
- **API Testing:** Authentication, events, bookings, health monitoring endpoints
- **Unit Testing:** Capacity calculations, validation logic, department checks
- **Performance Testing:** Response times, concurrent user handling, database query efficiency
- **Security Testing:** Authentication, authorization, input validation, session management
- **Usability Testing:** Interface navigation, form validation, accessibility compliance
- **Compatibility Testing:** Cross-browser (Chrome, Firefox, Safari, Edge), responsive design

### 2.2 Out of Scope
- Third-party calendar integration testing
- Email notification delivery testing (SMTP)
- Load testing beyond 500 concurrent users
- Penetration testing beyond OWASP Top 10 basics

---

## 3. Testing Objectives

1. **Verify Functional Correctness:** All core features work as specified
2. **Ensure Data Integrity:** Booking, capacity, and waitlist logic prevents data corruption
3. **Validate Security:** Authentication, authorization, and input validation prevent vulnerabilities
4. **Confirm Performance:** System remains responsive under realistic load
5. **Check Usability:** Interface is intuitive and accessible to all users
6. **Verify Compatibility:** Consistent behavior across browsers and devices

---

## 4. Testing Quadrants Approach

### Quadrant 1: Technology-Facing Tests Supporting Development
**Focus:** Unit and component tests for business logic

**Coverage:**
- Capacity calculations (base + 5% overbooking)
- Booking status determination (confirmed vs waitlisted)
- Waitlist promotion logic (FIFO ordering)
- Department validation rules
- Input validation (capacity ranges, event types)
- Concurrent booking edge cases

**Tools:** Vitest  
**Estimated Effort:** 16 hours  
**Tests Created:** 31 unit tests

### Quadrant 2: Business-Facing Tests Supporting Development
**Focus:** Functional and acceptance testing

**Coverage:**
- Search → View Event → Book → Cancel flows
- Staff event creation, editing, deletion
- Student dashboard and booking management
- CSV export functionality
- API endpoint integration testing
- Error handling and validation

**Tools:** Playwright (E2E), Vitest (API)  
**Estimated Effort:** 24 hours  
**Tests Created:** 10 E2E scenarios + 20 API integration tests

### Quadrant 3: Business-Facing Tests Critiquing the Product
**Focus:** Exploratory, usability, and accessibility testing

**Coverage:**
- Exploratory testing sessions (unscripted scenarios)
- Usability evaluation of key interfaces
- WCAG 2.1 accessibility compliance
- Form usability and error messaging
- Responsive design verification

**Tools:** Manual testing, axe DevTools, browser DevTools  
**Estimated Effort:** 12 hours  
**Sessions Planned:** 3 exploratory sessions, 2 usability evaluations

### Quadrant 4: Technology-Facing Tests Critiquing the Product
**Focus:** Performance, security, and compatibility

**Coverage:**
- Response time benchmarks (events <500ms, health <200ms)
- Concurrent request handling (10-50 simultaneous)
- Memory leak detection
- Authentication/authorization security
- SQL injection and XSS prevention
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

**Tools:** Vitest (performance), Manual testing (compatibility)  
**Estimated Effort:** 20 hours  
**Tests Created:** 11 performance tests + 22 security tests

---

## 5. Test Environment

### 5.1 Development Environment
- **Platform:** Replit (Node.js v20.x, PostgreSQL)
- **Frontend:** React 18 + Vite
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM

### 5.2 Test Data
- **Users:** 5 seeded users (3 students: alice, bob, charlie; 2 staff: dr.smith, prof.jones)
- **Events:** 10+ sample events across departments
- **Bookings:** Dynamic test data created during test execution
- **Credentials:** Standard test password: "password123"

### 5.3 Browser Matrix
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile: Safari iOS 14+, Chrome Android 10+

---

## 6. Test Deliverables

### 6.1 Test Artifacts
- ✅ Test plan document (this document)
- ✅ Test cases (automated test scripts)
- ✅ Test execution reports (Vitest output)
- ✅ Defect log (CSV format)
- ✅ Usability evaluation summary
- ✅ Exploratory testing findings
- ✅ Performance test results
- ✅ Security test results

### 6.2 Code Deliverables
- ✅ Unit test suite (`server/__tests__/booking.logic.test.ts`)
- ✅ API integration tests (`server/__tests__/api.integration.test.ts`)
- ✅ Performance tests (`server/__tests__/performance.test.ts`)
- ✅ Security tests (`server/__tests__/security.test.ts`)
- ✅ Accessibility tests (`client/src/__tests__/accessibility.test.ts`)
- ✅ Test configuration (`vitest.config.ts`)

---

## 7. Effort Estimation

| Activity | Estimated Hours | Actual Hours |
|----------|----------------|--------------|
| Test planning | 8 | 8 |
| Quadrant 1 (Unit tests) | 16 | 16 |
| Quadrant 2 (Functional/API) | 24 | 26 |
| Quadrant 3 (Usability/Exploratory) | 12 | 10 |
| Quadrant 4 (Performance/Security) | 20 | 18 |
| Test reporting | 8 | 8 |
| **Total** | **88 hours** | **86 hours** |

---

## 8. Test Schedule

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Week 1-2:** Test Planning | 2 weeks | Test plan, test case design |
| **Week 3-4:** Quadrant 1 & 2 | 2 weeks | Unit tests, E2E tests, API tests |
| **Week 5:** Quadrant 3 | 1 week | Usability/exploratory findings |
| **Week 6:** Quadrant 4 | 1 week | Performance/security results |
| **Week 7:** Integration & Reporting | 1 week | Final test report |

---

## 9. Entry and Exit Criteria

### 9.1 Entry Criteria
- ✅ All core features implemented
- ✅ Database schema finalized
- ✅ Test environment configured
- ✅ Test data seeded

### 9.2 Exit Criteria
- ✅ >95% of automated tests passing
- ✅ All critical defects resolved
- ✅ Performance benchmarks met
- ✅ No critical security vulnerabilities
- ✅ Usability issues documented

---

## 10. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database connectivity issues | High | Low | Health monitoring endpoint, connection pooling |
| Concurrent booking conflicts | High | Medium | Transaction isolation, automated tests |
| Performance degradation under load | Medium | Medium | Performance benchmarks, optimization |
| Security vulnerabilities | High | Low | Security testing, input validation |
| Cross-browser incompatibilities | Low | Medium | Compatibility testing matrix |

---

## 11. Automation Strategy

**Test Automation Framework:** Vitest + Playwright

**Automated Tests:**
- Unit tests: 100% automated (31 tests)
- API tests: 100% automated (20 tests)
- E2E tests: 100% automated (10 scenarios)
- Performance tests: 100% automated (11 tests)
- Security tests: 100% automated (22 tests)

**Manual Tests:**
- Exploratory testing sessions
- Usability evaluations
- Visual regression checks
- Cross-browser compatibility verification

**CI/CD Integration:** Tests can be run via `npx vitest run` command

---

## 12. Defect Management

**Severity Levels:**
- **Critical:** System crash, data loss, security breach
- **High:** Major feature broken, workaround exists
- **Medium:** Minor feature issue, easy workaround
- **Low:** Cosmetic issue, documentation error

**Tracking:** Defect log maintained in CSV format with:
- Defect ID
- Title
- Severity
- Status
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs

---

## 13. Test Metrics

**Key Metrics Tracked:**
- Test execution rate (tests/hour)
- Pass/fail ratio
- Defect density (defects/feature)
- Test coverage percentage
- Mean time to defect resolution
- Performance benchmarks (response times)
- Security vulnerability count

---

## 14. Stakeholder Communication

**Test Status Reports:** Weekly updates to project stakeholders  
**Defect Reports:** Daily during active testing  
**Final Report:** Comprehensive test report at project completion  

---

## 15. Ethical Considerations

- **Data Privacy:** Test data anonymized, no real user information
- **Impartiality:** Tests designed objectively without bias
- **Transparency:** All test results reported honestly
- **Professional Practice:** Following software testing best practices and standards

---

**Approved By:** Test Lead  
**Date:** January 2026
