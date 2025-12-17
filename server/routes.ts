import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Parser } from 'json2csv';
import { storage } from "./storage";
import { loginSchema, insertEventSchema, updateEventSchema } from "@shared/schema";
import { loggingMiddleware } from "./middleware/logging";
import { db, checkDatabaseConnection } from "./db";

// JWT secret - in production this should be in environment variable
const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

// Overbooking multiplier - allows +5% additional capacity when enabled
const OVERBOOKING_MULTIPLIER = 1.05;

// Sanitize user input to prevent XSS attacks
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize all string fields in an object
function sanitizeEventData(data: any): any {
  const sanitized = { ...data };
  if (sanitized.title) sanitized.title = sanitizeInput(sanitized.title);
  if (sanitized.description) sanitized.description = sanitizeInput(sanitized.description);
  if (sanitized.location) sanitized.location = sanitizeInput(sanitized.location);
  return sanitized;
}

// Middleware to verify JWT token
interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    department: string;
    fullName: string;
  };
}

async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
      fullName: user.fullName,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Middleware to check if user is staff
function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "staff") {
    return res.status(403).json({ error: "Staff access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add logging middleware
  app.use(loggingMiddleware);

  // Health check endpoint with database status
  app.get("/api/health", async (req, res) => {
    try {
      const dbStatus = await checkDatabaseConnection();
      
      if (dbStatus.connected) {
        res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          database: {
            status: "connected",
            type: "postgresql"
          },
          system: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime()
          }
        });
      } else {
        res.status(503).json({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          database: {
            status: "disconnected",
            error: dbStatus.error || "Unknown error"
          }
        });
      }
    } catch (error: any) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          error: error.message
        }
      });
    }
  });

  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          jti: `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Unique JWT ID
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  // Get all events with stats
  app.get("/api/events", async (req, res) => {
    try {
      const { type, department } = req.query;
      let events = await storage.getAllEventsWithStats();

      // Filter by type if provided
      if (type && type !== "all") {
        events = events.filter((e) => e.type === type);
      }

      // Filter by department if provided
      if (department && department !== "all") {
        events = events.filter((e) => e.department === department);
      }

      // Sort by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch events" });
    }
  });

  // Get staff events (staff only) - Must come before /:id route
  app.get("/api/events/staff", authenticateToken, requireStaff, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getEventsWithStatsByInstructor(req.user!.id);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch events" });
    }
  });

  // Get single event with stats
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventWithStats(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch event" });
    }
  });

  // Create event (staff only)
  app.post("/api/events", authenticateToken, requireStaff, async (req: AuthRequest, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);

      // Sanitize user-provided fields to prevent XSS
      const sanitizedData = sanitizeEventData(eventData);

      // Set instructor info from authenticated user
      sanitizedData.instructorId = req.user!.id;
      sanitizedData.instructor = req.user!.fullName;

      const event = await storage.createEvent(sanitizedData);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create event" });
    }
  });

  // Update event (staff only)
  app.put("/api/events/:id", authenticateToken, requireStaff, async (req: AuthRequest, res) => {
    try {
      const event = await storage.getEvent(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Verify ownership
      if (event.instructorId !== req.user!.id) {
        return res.status(403).json({ error: "You can only edit your own events" });
      }

      const eventData = updateEventSchema.parse(req.body);
      
      // Sanitize user-provided fields to prevent XSS
      const sanitizedData = sanitizeEventData(eventData);
      const updated = await storage.updateEvent(req.params.id, sanitizedData);

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update event" });
    }
  });

  // Delete event (staff only)
  app.delete("/api/events/:id", authenticateToken, requireStaff, async (req: AuthRequest, res) => {
    try {
      const event = await storage.getEvent(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Verify ownership
      if (event.instructorId !== req.user!.id) {
        return res.status(403).json({ error: "You can only delete your own events" });
      }

      await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete event" });
    }
  });

  // Export event attendees as CSV (staff only)
  app.get("/api/events/:id/export", authenticateToken, requireStaff, async (req: AuthRequest, res) => {
    try {
      const event = await storage.getEvent(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Verify ownership
      if (event.instructorId !== req.user!.id) {
        return res.status(403).json({ error: "You can only export your own events" });
      }

      const bookings = await storage.getBookingsWithDetailsByEvent(req.params.id);

      const csvData = bookings.map((booking) => ({
        studentName: booking.user.fullName,
        username: booking.user.username,
        department: booking.user.department,
        status: booking.status,
        bookedAt: booking.createdAt.toISOString(),
      }));

      const parser = new Parser({
        fields: ['studentName', 'username', 'department', 'status', 'bookedAt'],
      });

      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="event-${req.params.id}-attendees.csv"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to export attendees" });
    }
  });

  // Get user's bookings
  app.get("/api/bookings/user", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookings = await storage.getBookingsWithDetailsByUser(req.user!.id);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch bookings" });
    }
  });

  // Create booking (students only) - supports hold flow
  app.post("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { eventId, useHold = false } = req.body;

      if (req.user!.role !== "student") {
        return res.status(403).json({ error: "Only students can book events" });
      }

      const event = await storage.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check department validation
      if (event.department !== req.user!.department) {
        return res.status(403).json({
          error: `This event is only available for ${event.department} students`,
        });
      }

      // Check if already booked
      const existingBooking = await storage.getUserBookingForEvent(
        req.user!.id,
        eventId
      );

      if (existingBooking) {
        return res.status(400).json({ error: "You have already booked this event" });
      }

      // Get current bookings (excluding expired holds)
      const eventBookings = await storage.getBookingsByEvent(eventId);
      const activeBookings = eventBookings.filter(b => {
        if (b.status === 'hold' && b.holdExpiresAt) {
          return new Date(b.holdExpiresAt) > new Date();
        }
        return b.status === 'confirmed' || b.status === 'waitlisted';
      });
      
      const confirmedAndHoldCount = activeBookings.filter(
        (b) => b.status === "confirmed" || b.status === "hold"
      ).length;

      // Calculate effective capacity (base capacity + 5% if overbooking is allowed)
      const effectiveCapacity = event.allowOverbooking 
        ? Math.ceil(event.capacity * OVERBOOKING_MULTIPLIER) 
        : event.capacity;

      // Determine status based on availability and useHold flag
      let status: string;
      let holdExpiresAt: Date | null = null;
      let waitlistPosition: number | null = null;

      if (confirmedAndHoldCount < effectiveCapacity) {
        if (useHold) {
          status = "hold";
          holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        } else {
          status = "confirmed";
        }
      } else {
        status = "waitlisted";
        const waitlistedCount = activeBookings.filter(b => b.status === 'waitlisted').length;
        waitlistPosition = waitlistedCount + 1;
      }

      const booking = await storage.createBooking({
        eventId,
        userId: req.user!.id,
        status,
        holdExpiresAt,
        waitlistPosition,
      });

      // Update waitlist positions for this event
      if (status === 'waitlisted') {
        await storage.updateWaitlistPositions(eventId);
      }

      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create booking" });
    }
  });

  // Confirm a hold booking
  app.post("/api/bookings/:id/confirm", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.userId !== req.user!.id) {
        return res.status(403).json({ error: "You can only confirm your own bookings" });
      }

      if (booking.status !== "hold") {
        return res.status(400).json({ error: "Only hold bookings can be confirmed" });
      }

      // Check if hold has expired
      if (booking.holdExpiresAt && new Date(booking.holdExpiresAt) < new Date()) {
        await storage.deleteBooking(booking.id);
        return res.status(400).json({ error: "Hold has expired. Please book again." });
      }

      const updated = await storage.updateBooking(booking.id, {
        status: "confirmed",
        holdExpiresAt: null,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to confirm booking" });
    }
  });

  // Reschedule booking to a different event
  app.post("/api/bookings/:id/reschedule", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { newEventId } = req.body;
      const booking = await storage.getBooking(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.userId !== req.user!.id) {
        return res.status(403).json({ error: "You can only reschedule your own bookings" });
      }

      if (booking.status !== "confirmed" && booking.status !== "waitlisted") {
        return res.status(400).json({ error: "Only confirmed or waitlisted bookings can be rescheduled" });
      }

      const newEvent = await storage.getEvent(newEventId);
      if (!newEvent) {
        return res.status(404).json({ error: "New event not found" });
      }

      // Check department validation
      if (newEvent.department !== req.user!.department) {
        return res.status(403).json({
          error: `This event is only available for ${newEvent.department} students`,
        });
      }

      // Check if already booked for new event
      const existingBooking = await storage.getUserBookingForEvent(req.user!.id, newEventId);
      if (existingBooking) {
        return res.status(400).json({ error: "You already have a booking for the new event" });
      }

      const oldEventId = booking.eventId;
      const wasConfirmed = booking.status === "confirmed";

      // Delete old booking
      await storage.deleteBooking(req.params.id);

      // If old booking was confirmed, promote first waitlisted
      if (wasConfirmed) {
        const event = await storage.getEvent(oldEventId);
        if (event) {
          const eventBookings = await storage.getBookingsByEvent(oldEventId);
          const confirmedCount = eventBookings.filter(b => b.status === "confirmed").length;
          const effectiveCapacity = event.allowOverbooking 
            ? Math.ceil(event.capacity * OVERBOOKING_MULTIPLIER) 
            : event.capacity;

          if (confirmedCount < effectiveCapacity) {
            const waitlisted = eventBookings
              .filter(b => b.status === "waitlisted")
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            if (waitlisted.length > 0) {
              await storage.updateBookingStatus(waitlisted[0].id, "confirmed");
              await storage.updateWaitlistPositions(oldEventId);
            }
          }
        }
      } else {
        // Update waitlist positions for old event
        await storage.updateWaitlistPositions(oldEventId);
      }

      // Create new booking
      const newEventBookings = await storage.getBookingsByEvent(newEventId);
      const newConfirmedCount = newEventBookings.filter(b => 
        b.status === "confirmed" || b.status === "hold"
      ).length;
      const newEffectiveCapacity = newEvent.allowOverbooking 
        ? Math.ceil(newEvent.capacity * OVERBOOKING_MULTIPLIER) 
        : newEvent.capacity;

      const newStatus = newConfirmedCount < newEffectiveCapacity ? "confirmed" : "waitlisted";
      const waitlistPosition = newStatus === "waitlisted" 
        ? newEventBookings.filter(b => b.status === 'waitlisted').length + 1 
        : null;

      const newBooking = await storage.createBooking({
        eventId: newEventId,
        userId: req.user!.id,
        status: newStatus,
        waitlistPosition,
      });

      if (newStatus === 'waitlisted') {
        await storage.updateWaitlistPositions(newEventId);
      }

      res.json({ 
        success: true, 
        booking: newBooking,
        message: newStatus === "confirmed" 
          ? "Successfully rescheduled and confirmed" 
          : "Rescheduled to waitlist"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reschedule booking" });
    }
  });

  // Get waitlist position for a booking
  app.get("/api/bookings/:id/waitlist-position", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.userId !== req.user!.id) {
        return res.status(403).json({ error: "You can only view your own bookings" });
      }

      if (booking.status !== "waitlisted") {
        return res.status(400).json({ error: "This booking is not on the waitlist" });
      }

      const position = await storage.getWaitlistPosition(booking.eventId, booking.id);
      res.json({ position, bookingId: booking.id, eventId: booking.eventId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get waitlist position" });
    }
  });

  // Cancel booking (with automatic waitlist promotion)
  app.delete("/api/bookings/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Verify ownership
      if (booking.userId !== req.user!.id) {
        return res.status(403).json({ error: "You can only cancel your own bookings" });
      }

      const wasConfirmed = booking.status === "confirmed" || booking.status === "hold";
      const wasWaitlisted = booking.status === "waitlisted";
      const eventId = booking.eventId;
      
      await storage.deleteBooking(req.params.id);

      // If cancelled booking was confirmed/hold, promote first waitlisted student
      if (wasConfirmed) {
        const event = await storage.getEvent(eventId);
        if (event) {
          const eventBookings = await storage.getBookingsByEvent(eventId);
          const confirmedCount = eventBookings.filter(
            (b) => b.status === "confirmed"
          ).length;
          
          // Calculate effective capacity (same logic as booking creation)
          const effectiveCapacity = event.allowOverbooking 
            ? Math.ceil(event.capacity * OVERBOOKING_MULTIPLIER) 
            : event.capacity;

          // Only promote if we're under the effective capacity
          if (confirmedCount < effectiveCapacity) {
            const waitlisted = eventBookings
              .filter((b) => b.status === "waitlisted")
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            if (waitlisted.length > 0) {
              await storage.updateBookingStatus(waitlisted[0].id, "confirmed");
              // Update waitlist positions after promotion
              await storage.updateWaitlistPositions(eventId);
            }
          }
        }
      }

      // Update waitlist positions if the cancelled booking was waitlisted
      if (wasWaitlisted) {
        await storage.updateWaitlistPositions(eventId);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to cancel booking" });
    }
  });

  // Cleanup expired holds (called periodically or on-demand)
  app.post("/api/bookings/cleanup-expired", async (req, res) => {
    try {
      const expiredHolds = await storage.getExpiredHolds();
      const eventIds = new Set<string>();
      
      for (const hold of expiredHolds) {
        eventIds.add(hold.eventId);
        await storage.deleteBooking(hold.id);
      }

      // Promote waitlisted for each affected event
      for (const eventId of Array.from(eventIds)) {
        const event = await storage.getEvent(eventId);
        if (event) {
          const eventBookings = await storage.getBookingsByEvent(eventId);
          const confirmedCount = eventBookings.filter(b => b.status === "confirmed").length;
          const effectiveCapacity = event.allowOverbooking 
            ? Math.ceil(event.capacity * OVERBOOKING_MULTIPLIER) 
            : event.capacity;

          if (confirmedCount < effectiveCapacity) {
            const waitlisted = eventBookings
              .filter(b => b.status === "waitlisted")
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            const slotsAvailable = effectiveCapacity - confirmedCount;
            for (let i = 0; i < Math.min(slotsAvailable, waitlisted.length); i++) {
              await storage.updateBookingStatus(waitlisted[i].id, "confirmed");
            }
            await storage.updateWaitlistPositions(eventId);
          }
        }
      }

      res.json({ success: true, expiredCount: expiredHolds.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to cleanup expired holds" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
