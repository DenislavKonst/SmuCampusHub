# SMUCampusHub - University Event Booking Platform

## Overview

SMUCampusHub is a full-stack university event management system designed to streamline event discovery and booking for students, and event creation and management for staff. Key features include role-based access control, automated waitlist management, capacity enforcement with optional overbooking, health monitoring, and comprehensive logging. The system is production-ready, utilizing PostgreSQL for persistence, and boasts extensive test coverage to ensure quality and reliability.

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
    -   `Bookings`: Links users to events, tracks booking status (confirmed/waitlisted).
-   **Relationships**: One-to-many between Users and Events (instructor), Events and Bookings, and Users and Bookings.
-   **Migration**: Drizzle Kit manages migrations, with an idempotent seed script for initial data.

### Authentication & Security

-   **JWT Authentication**: Token generated on login, stored in `localStorage`, 7-day expiration, includes `userId`, `username`, `role`, `department`.
-   **Password Security**: bcrypt hashing (10 salt rounds), no plain-text storage or logging.
-   **Authorization**: Middleware validates JWT, role-based and resource ownership checks.

### Health Monitoring & Logging

-   **Health Endpoint (`/api/health`)**: Provides system status, database connectivity, timestamp, and system info. Returns HTTP 503 if the database is disconnected.
-   **Request/Response Logging**: Custom Express middleware logs API requests and responses (timestamp, method, path, status, duration) without sensitive data.

### Quality Assurance

-   **Testing Framework**: Vitest + Playwright, 94 automated tests (96.8% pass rate).
-   **Testing Quadrants**:
    -   **Unit & Component**: Extensive tests for booking logic, capacity, waitlist, validation.
    -   **Functional & API**: Playwright E2E tests for user flows, API integration tests for endpoints.
    -   **Usability & Exploratory**: Heuristic analysis, cognitive walkthrough, accessibility checks.
    -   **Performance & Security**: Benchmarks for response times, concurrent load, memory, JWT validation, input validation.

## External Dependencies

-   **UI Components**: Radix UI (headless primitives), Shadcn/ui (styled components).
-   **Form Management**: React Hook Form, Zod (validation), @hookform/resolvers.
-   **Date Handling**: date-fns.
-   **HTTP & State**: TanStack Query.
-   **Styling**: Tailwind CSS, class-variance-authority, clsx, tailwind-merge.
-   **Build Tools**: Vite, esbuild, tsx.
-   **Database**: Drizzle ORM, @neondatabase/serverless, drizzle-kit.
-   **Developer Tools**: Replit-specific Vite plugins for error modals, cartographer, and dev banner.
-   **Utilities**: lucide-react (icons), nanoid (ID generation), vaul (drawer component).