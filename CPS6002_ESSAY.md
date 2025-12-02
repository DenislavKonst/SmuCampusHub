# Software Testing and Quality Assurance: A Comprehensive Approach to University Event Booking System Validation

## CPS6002 Assessment Essay

**Word Count:** 3,198 words

---

## 1. Introduction

Software testing and quality assurance represent fundamental pillars of modern software engineering practice, serving as the critical gateway between development and deployment. In an era where software systems increasingly govern essential aspects of organisational operations, the importance of rigorous, systematic testing cannot be overstated. The consequences of inadequate testing range from minor inconveniences to catastrophic failures—financial losses, reputational damage, and in critical systems, potential harm to human safety. This essay presents a comprehensive analysis of the testing strategies, methodologies, and professional practices applied to SMUCampusHub, a production-ready university event booking platform developed to meet the requirements of the CPS6002 Software Testing and Quality Assurance assessment.

The SMUCampusHub system addresses a real-world operational need within university environments: the efficient management of event bookings for students and staff. Universities host numerous events ranging from academic seminars and career fairs to networking sessions and workshops. Without a systematic booking platform, administrative overhead increases, double-bookings occur, and students miss opportunities due to poor visibility into available events. The platform encompasses complex functionality including role-based access control, capacity management with overbooking capabilities, automated waitlist promotion, booking lifecycle management with hold expiration, and calendar integration. This complexity demands a sophisticated, multi-layered testing approach that spans all four testing quadrants as defined by Brian Marick's testing matrix.

This essay articulates the problem scenario that necessitated comprehensive testing, examines additional considerations including ethical, legal, and professional factors, and demonstrates how the testing campaign satisfied basic, intermediate, and advanced requirements. The discussion draws upon industry-standard frameworks, tools, and methodologies while reflecting on the practical challenges encountered during the testing lifecycle. The Vitest testing framework provided the automation backbone, while manual exploratory testing ensured coverage of scenarios that automated scripts cannot adequately address.

The testing approach adopted for SMUCampusHub exemplifies the principle that quality cannot be tested into a product—it must be built in from the foundation. By integrating testing activities throughout the development lifecycle, employing risk-based prioritisation, and maintaining meticulous documentation, the project demonstrates professional software testing practice aligned with contemporary industry standards. The outcome—109 automated tests achieving 100% pass rate across all four quadrants—validates both the system's quality and the testing methodology's effectiveness.

---

## 2. Problem Scenario

### 2.1 System Context and Stakeholders

SMUCampusHub serves a university community comprising two primary user categories: students seeking to discover and book events, and staff members responsible for event creation and management. The system must accommodate diverse departmental structures, varying event types (workshops, seminars, networking events, career fairs), and differing capacity requirements. This multi-stakeholder environment introduces complexity that demands careful attention to authorisation, data integrity, and user experience.

The critical business requirements include:
- **Authentication and Authorisation:** Secure role-based access ensuring students can only book events while staff can create, modify, and manage events within their departmental scope.
- **Booking Lifecycle Management:** A sophisticated booking flow incorporating 15-minute hold periods, confirmation requirements, automatic status transitions, and graceful handling of capacity constraints.
- **Waitlist Automation:** First-In-First-Out (FIFO) waitlist management with automatic promotion when cancellations occur, maintaining position transparency for waitlisted users.
- **Capacity Enforcement:** Configurable capacity limits with optional overbooking (5% buffer for critical events), preventing over-subscription while maximising attendance.
- **Calendar Integration:** ICS file generation for confirmed bookings, enabling integration with external calendar applications.

### 2.2 Risk Analysis and Testing Priorities

A risk-based approach governed the testing strategy, with risks categorised by likelihood and impact. High-priority risks included:

1. **Authentication Bypass (Critical):** Unauthorised access could expose sensitive student data or enable malicious event manipulation. Testing priority: Maximum.
2. **Booking Integrity Failures (High):** Race conditions in concurrent booking scenarios could result in overbooking beyond configured limits. Testing priority: High.
3. **Waitlist Promotion Errors (High):** Incorrect promotion ordering could violate fairness expectations and damage user trust. Testing priority: High.
4. **Data Validation Failures (Medium):** Insufficient input validation could introduce malformed data or enable injection attacks. Testing priority: Medium-High.
5. **Performance Degradation (Medium):** Slow response times during peak usage periods could frustrate users and reduce system adoption. Testing priority: Medium.

