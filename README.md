# SMUCampusHub - University Event Booking Platform

A full-stack web application for managing university events, lectures, labs, and office hours. Students can browse and book events while staff can create and manage them with built-in waitlist automation.

## 🎯 Features

### For Students
- **Browse Events**: Search and filter events by type (lecture/lab/office hours) and department
- **Book Events**: Instant booking with automatic waitlist when events are full
- **Dashboard**: View all confirmed bookings and waitlisted events
- **Department Validation**: Only book events from your enrolled department
- **Automatic Promotion**: Get automatically promoted from waitlist when spots open

### For Staff
- **Event Management**: Create, edit, and delete events
- **Capacity Control**: Set and manage event capacity limits
- **Attendee Export**: Download attendee lists as CSV files
- **Dashboard**: View all your events with real-time booking statistics

### Core Functionality
- **JWT Authentication**: Secure login with role-based access (Student/Staff)
- **Waitlist Management**: Automatic promotion when cancellations occur
- **Capacity Enforcement**: Prevent overbooking beyond set limits
- **Real-time Updates**: See booking counts and waitlist status instantly

## 🔐 Role-Based Access Control

The application implements comprehensive role-based access control at three levels:

### 1. Frontend (UI Visibility)

| Feature | Student | Staff |
|---------|---------|-------|
| Browse all events | Yes | Yes |
| View event details | Yes | Yes |
| Book events | Yes | No |
| Cancel own bookings | Yes | N/A |
| Reschedule bookings | Yes | N/A |
| Create events | No | Yes |
| Edit own events | No | Yes |
| Delete own events | No | Yes |
| Export attendee CSV | No | Yes |
| View booking dashboard | Yes | No |
| View event management dashboard | No | Yes |

**How roles appear in the UI:**
- User's role is displayed as a badge ("Staff" or "Student") in the navigation bar
- User dropdown shows: full name, username, department, and role
- Dashboard content automatically adapts based on logged-in user's role

### 2. Backend (API Enforcement)

All role restrictions are enforced server-side via middleware:

```
authenticateToken → Verifies JWT, extracts user role
requireStaff     → Blocks non-staff from staff-only routes
```

**Protected Endpoints:**

| Endpoint | Method | Required Role | Description |
|----------|--------|---------------|-------------|
| `/api/events` | POST | Staff | Create event |
| `/api/events/:id` | PUT | Staff | Update event |
| `/api/events/:id` | DELETE | Staff | Delete event |
| `/api/events/:id/export` | GET | Staff | Export attendees |
| `/api/events/staff` | GET | Staff | Get staff's events |
| `/api/bookings` | POST | Student | Book event |
| `/api/bookings/user` | GET | Authenticated | Get user's bookings |
| `/api/bookings/:id` | DELETE | Authenticated | Cancel booking |
| `/api/bookings/:id/confirm` | POST | Authenticated | Confirm held booking |
| `/api/bookings/:id/reschedule` | POST | Student | Reschedule booking |

**Error Responses:**
- `401 Unauthorized` - No valid JWT token provided
- `403 Forbidden` - Valid token but insufficient role permissions

### 3. Database (Schema Definition)

