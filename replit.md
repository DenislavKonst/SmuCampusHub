# SMUCampusHub - University Event Booking Platform

## Overview

SMUCampusHub is a full-stack university event management system that enables students to discover and book academic events (lectures, labs, office hours) while providing staff with tools to create and manage these events. The platform features role-based access control, automated waitlist management, capacity enforcement with optional +5% overbooking, health monitoring, comprehensive request/response logging, and real-time booking status updates. The system is production-ready with PostgreSQL persistence, comprehensive E2E test coverage, and database connectivity monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for utility-first styling

**Design System:**
- Material Design principles adapted for educational platforms
- Typography: Inter (body) and Poppins (headings) from Google Fonts
- Consistent spacing system using Tailwind units (2, 4, 6, 8)
- Color-coded event types (blue for lectures, green for labs, purple for office hours)
- Responsive grid layouts (3 columns on desktop for event cards)

**Key Pages:**
- **Home**: Hero section with campus imagery, search/filter interface for events
- **Event Detail**: Comprehensive event information with booking/cancellation actions
- **Dashboard**: Role-specific views (student bookings vs. staff event management)
- **Event Form**: Staff-only interface for creating/editing events
- **Login**: Authentication gateway with credential validation

**State Management:**
- Authentication state persisted in localStorage (JWT token + user object)
- React Context for auth state sharing across components
- TanStack Query for API data caching and automatic refetching
- Form state managed by React Hook Form with Zod validation

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js for the REST API server
- TypeScript for type safety across the stack
- PostgreSQL database with Drizzle ORM for persistence
- bcryptjs for password hashing
- jsonwebtoken (JWT) for stateless authentication
- json2csv for CSV export functionality
- Request/response logging middleware for debugging

**API Design Pattern:**
- RESTful endpoints following resource-based naming
- JWT bearer token authentication via Authorization header
- Role-based middleware (authenticateToken) for protected routes
- Consistent JSON response format with error handling
- Request/response logging middleware for debugging