This risk hierarchy directly informed test case prioritisation, with critical authentication and authorisation tests executed first, followed by core booking logic validation, and subsequently non-functional testing for performance and compatibility. The approach aligns with the IEEE 829 standard for software test documentation, which emphasises the importance of risk assessment in test planning. Resources are finite, and testing every possible scenario is impractical; therefore, intelligent prioritisation based on risk maximises the probability of detecting critical defects within available time and budget constraints.

The testing strategy also considered the software's operational context. As a university system, SMUCampusHub would experience predictable usage patterns—peaks during event registration periods, lower activity during academic breaks. Performance testing was designed to simulate realistic load scenarios rather than arbitrary stress tests, ensuring that benchmarks reflected actual operational requirements.

### 2.3 Quality Objectives

The testing campaign established measurable quality objectives aligned with stakeholder expectations:
- **Functional Correctness:** 100% pass rate for critical path scenarios
- **Security Posture:** Zero high-severity vulnerabilities in authentication, authorisation, and input validation
- **Performance Benchmarks:** API response times under 1500ms for cold-start scenarios, under 200ms after warm-up
- **Usability Standards:** Minimum 8/10 usability score based on Nielsen's heuristic evaluation
- **Reliability:** System availability exceeding 99% during simulated concurrent load testing

---

## 3. Additional Considerations

### 3.1 Ethical Considerations

Software testing inherently involves ethical dimensions that extend beyond technical correctness. The SMUCampusHub testing campaign addressed several ethical considerations:

**Data Privacy and Protection:** The system processes personal data including usernames, departmental affiliations, and booking histories. Testing activities utilised synthetic test data rather than real user information, ensuring compliance with data protection principles. Password handling was verified to employ industry-standard bcrypt hashing with appropriate salt rounds, preventing plaintext storage or transmission.

**Fairness in Waitlist Management:** The FIFO waitlist algorithm embodies an ethical commitment to fairness—users who joined the waitlist earlier receive priority for promotion. Testing verified this fairness property through dedicated unit tests examining waitlist ordering under various scenarios.

**Accessibility and Inclusion:** The platform must serve all users regardless of ability. Accessibility testing documented compliance with WCAG 2.1 guidelines, including keyboard navigation requirements, screen reader compatibility, colour contrast ratios, and semantic HTML structure. While automated accessibility testing was documented rather than fully automated, the commitment to inclusive design reflects ethical professional practice. The 25 accessibility documentation tests ensure that compliance requirements are tracked systematically, providing a foundation for future accessibility audits. Excluding users with disabilities from a university platform would represent both an ethical failure and, in many jurisdictions, a legal violation of disability discrimination legislation.

**Automation Impact Assessment:** The introduction of automated testing required consideration of the broader implications. Automation was positioned as a complement to, rather than replacement for, human judgment. Exploratory testing sessions maintained the essential human element in quality assurance, recognising that automated tests, however comprehensive, cannot fully replicate human intuition and creative problem-solving. The decision to automate 109 tests while retaining manual exploratory and usability testing reflects a balanced approach that leverages automation's strengths (speed, consistency, repeatability) while preserving human testers' unique capabilities (intuition, contextual judgment, creative exploration).

**Impartiality in Testing:** Testers must maintain objectivity, avoiding bias toward confirming that the system works correctly. The testing approach deliberately sought to break the system through negative testing, boundary condition analysis, and adversarial inputs. Security tests included SQL injection attempts, malformed JWT tokens, and XSS payloads—all designed to expose vulnerabilities rather than confirm expected behaviour.

### 3.2 Legal Considerations

The testing approach acknowledged legal requirements including:

**Data Protection Legislation:** Test environments utilised isolated databases with synthetic data, preventing inadvertent exposure of personal information. API responses were verified to exclude sensitive fields (passwords, internal identifiers) in user-facing outputs.

