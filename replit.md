# SMUCampusHub

## Overview

SMUCampusHub is a full-stack university event booking platform where students can browse and book academic events (lectures, labs, office hours), and staff can create and manage events with capacity limits, waitlist automation, and attendee exports. The system features role-based authentication (Student/Staff), automatic waitlist promotion when cancellations occur, 15-minute booking holds requiring confirmation, and calendar integration via ICS file downloads.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript, bundled via Vite 5
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack Query for server state caching, React Context for auth state, localStorage for token persistence
- **UI Components:** Shadcn/ui component library with Radix UI primitives
- **Styling:** Tailwind CSS with custom design tokens, Inter and Poppins fonts
- **Form Handling:** React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime:** Node.js 20 with Express.js
- **Language:** TypeScript throughout
- **Authentication:** JWT tokens with bcryptjs password hashing
- **API Design:** RESTful endpoints under `/api/` prefix
- **Security:** X-Powered-By disabled, input sanitization for XSS prevention, role-based authorization middleware

### Database Layer
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Drizzle ORM with drizzle-kit for migrations
- **Schema Location:** `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Key Tables:** users, events, bookings with proper foreign key relationships

### Testing Strategy
- **Framework:** Vitest with 30-second timeout for API tests
- **Test Types:** Unit tests (booking logic), API integration tests, performance tests, security tests
- **Coverage:** ~100 automated tests across all quadrants
- **Test Location:** `server/__tests__/` for backend, `client/src/__tests__/` for frontend documentation tests

### Key Business Logic
- **Capacity Enforcement:** Events have configurable capacity with optional 5% overbooking buffer
- **Waitlist System:** FIFO promotion when cancellations occur, position tracking for users
- **Booking Lifecycle:** Hold (15 min) → Confirmed/Waitlisted → Cancelled, with automatic expired hold cleanup
- **Department Validation:** Students can only book events matching their enrolled department

## External Dependencies

### Database
- **PostgreSQL:** Primary data store via Neon serverless (`@neondatabase/serverless`)
- **Connection:** Pool-based connection using `DATABASE_URL` environment variable

### Authentication
- **JWT:** `jsonwebtoken` for token generation and verification
- **Password Hashing:** `bcryptjs` for secure password storage
- **Session Secret:** `SESSION_SECRET` environment variable for JWT signing

### Data Export
- **CSV Generation:** `json2csv` for attendee list exports (staff feature)

### Development Tools
- **Drizzle Kit:** Database schema push and migration management
- **Vitest:** Test runner with UI and coverage support
- **ESBuild:** Production bundling for server code