**Core Endpoints:**
- `POST /api/auth/login` - Authentication with JWT generation
- `GET /api/health` - Health check with database connectivity status
- `GET /api/events` - List all events with computed statistics
- `GET /api/events/:id` - Single event details
- `POST /api/events` - Create event (staff only)
- `PUT /api/events/:id` - Update event (staff only)
- `DELETE /api/events/:id` - Delete event (staff only)
- `GET /api/events/:id/export` - CSV export of attendees (staff only)
- `GET /api/events/staff` - Events by authenticated instructor
- `POST /api/bookings` - Book an event (student only)
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/user` - User's bookings with event details

**Business Logic:**

*Capacity Enforcement & Overbooking:*
- Base capacity defined per event
- Optional overbooking: Staff can enable +5% additional capacity (allowOverbooking flag)
- Effective capacity: `Math.floor(capacity * 1.05)` when overbooking enabled
- Hard limit: Students cannot book beyond effective capacity
- Automatic waitlist: When effective capacity is reached, new bookings enter waitlist
- UI displays effective capacity when overbooking is enabled
- Staff validation: Only event instructors can modify their events

*Waitlist Automation:*
- When a booking is cancelled, first waitlisted user is automatically promoted
- Status transitions: waitlisted → confirmed
- Real-time statistics: confirmed count, waitlisted count, remaining capacity

*Department Validation:*
- Students can only book events matching their enrolled department
- Enforced at booking creation to prevent cross-department registrations

*Role-Based Authorization:*
- Student role: Browse events, create/cancel bookings, view personal dashboard
- Staff role: All student permissions plus event CRUD operations and attendee exports

### Data Storage

**PostgreSQL Database (Production):**
- Active PostgreSQL database with Drizzle ORM
- Automatic schema synchronization via `drizzle-kit push`
- Foreign-key constraints for referential integrity
- Cascade delete on event deletion (removes associated bookings)
- Idempotent seed script populates initial data if database is empty

**Database Schema:**

*Users Table:*
- Fields: id (UUID), username (unique), password (bcrypt hashed), role, department, fullName
- Indexes: username for login lookups
- Seed data: 5 users (3 students: alice, bob, charlie; 2 staff: prof_smith, prof_jones)

*Events Table:*
- Fields: id, title, description, type, department, date, startTime, endTime, location, capacity, instructor, instructorId, allowOverbooking, createdAt
- allowOverbooking: integer (0=false, 1=true) enables +5% capacity
- Foreign key: instructorId → users.id
- Supports filtering by department and type
- Seed data: 10+ sample events across departments

*Bookings Table:*
- Fields: id, userId, eventId, status (confirmed/waitlisted), createdAt
- Foreign keys: userId → users.id, eventId → events.id (cascade delete)
- Prevents duplicate bookings per user/event combination

**Data Relationships:**
- Users → Events: One-to-many (instructor creates multiple events)
- Events → Bookings: One-to-many (event has multiple bookings, cascade delete)
- Users → Bookings: One-to-many (user has multiple bookings)

**Migration & Deployment:**
- Database migrations managed by Drizzle Kit
- Schema changes applied via `npm run db:push`
- Seed script runs automatically on server start if database is empty
- Environment variable: DATABASE_URL for connection

### Authentication & Security

**JWT Authentication:**
- Token generation on successful login with 7-day expiration
- Payload includes: userId, username, role, department
- Secret key configurable via SESSION_SECRET environment variable
- Token storage: localStorage on client, Authorization header for requests

**Password Security:**
- bcrypt hashing with salt rounds (10)
- Passwords never transmitted or logged in plain text
- No password included in API responses

**Authorization Model:**
- Middleware validates JWT and attaches user object to request
- Route-level checks for role requirements (staff vs student)
- Resource ownership validation (staff can only edit own events)

### CSV Export Feature

**Implementation:**
- Uses json2csv Parser library for data transformation
- Generates attendee list with columns: name, username, status, bookedAt
- Filtered to confirmed bookings only (excludes waitlist)
- Content-Type: text/csv with attachment disposition header
- Staff-only endpoint with event ownership validation

### Health Monitoring & Logging

**Health Endpoint (`/api/health`):**
- Returns comprehensive system status
- Database connectivity check via `SELECT 1` query
- Response includes:
  - Status: "healthy" or "unhealthy"
  - Timestamp (ISO string)
  - Database status and type (PostgreSQL)
  - System info: Node version, platform, uptime
- HTTP 503 status returned if database is disconnected
- Useful for production monitoring and uptime checks

**Request/Response Logging:**
- Custom Express middleware logs all API requests
- Request logging includes: timestamp, method, path, IP, user-agent, username
- Response logging includes: timestamp, method, path, status code (color-coded), duration (ms)
- Color coding: green for 2xx/3xx responses, red for 4xx/5xx errors
- No sensitive data logged (request/response bodies excluded)
- Helps with debugging and performance monitoring

### Quality Assurance

**Comprehensive E2E Test Suite:**
- Playwright-based automated testing covering all critical workflows
- Test coverage includes:
  - Authentication flows (valid/invalid credentials)
  - Event browsing and filtering (department/type filters)
  - Student booking lifecycle (book, view on dashboard, cancel)
  - Staff event CRUD operations (create, read, update, delete)
  - Overbooking feature (effective capacity verification)
  - Waitlist automation (capacity enforcement, automatic promotion)
  - Department validation (cross-department booking prevention)
  - CSV export functionality (staff-only attendee export)
  - Role-based authorization (student vs staff permissions)
- All tests passed successfully
- Production-ready with comprehensive regression coverage

## External Dependencies

### UI Component Libraries
- **Radix UI**: Headless component primitives for accessibility and behavior
  - Includes: Dialog, Dropdown, Select, Toast, Accordion, and 20+ other components
  - Ensures WCAG compliance and keyboard navigation support

- **Shadcn/ui**: Pre-styled Radix components following design system
  - Configured in components.json with New York style variant
  - Tailwind CSS variables for theming (see index.css for color tokens)

### Form Management
- **React Hook Form**: Performant form state with minimal re-renders
- **Zod**: Schema validation for forms and API payloads
- **@hookform/resolvers**: Bridge between React Hook Form and Zod

### Date Handling
- **date-fns**: Lightweight date formatting and manipulation
- Used for displaying event dates/times in readable formats

### HTTP & State
- **TanStack Query**: Server state management with automatic caching
  - Query invalidation on mutations for fresh data
  - Configured with custom fetch wrapper (apiRequest)

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **clsx** + **tailwind-merge**: Conditional class merging utility

### Build Tools
- **Vite**: Fast development server with HMR
- **esbuild**: Production bundler for server code
- **tsx**: TypeScript execution for development server

### Database (Production)
- **Drizzle ORM**: TypeScript-first ORM for PostgreSQL
- **@neondatabase/serverless**: Serverless Postgres driver for Neon
- **drizzle-kit**: Migration generator and schema management

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for Replit environment
- **@replit/vite-plugin-cartographer**: Code mapping for debugging
- **@replit/vite-plugin-dev-banner**: Development environment indicator

### Additional Dependencies
- **cmdk**: Command palette component (if needed for future search enhancements)
- **lucide-react**: Icon library with 1000+ SVG icons
- **nanoid**: Unique ID generation for client-side operations
- **vaul**: Drawer component for mobile interfaces