**Security Compliance:** Security testing verified protection against common vulnerabilities including SQL injection, cross-site scripting (XSS), and authentication bypass attempts. The X-Powered-By header was disabled to prevent technology fingerprinting, reducing the attack surface for potential adversaries.

### 3.3 Professional Practice

The testing campaign exemplified professional software testing practice through:

**Structured Documentation:** All testing activities produced traceable artefacts including the test plan, test cases, defect log, and final integrated report. Documentation followed consistent formatting and terminology, enabling stakeholder comprehension.

**Tool Competency:** The project employed industry-standard tools including Vitest for test automation, Drizzle ORM for database interactions, and Express.js for API development. Tool selection was justified based on project requirements, team familiarity, and ecosystem compatibility.

**Continuous Improvement:** Defects identified during testing were logged with severity classifications, reproduction steps, and resolution tracking. The iterative refinement of test cases based on defect patterns demonstrates the feedback-driven nature of professional testing practice.

---

## 4. Meeting Assessment Requirements

### 4.1 Basic Requirements

The basic requirements establish the foundation for competent software testing practice. SMUCampusHub addressed these requirements through systematic implementation of fundamental testing activities.

**Functional Testing:** The test suite includes comprehensive functional tests validating core user journeys. Authentication endpoints were tested for successful login with valid credentials, rejection of invalid credentials, and proper error messaging for edge cases. Event management functionality was verified through tests covering event creation by staff, event retrieval, and single-event queries. Booking endpoints received particular attention given their business criticality, with tests confirming successful booking creation, cancellation handling, and user booking retrieval.

**Unit Testing:** The booking logic test suite (31 tests) provides extensive unit test coverage for critical business logic. Tests are organised into logical groupings including capacity calculations, booking status determination, remaining slot calculations, waitlist promotion logic, department validation, and input validation. Each test follows the Arrange-Act-Assert pattern, with descriptive naming conventions that serve as executable documentation.

Example test categories include:
- `calculateEffectiveCapacity`: Verifying the 5% overbooking calculation
- `determineBookingStatus`: Testing status assignment logic at capacity boundaries
- `getNextWaitlistedBooking`: Validating FIFO ordering for waitlist promotion
- `validateEventCapacity`: Ensuring capacity values fall within acceptable ranges (1-1000)

**API Testing:** Twenty integration tests validate API endpoint behaviour, covering authentication flows, event CRUD operations, booking management, and health monitoring. Tests verify both success paths and error handling, ensuring the API provides appropriate HTTP status codes and response formats for various scenarios.

**Defect Tracking:** The defect log documents ten identified defects with severity classifications (Critical, High, Medium, Low), detailed descriptions, reproduction steps, and resolution status. Four defects were resolved during the testing cycle, including the critical X-Powered-By header disclosure (DEF-003) and the high-severity capacity validation bypass (DEF-004).

### 4.2 Intermediate Requirements

Intermediate requirements extend beyond basic functional verification to encompass broader quality dimensions and more sophisticated testing techniques.

**Exploratory Testing:** Three structured exploratory testing sessions were conducted, each with defined charters, time-boxes, and documented findings. Session topics included:
1. Event booking edge cases and boundary conditions
2. Staff event management workflows
3. Concurrent user scenarios and system behaviour under load

Exploratory testing revealed insights not captured by scripted tests, including usability friction points in the booking confirmation flow and potential confusion around department-based booking restrictions.

**Usability Testing:** A comprehensive usability evaluation was conducted using Nielsen's ten heuristics as the analytical framework. The evaluation examined visibility of system status (booking confirmation feedback), match between system and real world (event categorisation terminology), user control and freedom (booking cancellation workflows), and error prevention (input validation patterns). The system achieved an 8/10 overall usability score, with recommendations for enhanced error messaging and improved progress indicators.

**Non-Functional Testing (Performance):** Performance testing validated system responsiveness under various conditions:
- **Response Time Benchmarks:** GET /api/events responds within 1500ms (cold-start), typically under 200ms after warm-up
- **Concurrent Load Testing:** System successfully handles 10-50 simultaneous requests without degradation
- **Memory Leak Detection:** Repeated request cycles verified absence of memory leaks
- **CSV Export Performance:** Attendee data export completes within acceptable timeframes

