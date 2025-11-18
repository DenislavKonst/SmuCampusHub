# Exploratory Testing Findings
**SMUCampusHub Platform**  
**Testing Period:** January 2026  
**Testers:** CPS6002 Assessment Team

---

## Session 1: Boundary Conditions & Edge Cases

**Date:** 2026-01-05  
**Duration:** 90 minutes  
**Charter:** Explore system behavior with boundary values, edge cases, and unusual input combinations

### Findings

#### 🔍 Finding #1: Overbooking Calculation Edge Cases
- **Test:** Event with capacity 19, overbooking enabled
- **Expected:** Effective capacity = floor(19 * 1.05) = 19 (no additional slots)
- **Actual:** System correctly calculates 19, no overbooking benefit for small events
- **Observation:** This is mathematically correct but may confuse staff
- **Recommendation:** Show tooltip: "Overbooking adds +5% capacity (minimum 20 capacity for benefit)"

#### 🔍 Finding #2: Same-Second Booking Race Condition
- **Test:** Two users clicked "Book" at exactly the same moment (simulated)
- **Expected:** One confirmed, one waitlisted
- **Actual:** Database constraint prevents double-booking; one request succeeded, other got validation error
- **Status:** ✅ Working as intended
- **Note:** Good use of database constraints for data integrity

#### 🔍 Finding #3: Event Date in the Past
- **Test:** Created event with date "2024-01-01" (past date)
- **Expected:** Validation error
- **Actual:** Event created successfully
- **Severity:** Medium
- **Recommendation:** Add date validation to ensure events are in the future

#### 🔍 Finding #4: Capacity = 1 Event
- **Test:** Created event with minimum capacity (1 person)
- **Expected:** First booking confirmed, second waitlisted
- **Actual:** Works perfectly
- **Status:** ✅ Pass
- **Note:** System handles single-capacity events well

#### 🔍 Finding #5: Booking Your Own Event (Staff)
- **Test:** Staff member tried to book their own created event
- **Expected:** Either allowed or blocked with clear message
- **Actual:** Allowed (staff member can book their own event)
- **Observation:** Business logic unclear - should staff attend their own events?
- **Recommendation:** Clarify business requirement

---

## Session 2: Integration & Workflow Testing

**Date:** 2026-01-06  
**Duration:** 120 minutes  
**Charter:** Test complete workflows end-to-end with various scenarios and user combinations

### Findings

#### 🔍 Finding #6: Rapid Booking and Cancellation
- **Test:** Book event → Immediately cancel → Immediately book again
- **Expected:** All operations succeed in sequence
- **Actual:** ✅ All operations completed successfully
- **Note:** System handles rapid state changes well

#### 🔍 Finding #7: Waitlist Promotion Chain
- **Test:** Event at capacity with 3 waitlisted users → Cancel 3 confirmed bookings
- **Expected:** All 3 waitlisted users promoted in order
- **Actual:** ✅ Promotions happen correctly in FIFO order
- **Status:** Pass
- **Evidence:** Verified via database queries showing status transitions

#### 🔍 Finding #8: Filter Persistence
- **Test:** Apply department filter → Navigate to event detail → Use back button
- **Expected:** Filters maintained or reset behavior is clear
- **Actual:** Filters reset to default
- **Observation:** Not a bug, but user might expect filter persistence
- **Recommendation:** Consider persisting filters in URL query params

#### 🔍 Finding #9: Multiple Bookings Same Student
- **Test:** Student tried to book same event twice
- **Expected:** Second booking blocked with error message
- **Actual:** ✅ Error message: "You have already booked this event"
- **Status:** Pass

#### 🔍 Finding #10: CSV Export Empty Event
- **Test:** Export CSV for event with zero bookings
- **Expected:** CSV with headers only or appropriate message
- **Actual:** ✅ CSV generated with header row, no data rows
- **Status:** Pass

---

## Session 3: Error Handling & Recovery

**Date:** 2026-01-07  
**Duration:** 60 minutes  
**Charter:** Test system behavior under error conditions and user mistakes

### Findings

#### 🔍 Finding #11: Network Interruption During Booking
- **Test:** Simulated network disconnect mid-booking request
- **Expected:** Graceful error handling, no duplicate bookings
- **Actual:** Request timed out, no booking created (as expected)
- **Observation:** User might not know if booking succeeded
- **Recommendation:** Consider showing "Check your bookings" link in error message