The `users` table stores role information:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,      -- bcrypt hashed
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,          -- 'student' or 'staff'
  department VARCHAR NOT NULL
);
```

**Role Values:**
- `student` - Can browse events and manage their own bookings
- `staff` - Can create/manage events and view attendee data

### Testing Role Enforcement

**Test as Student (should succeed):**
```bash
# Login as student
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Book an event (student-only action)
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"YOUR_EVENT_ID"}'
```

**Test as Staff (should succeed):**
```bash
# Login as staff
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dr.smith","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Create an event (staff-only action)
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","type":"lecture","department":"Computer Science","date":"2025-01-15","startTime":"10:00","endTime":"11:00","location":"Room 101","capacity":30}'
```

**Test Role Restriction (should fail with 403):**
```bash
# Login as student
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Try to create event as student (should return 403)
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Unauthorized Event","type":"lecture","department":"Computer Science","date":"2025-01-15","startTime":"10:00","endTime":"11:00","location":"Room 101","capacity":30}'
# Expected: {"error":"Staff access required"}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- npm or similar package manager
- PostgreSQL database (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SMUCampusHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/smucampushub
   SESSION_SECRET=your-secret-key-here
   ```
   
   Generate a secure session secret:
   ```bash
   openssl rand -base64 32
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Navigate to `http://localhost:5000` in your browser

### Local Development Setup

When running on a local device (not on cloud platforms), the test script automatically handles configuration:

```bash
# Run all 109 automated tests
./run-tests.sh
```

The script will:
1. Detect the local environment
2. Temporarily swap to a local-compatible Vite configuration
3. Start the server and run all tests
4. Restore the original configuration when complete

**Manual local development** (if needed):
```bash
# Backup original config
cp vite.config.ts vite.config.ts.backup

# Use local config
cp vite.config.local.ts vite.config.ts

# Run the application
npm run dev

# When done, restore original
mv vite.config.ts.backup vite.config.ts
```

## 👥 Demo Accounts

The application comes pre-seeded with test accounts and sample events.

### Student Accounts
| Username | Password | Department |
|----------|----------|------------|
| `alice` | `password123` | Computer Science |
| `bob` | `password123` | Mathematics |
| `charlie` | `password123` | Computer Science |

### Staff Accounts
| Username | Password | Department |
|----------|----------|------------|
| `dr.smith` | `password123` | Computer Science |
| `prof.jones` | `password123` | Mathematics |

## 📁 Project Structure

```
SMUCampusHub/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Shadcn UI components
│   │   │   └── navigation.tsx      # Top navigation bar
│   │   ├── lib/
│   │   │   ├── auth.tsx           # Authentication context
│   │   │   └── queryClient.ts     # TanStack Query setup
│   │   ├── pages/
│   │   │   ├── login.tsx          # Login page
│   │   │   ├── home.tsx           # Event browsing with filters
│   │   │   ├── event-detail.tsx   # Event details and booking
│   │   │   ├── dashboard.tsx      # Student/Staff dashboards
│   │   │   └── event-form.tsx     # Create/Edit events (staff)
│   │   ├── App.tsx                # Main app with routing
│   │   └── index.css              # Global styles
│   └── index.html                  # HTML entry point
├── server/                          # Backend Express application
│   ├── routes.ts                   # API endpoints
│   ├── storage.ts                  # In-memory data storage
│   └── index.ts                    # Server entry point
├── shared/
│   └── schema.ts                   # Shared TypeScript types & schemas
└── README.md                        # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password, returns JWT token

### Events
- `GET /api/events` - List all events with stats (public)
- `GET /api/events/:id` - Get event details (public)
- `GET /api/events/staff` - Get staff member's events (staff only)
- `POST /api/events` - Create new event (staff only)
- `PUT /api/events/:id` - Update event (staff only)
- `DELETE /api/events/:id` - Delete event (staff only)
- `GET /api/events/:id/export` - Download attendees as CSV (staff only)

### Bookings
- `GET /api/bookings/user` - Get current user's bookings (authenticated)
- `POST /api/bookings` - Book an event (students only)
- `DELETE /api/bookings/:id` - Cancel booking (authenticated)

### System
- `GET /api/health` - Health check endpoint

## 🧪 Testing Guide

### Manual Testing Scenarios

#### 1. Student Booking Flow
1. Login as `alice` (Computer Science student)
2. Browse events on home page
3. Filter by "Computer Science" department
4. Click "View Details" on any CS event
5. Click "Book Event" button
6. Navigate to "My Dashboard" to see your booking
7. Try booking an event from a different department (should be blocked)

#### 2. Waitlist Functionality
1. Login as `alice` and book "Office Hours - Dr. Smith" (capacity: 5)
2. Login as `charlie` and book the same event
3. Have 3 more students book until it's full
4. Try booking as another student - should go to waitlist
5. Cancel a confirmed booking - waitlisted student should be promoted

#### 3. Staff Event Management
1. Login as `dr.smith` (Staff)
2. Click "Create Event" button
3. Fill in event details:
   - Title: "Advanced Algorithms"
   - Type: Lecture
   - Department: Computer Science
   - Set future date and time
   - Capacity: 30
4. Submit the form
5. See the new event in your dashboard
6. Click "Edit" to modify the event
7. Click "Export CSV" to download attendee list
8. Try deleting the event

#### 4. Search and Filtering
1. Open home page (logged in or out)
2. Use search bar to find specific events
3. Filter by event type (Lecture, Lab, Office Hours)
4. Filter by department
5. Combine filters to narrow results

### Automated Testing

The API can be tested with tools like Postman or Playwright:

#### Example: Login Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'
```

#### Example: Get Events
```bash
curl http://localhost:5000/api/events
```

#### Example: Book Event (with auth)
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"eventId":"event-uuid-here"}'
```

## 🎨 Design Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean interface with Tailwind CSS and Shadcn components
- **Inter Font**: Professional typography for body text
- **Poppins Font**: Friendly headings
- **Visual Hierarchy**: Clear information architecture
- **Loading States**: Beautiful skeleton screens
- **Empty States**: Helpful messaging when no data exists
- **Progress Indicators**: Visual capacity bars on events
- **Status Badges**: Color-coded event status (Available/Limited/Full/Waitlist)

## 🔐 Security Notes

**⚠️ Important**: This is a **mock application for testing purposes only**.

- JWT secret is hard-coded for development
- No email verification or password recovery
- In-memory storage (data resets on server restart)
- Not production-ready

**For production use**, implement:
- Environment variables for secrets
- Persistent database (PostgreSQL, MongoDB, etc.)
- Email notifications for bookings/waitlist
- Password strength requirements
- Rate limiting on API endpoints
- HTTPS/TLS encryption

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Wouter** - Routing
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **json2csv** - CSV export
- **In-Memory Storage** - Mock database

## 📊 Seed Data

The application includes:
- **3 Students**: Alice, Bob, Charlie
- **2 Staff Members**: Dr. Smith, Prof. Jones  
- **10 Sample Events**: Mix of lectures, labs, and office hours
- **Multiple Departments**: Computer Science, Mathematics, Physics, Engineering, Business

## 🐛 Known Limitations

- Data is stored in-memory and resets on server restart
- No email notifications
- No password reset functionality
- Limited to predefined departments
- Staff can only edit/delete their own events
- Students can only book events in their department
- No event history or audit logs

## 📝 Future Enhancements

Potential features for a production version:
- [ ] Persistent database integration
- [ ] Email notifications for bookings and waitlist updates
- [ ] Calendar integration (Google Calendar, iCal)
- [ ] Event reminders
- [ ] Recurring events support
- [ ] File attachments for events
- [ ] Student feedback/ratings
- [ ] Analytics dashboard for staff
- [ ] Mobile app
- [ ] Multi-language support

## 🤝 Support

For issues or questions about this testing platform:
1. Check the browser console for errors
2. Verify you're using the correct credentials
3. Ensure the server is running (`npm run dev`)
4. Try refreshing the page
5. Check network requests in browser DevTools

## 📄 License

This is a mock application for educational and testing purposes.

---

**Built with ❤️ for SMU Campus Events**