**Non-Functional Testing (Security):** Twenty-two security tests validate the system's defensive posture:
- Authentication security: Token validation, malformed JWT rejection, expired token handling
- Authorisation security: Role-based access enforcement, cross-user data protection
- Input validation: SQL injection prevention, XSS mitigation, capacity range enforcement
- Session management: Unique token generation, logout invalidation
- Data protection: Error message sanitisation, stack trace suppression

**Test Automation:** The project employs appropriate automation for repeatable verification activities. The Vitest framework executes 109 automated tests across five test files, with a universal testing script (`run-tests.sh`) providing one-command test execution and report generation. Automation is applied judiciously—unit and integration tests are fully automated, while exploratory and usability testing retain their essential human-driven character.

### 4.3 Advanced Requirements

Advanced requirements demand comprehensive coverage across all testing quadrants, sophisticated automation practices, and insightful analysis that informs actionable recommendations.

**Quadrant 1 (Technology-Facing, Supporting Development):** Unit tests for business logic components ensure correct behaviour of capacity calculations, status determinations, and validation routines. These tests execute rapidly (sub-second), enabling developers to run them frequently during development. The 31 unit tests provide confidence in core algorithmic correctness.

**Quadrant 2 (Technology-Facing, Critiquing Product):** API integration tests validate that components interact correctly, exercising the full request-response cycle through the Express.js middleware stack to the PostgreSQL database and back. Twenty API tests verify endpoint behaviour under normal and error conditions.

**Quadrant 3 (Business-Facing, Critiquing Product):** Exploratory testing and usability evaluation address business-facing quality concerns that cannot be fully automated. Cognitive walkthroughs examined task completion from the user's perspective, while heuristic evaluation applied established usability principles. The 25 accessibility documentation tests ensure that compliance requirements are tracked and verified.

**Quadrant 4 (Business-Facing, Supporting Development):** Performance and security testing ensure the system meets non-functional requirements essential for production deployment. The 33 tests in this quadrant (22 security, 11 performance) validate that the system is not only functionally correct but also fast, secure, and reliable.

**Comprehensive Coverage Justification:** Test coverage was guided by risk analysis rather than arbitrary numerical targets. Critical paths (authentication, booking creation, waitlist promotion) receive exhaustive coverage, while lower-risk functionality receives proportionate attention. This risk-weighted approach maximises defect detection efficiency while respecting resource constraints.

**Metrics and Analysis:** The test campaign produced quantitative metrics enabling objective quality assessment:
- **Pass Rate:** 109/109 tests passing (100%)
- **Defect Detection:** 10 defects identified, 4 resolved, 6 open (lower severity)
- **Execution Time:** Full test suite completes in approximately 20 seconds
- **Coverage Distribution:** Q1 (31 tests), Q2 (20 tests), Q3 (25 tests), Q4 (33 tests)

**Actionable Recommendations:** The final integrated report synthesises testing findings into concrete recommendations that provide a roadmap for continued quality improvement:
1. **Implement rate limiting for production deployment:** While the system handles concurrent requests effectively, production environments face the additional threat of denial-of-service attacks. Rate limiting would protect system availability.
2. **Integrate automated accessibility testing using @axe-core:** Moving from documented accessibility requirements to automated verification would enable continuous accessibility regression testing.
3. **Add Playwright-based end-to-end automation for UI verification:** Browser-based automation would validate complete user journeys including JavaScript interactions, providing confidence in frontend functionality.
4. **Conduct formal WCAG audit prior to public launch:** Professional accessibility auditing would identify compliance gaps not detectable through automated tools.
5. **Implement email notifications for booking confirmations and waitlist promotions:** Currently identified as planned future functionality, this would significantly enhance user experience by providing proactive communication.

These recommendations demonstrate that testing is not merely a verification activity but a source of strategic insight informing product development priorities.

---

## 5. Conclusion

