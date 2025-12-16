# SMUCampusHub - University Event Booking Platform

## Overview

SMUCampusHub is a full-stack university event management system designed to streamline event discovery and booking for students, and event creation and management for staff. Key features include role-based access control, automated waitlist management, capacity enforcement with optional overbooking, health monitoring, and comprehensive logging. The system is production-ready, utilizing PostgreSQL for persistence, and boasts extensive test coverage to ensure quality and reliability.

## Core Capabilities

### Event Catalogue
- Browse and search events with filters (date, type, department)
- Event details page displays remaining capacity and waitlist status
- Event cards show booking status (Available, Limited, Full - Waitlist)

### Authentication & Roles
- **Students**: View bookings, manage waitlists, cancel bookings, add confirmed events to calendar (.ics download)
- **Staff**: Create/edit events, set capacity limits, enable overbooking (+5% for critical events), export attendee data to CSV

### Booking Lifecycle
- **Hold System**: Initial bookings are placed on hold for 15 minutes, requiring confirmation before becoming final
- **Hold Confirmation**: Students can confirm or release holds from their dashboard with countdown timer
- **Automatic Status**: After confirmation, bookings are confirmed (if slots available) or waitlisted (if full)
- **Waitlist Promotion**: Automatic promotion from waitlist upon cancellation (with position tracking)
- **Reschedule**: Confirmed bookings can be rescheduled to alternative events in the same department
- **Department Validation**: Students can only book events matching their department
- **Expired Hold Cleanup**: Backend cron-style endpoint to clean up expired holds and promote waitlisted users

### Calendar Integration
- "Add to Calendar" button for confirmed bookings (downloads .ics file compatible with Google Calendar, Outlook, Apple Calendar)

### Future Enhancements (Planned)
- **Email Notifications**: Automated emails for booking confirmations, cancellations, and waitlist promotions (requires external email service integration like SendGrid/Mailgun)
- **Calendar Sync**: Real-time calendar synchronization with Google Calendar/Outlook APIs
- **Push Notifications**: Browser push notifications for waitlist updates

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

-   **Technology Stack**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (server state), Shadcn/ui (components), Tailwind CSS.
-   **Design System**: Adapts Material Design, uses Inter and Poppins fonts, consistent spacing, and color-coded event types.
-   **Key Pages**: Home, Event Detail, Dashboard (role-specific), Event Form (staff), Login.
-   **State Management**: `localStorage` for authentication, React Context for auth state, TanStack Query for API data caching, React Hook Form with Zod for form validation.

### Backend

-   **Technology Stack**: Node.js, Express.js, TypeScript, PostgreSQL with Drizzle ORM, bcryptjs (password hashing), jsonwebtoken (JWT), json2csv.
-   **API Design**: RESTful, JWT bearer token authentication, role-based middleware, consistent JSON response format, request/response logging.
-   **Core Endpoints**: Authentication, health check, event CRUD, event booking/cancellation, user-specific bookings, CSV export for attendees.
-   **Business Logic**:
    -   **Capacity & Overbooking**: Base capacity with optional +5% overbooking. Hard limit prevents booking beyond effective capacity.
    -   **Waitlist Automation**: Automatic promotion from waitlist upon cancellation.
    -   **Department Validation**: Students can only book events matching their department.
    -   **Role-Based Authorization**: Differentiates student (booking) and staff (CRUD) permissions.

### Data Storage

-   **Database**: PostgreSQL with Drizzle ORM for schema management.
-   **Schema**:
    -   `Users`: Stores user details, role, and department.
    -   `Events`: Stores event details including capacity and instructor.
    -   `Bookings`: Links users to events, tracks booking status (hold/confirmed/waitlisted), holdExpiresAt timestamp, and waitlistPosition.
-   **Relationships**: One-to-many between Users and Events (instructor), Events and Bookings, and Users and Bookings.
-   **Migration**: Drizzle Kit manages migrations, with an idempotent seed script for initial data.

### Authentication & Security

-   **JWT Authentication**: Token generated on login, stored in `localStorage`, 7-day expiration, includes `userId`, `username`, `role`, `department`.
-   **Password Security**: bcrypt hashing (10 salt rounds), no plain-text storage or logging.
-   **Authorization**: Middleware validates JWT, role-based and resource ownership checks.

### Health Monitoring & Logging

-   **Health Endpoint (`/api/health`)**: Provides system status, database connectivity, timestamp, and system info. Returns HTTP 503 if the database is disconnected.
-   **Request/Response Logging**: Custom Express middleware logs API requests and responses (timestamp, method, path, status, duration) without sensitive data.

### Testing

### Universal Testing Script
- **Command:** `./run-tests.sh`
- **Function:** Starts application, runs all tests, generates comprehensive results document
- **Output:** Creates `TEST_RESULTS_YYYYMMDD_HHMMSS.md` with complete test summary
- **Environment Detection:** Automatically detects local vs cloud environment and uses appropriate configuration

### Local Development Setup

When running on a local device, the test script automatically handles Vite configuration:

1. **Automatic mode** (recommended):
   ```bash
   ./run-tests.sh
   ```
   The script detects the local environment and temporarily swaps to `vite.config.local.ts` (without cloud-specific plugins).

2. **Manual development**:
   ```bash
   # Swap config for local development
   cp vite.config.ts vite.config.ts.backup
   cp vite.config.local.ts vite.config.ts
   
   # Run the application
   npm run dev
   
   # Restore when done
   mv vite.config.ts.backup vite.config.ts
   ```

### Required Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/smucampushub
SESSION_SECRET=your-secret-key
```

## Quality Assurance

-   **Testing Framework**: Vitest with 109 automated tests (100% pass rate).
-   **Testing Quadrants**:
    -   **Unit Tests (Q1)**: 31 tests for booking logic, capacity calculations, waitlist promotion, input validation.
    -   **API Integration Tests (Q2)**: 20 tests for authentication, events CRUD, bookings endpoints.
    -   **Usability & Exploratory (Q3)**: Heuristic analysis, cognitive walkthrough, accessibility checks (25 documented tests).
    -   **Performance & Security Tests (Q4)**: 33 tests for response times, concurrent load, JWT validation, injection prevention.
-   **Documentation**: TEST_PLAN.md, DEFECT_LOG.csv, USABILITY_EVALUATION.md, EXPLORATORY_TESTING_FINDINGS.md, FINAL_TEST_REPORT.md.

## External Dependencies

-   **UI Components**: Radix UI (headless primitives), Shadcn/ui (styled components).
-   **Form Management**: React Hook Form, Zod (validation), @hookform/resolvers.
-   **Date Handling**: date-fns.
-   **HTTP & State**: TanStack Query.
-   **Styling**: Tailwind CSS, class-variance-authority, clsx, tailwind-merge.
-   **Build Tools**: Vite, esbuild, tsx.
-   **Database**: Drizzle ORM, @neondatabase/serverless, drizzle-kit.
-   **Developer Tools**: Vite plugins for development experience.
-   **Utilities**: lucide-react (icons), nanoid (ID generation), vaul (drawer component).