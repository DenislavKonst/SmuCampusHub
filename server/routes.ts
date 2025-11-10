import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Parser } from 'json2csv';
import { storage } from "./storage";
import { loginSchema, insertEventSchema, updateEventSchema } from "@shared/schema";

// JWT secret - in production this should be in environment variable
const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

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
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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

      // Set instructor info from authenticated user
      eventData.instructorId = req.user!.id;
      eventData.instructor = req.user!.fullName;

      const event = await storage.createEvent(eventData);
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
      const updated = await storage.updateEvent(req.params.id, eventData);

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

  // Create booking (students only)
  app.post("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { eventId } = req.body;

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

      // Get current bookings
      const eventBookings = await storage.getBookingsByEvent(eventId);
      const confirmedCount = eventBookings.filter(
        (b) => b.status === "confirmed"
      ).length;

      // Determine status: confirmed or waitlisted
      const status = confirmedCount < event.capacity ? "confirmed" : "waitlisted";

      const booking = await storage.createBooking({
        eventId,
        userId: req.user!.id,
        status,
      });

      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create booking" });
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

      const wasConfirmed = booking.status === "confirmed";
      await storage.deleteBooking(req.params.id);

      // If cancelled booking was confirmed, promote first waitlisted student
      if (wasConfirmed) {
        const eventBookings = await storage.getBookingsByEvent(booking.eventId);
        const waitlisted = eventBookings
          .filter((b) => b.status === "waitlisted")
          .sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );

        if (waitlisted.length > 0) {
          await storage.updateBookingStatus(waitlisted[0].id, "confirmed");
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to cancel booking" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
