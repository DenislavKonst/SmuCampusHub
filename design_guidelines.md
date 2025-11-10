# SMUCampusHub Design Guidelines

## Design Approach
**System-Based Approach**: Material Design for educational platforms with clear hierarchy and information density. This university booking system prioritizes usability, scanability, and efficient task completion.

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, legible, modern
- **Accent Font**: Poppins for headings - friendly yet professional
- **Hierarchy**:
  - H1: text-4xl font-bold (Hero headlines)
  - H2: text-3xl font-semibold (Page titles)
  - H3: text-xl font-semibold (Section headers)
  - Body: text-base (Event details, descriptions)
  - Small: text-sm (Metadata, timestamps, capacity counts)
  - Tiny: text-xs (Labels, badges, status indicators)

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Card spacing: p-6
- Gap between elements: gap-4, gap-6

**Container Strategy**:
- Max width: max-w-7xl for main content
- Event cards: max-w-sm to max-w-md
- Forms: max-w-lg

## Core Components

### Navigation
**Top Navigation Bar**:
- Fixed header with university branding (logo left)
- Navigation links: Home, My Bookings, Browse Events
- User profile dropdown (right): Role badge, Sign Out
- Height: h-16
- Sticky positioning for constant access

### Hero Section
**Home Page Hero**:
- Height: 60vh (not full viewport)
- Background: Campus image showing students/buildings
- Centered content with max-w-3xl
- Heading + search bar overlay
- Semi-transparent overlay for text readability
- Search bar with blurred background backdrop

### Event Cards
**Grid Layout**:
- Desktop: grid-cols-3 (3 columns)
- Tablet: grid-cols-2
- Mobile: grid-cols-1
- Gap: gap-6

**Card Structure**:
- Rounded corners: rounded-lg
- Elevation: shadow-md with hover:shadow-lg
- Padding: p-6
- Content hierarchy:
  - Event type badge (top-right)
  - Event title (text-xl font-semibold)
  - Date/time with calendar icon
  - Department tag
  - Capacity indicator with progress bar
  - CTA button (full width)

### Capacity Indicators
**Visual Design**:
- Progress bar showing filled/total slots
- Height: h-2
- Rounded: rounded-full
- Status badges: Available (green), Limited (yellow), Full (red), Waitlist (blue)
- Text: "X/Y spots filled" with icon

### Forms & Inputs
**Booking Forms**:
- Input fields: h-12 with rounded-md
- Labels: text-sm font-medium, mb-2
- Focus states with ring effects
- Full-width buttons: w-full h-12
- Spacing between fields: space-y-4

### Dashboard Layouts

**Student Dashboard**:
- Two-column layout (lg:grid-cols-2)
- Left: Upcoming bookings
- Right: Waitlisted events
- Each section with header + card list
- Empty states with icon and helpful text

**Staff Dashboard**:
- Action bar: Create Event button (prominent)
- Data table for event management
- Columns: Event Name, Date, Department, Capacity, Actions
- Row actions: Edit, Export CSV, Delete
- Table styling: striped rows, hover states

### Event Detail Page
**Layout Structure**:
- Breadcrumb navigation (top)
- Main content: 2-column (lg:grid-cols-3)
  - Left (col-span-2): Event details card with all info
  - Right (col-span-1): Booking action card (sticky)
- Event details include:
  - Event title (text-3xl)
  - Department badge
  - Date/time with icons
  - Location
  - Description
  - Instructor/Host info
  - Capacity visualization
  - Current attendees count

**Booking Action Card**:
- Sticky positioning (top-24)
- Prominent CTA button
- Capacity status
- Waitlist information
- Terms/conditions text (text-xs)

### Filters & Search
**Filter Panel**:
- Sidebar (left) on desktop, collapsible on mobile
- Filter groups with headers
- Checkboxes for categories
- Date range picker
- Department multi-select
- Apply/Clear buttons at bottom

### Icons
**Library**: Heroicons (via CDN)
- Calendar icon for dates
- Clock for time
- Users for capacity
- MapPin for location
- Plus for create actions
- Download for CSV export
- X for close/cancel
- Check for confirmed
- AlertCircle for warnings

## Component States

**Loading States**:
- Skeleton screens for cards (animated pulse)
- Spinner for actions (center of button)

**Empty States**:
- Icon + heading + description + CTA
- Centered in container
- Friendly, helpful messaging

**Error States**:
- Alert boxes with rounded-md
- Icon on left, message, optional action
- Padding: p-4

## Animations
**Minimal, purposeful animations only**:
- Card hover: transform scale-105, shadow elevation
- Button press: subtle scale-98
- Page transitions: fade-in on route change
- Loading spinners: rotate animation

## Images

**Hero Image**:
- Large, high-quality campus photograph
- Students collaborating, modern campus buildings, or lecture hall
- Semi-transparent dark overlay (opacity-60) for text contrast
- Position: background-center background-cover

**Empty State Illustrations**:
- Simple, friendly illustrations for "No bookings yet" and "No events found"
- Can use illustration libraries or placeholder graphics

**Staff/Instructor Avatars**:
- Circular: rounded-full
- Size: w-12 h-12 for cards, w-16 h-16 for detail pages
- Fallback: initials in colored circle

## Accessibility
- All interactive elements have focus states with ring-2
- Form inputs have associated labels
- Sufficient contrast ratios throughout
- Keyboard navigation support
- ARIA labels for icon-only buttons
- Screen reader friendly status messages

## Responsive Breakpoints
- Mobile-first approach
- sm: 640px (stacked layouts)
- md: 768px (2-column grids)
- lg: 1024px (3-column grids, sidebars visible)
- xl: 1280px (max content width)

This design creates a clean, professional university platform that prioritizes information clarity, efficient booking workflows, and role-appropriate functionality.