#### 🔍 Finding #12: Invalid Event ID in URL
- **Test:** Navigate to /events/invalid-uuid
- **Expected:** 404 error or redirect to events list
- **Actual:** ✅ Shows "Event not found" message
- **Status:** Pass

#### 🔍 Finding #13: Expired JWT Token
- **Test:** Modified localStorage to use expired token
- **Expected:** Redirect to login or show "Session expired" message
- **Actual:** ✅ API returns 403, frontend shows error
- **Improvement:** Could add automatic redirect to login page

#### 🔍 Finding #14: Form Submission with Special Characters
- **Test:** Created event with title: `Test & "Event" <2026>`
- **Expected:** Special characters handled safely (no XSS)
- **Actual:** ✅ Characters rendered safely, no script execution
- **Status:** Pass (proper escaping)

#### 🔍 Finding #15: Very Long Event Title
- **Test:** Created event with 500-character title
- **Expected:** Validation error or truncation
- **Actual:** Title accepted and displayed (causes layout issues on event cards)
- **Severity:** Low
- **Recommendation:** Add maxLength validation (e.g., 100 characters)

---

## Notable Positive Observations

### ✅ Strengths Discovered

1. **Robust Waitlist Logic:** The automated waitlist promotion works flawlessly even with complex scenarios
2. **Good Error Messages:** Most validation errors provide helpful, actionable guidance
3. **Database Integrity:** Foreign key constraints and unique constraints prevent data corruption
4. **Health Monitoring:** The /api/health endpoint provides valuable system status information
5. **Logging Quality:** Request/response logging made debugging much easier during exploratory testing

---

## Bug Reproduction Examples

### BUG-001: Past Date Events
```
Steps to Reproduce:
1. Login as staff (dr.smith / password123)
2. Navigate to "Create Event"
3. Fill form with date: "2020-01-01"
4. Submit form
5. Event created successfully ❌

Expected: Validation error "Event date must be in the future"
Actual: Event created with past date
Priority: Medium
```

### BUG-002: Long Title Layout Issue
```
Steps to Reproduce:
1. Login as staff
2. Create event with title: "This is an extremely long event title that will probably cause layout issues when displayed in the event card grid because it has not been properly truncated or validated during creation and this continues for way too long"
3. View events list
4. Observe: Title overflows card boundaries

Expected: Title truncated with ellipsis or validation prevents long titles
Actual: Full title displayed, breaking layout
Priority: Low
```

---

## Recommendations from Exploratory Testing

### High Priority
1. **Add date validation:** Prevent creation of past-dated events
2. **Improve session expiry UX:** Auto-redirect to login on 403 errors
3. **Add title length limits:** Prevent layout issues with long event titles

### Medium Priority
4. **Clarify business rules:** Can staff book their own events?
5. **Add overbooking tooltip:** Explain when overbooking provides benefit
6. **Consider filter persistence:** Maintain filters in URL params

### Low Priority
7. **Network error guidance:** Help users check booking status after errors
8. **Waitlist position display:** Show "You are #3 on the waitlist"

---

## Test Coverage Gaps Identified

During exploratory testing, we identified these scenarios that deserve automated test coverage:

1. ❌ Past date validation (not currently tested)
2. ❌ Title length limits (not enforced)
3. ❌ Staff booking own events (edge case)
4. ✅ Concurrent bookings (covered in unit tests)
5. ✅ Waitlist promotion chain (covered in E2E tests)
6. ✅ Double booking prevention (covered in integration tests)

---

## Session Metrics

| Metric | Session 1 | Session 2 | Session 3 | Total |
|--------|-----------|-----------|-----------|-------|
| Duration | 90 min | 120 min | 60 min | 270 min |
| Issues Found | 5 | 5 | 5 | 15 |
| Critical Bugs | 0 | 0 | 0 | 0 |
| Positive Observations | 2 | 3 | 5 | 10 |
| Recommendations | 3 | 2 | 3 | 8 |

---

## Conclusion

Exploratory testing revealed that SMUCampusHub is fundamentally solid with good data integrity and error handling. The main findings relate to edge case validation (past dates, long strings) and user experience improvements (session handling, filter persistence).

**No critical defects were found** - the system correctly handles the core booking logic even under unusual conditions. The bugs discovered are minor and easily addressable.

**Key Strength:** The combination of database constraints and application-level validation creates a robust system resistant to data corruption.

**Recommendation:** Address the medium-priority validation gaps (past dates, title lengths) before production deployment.

---

**Testing Team:** CPS6002 Assessment  
**Completion Date:** January 2026  
**Status:** All sessions completed successfully