The SMUCampusHub testing campaign demonstrates that comprehensive software quality assurance requires a multi-faceted approach spanning technical verification, user-centred evaluation, and professional practice. By systematically addressing all four testing quadrants, the project achieved a robust quality posture suitable for production deployment.

The testing methodology employed reflects contemporary industry best practices: risk-based prioritisation ensuring efficient resource allocation, automated testing for repeatable verification, manual testing for creative exploration, and meticulous documentation for traceability and communication. The 109 automated tests provide a regression safety net enabling confident future development, while the documented exploratory and usability findings offer insights that inform product evolution.

Key methodological decisions merit reflection. The choice to adjust performance thresholds (1500ms for cold-start scenarios) acknowledges the practical realities of serverless deployment environments while maintaining meaningful quality gates. The decision to document rather than fully automate accessibility testing reflects pragmatic resource allocation while preserving commitment to inclusive design principles.

The defect lifecycle demonstrated professional practice: defects were logged with appropriate detail, prioritised by severity, and tracked through resolution. The four resolved defects (including the critical X-Powered-By disclosure and high-severity capacity validation bypass) evidence the value of systematic testing in identifying and remediating vulnerabilities before production exposure.

Ethical considerations permeated the testing approach. Data privacy was protected through synthetic test data, fairness was verified through waitlist algorithm testing, and accessibility requirements were documented to ensure inclusive design. The automation strategy was positioned to augment rather than replace human judgment, preserving the essential role of skilled testers in the quality assurance process.

The professional deliverables—test plan, defect log, usability evaluation, exploratory testing findings, and final integrated report—collectively demonstrate the documentation standards expected in commercial software development. These artefacts serve multiple purposes: communication with stakeholders, evidence for compliance, and historical record for future maintenance.

Looking forward, the recommendations generated through testing provide a roadmap for continued quality improvement. Rate limiting, enhanced accessibility automation, and email notifications represent logical next steps that would further strengthen the system's production readiness.

The universal testing script (`run-tests.sh`) represents a practical contribution to testing efficiency, providing one-command execution of the complete test suite with automated report generation. This tooling investment reflects the principle that testing infrastructure itself requires attention and refinement—tools that reduce friction in test execution encourage more frequent testing, thereby improving overall quality outcomes.

In conclusion, the SMUCampusHub testing campaign illustrates that software quality is not a destination but a journey. Through systematic planning, rigorous execution, thoughtful analysis, and professional documentation, the project achieves a quality standard that satisfies stakeholder requirements while establishing foundations for ongoing improvement. The approaches and methods employed—risk-based prioritisation, quadrant-balanced coverage, appropriate automation, and ethical practice—represent transferable principles applicable to software testing challenges across domains and technologies.

The learning outcomes addressed through this project extend beyond technical testing competency. The experience of planning a testing campaign, executing tests across multiple quadrants, analysing results, and communicating findings develops professional capabilities essential for quality assurance roles. The recognition that testing involves ethical dimensions, stakeholder communication, and strategic thinking—not merely script execution—represents perhaps the most valuable insight gained.

As software systems continue to grow in complexity and criticality, the demand for skilled testing professionals will only increase. The methodologies demonstrated in this project—rooted in established frameworks yet adapted to contemporary tools and practices—provide a foundation for meeting that demand. Quality assurance is not an afterthought or a cost centre; it is a strategic capability that differentiates reliable software from unreliable software, trustworthy organisations from untrustworthy ones. The SMUCampusHub testing campaign embodies this perspective, treating quality as a first-class concern deserving systematic, professional attention.

---

## References

- Marick, B. (2003). Agile Testing Quadrants. Available at: exampler.com
- Nielsen, J. (1994). 10 Usability Heuristics for User Interface Design. Nielsen Norman Group.
- WCAG 2.1 (2018). Web Content Accessibility Guidelines. W3C Recommendation.
- ISO/IEC 25010:2011. Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE).
- OWASP Testing Guide v4. Open Web Application Security Project.

---

**Word Count:** Approximately 3,000 words

*This essay was prepared as part of the CPS6002 Software Testing and Quality Assurance assessment, demonstrating the testing approaches, methodologies, and professional practices applied to the SMUCampusHub university event booking platform.*
