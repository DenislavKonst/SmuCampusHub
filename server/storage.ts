import {
  type User,
  type InsertUser,
  type Event,
  type InsertEvent,
  type UpdateEvent,
  type Booking,
  type InsertBooking,
  type BookingWithDetails,
  type EventWithStats,
  users,
  events,
  bookings,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Event methods
  getEvent(id: string): Promise<Event | undefined>;
  getEventWithStats(id: string): Promise<EventWithStats | undefined>;
  getAllEvents(): Promise<Event[]>;
  getAllEventsWithStats(): Promise<EventWithStats[]>;
  getEventsByInstructor(instructorId: string): Promise<Event[]>;
  getEventsWithStatsByInstructor(instructorId: string): Promise<EventWithStats[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Booking methods
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingsWithDetailsByUser(userId: string): Promise<BookingWithDetails[]>;
  getBookingsByEvent(eventId: string): Promise<Booking[]>;
  getBookingsWithDetailsByEvent(eventId: string): Promise<BookingWithDetails[]>;
  getUserBookingForEvent(userId: string, eventId: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: string): Promise<boolean>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private events: Map<string, Event>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.bookings = new Map();
    this.seedData();
  }

  private async seedData() {
    // Seed users (3 students, 2 staff)
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const students = [
      {
        username: 'alice',
        password: hashedPassword,
        role: 'student',
        department: 'Computer Science',
        fullName: 'Alice Johnson',
      },
      {
        username: 'bob',
        password: hashedPassword,
        role: 'student',
        department: 'Mathematics',
        fullName: 'Bob Williams',
      },
      {
        username: 'charlie',
        password: hashedPassword,
        role: 'student',
        department: 'Computer Science',
        fullName: 'Charlie Davis',
      },
    ];

    const staff = [
      {
        username: 'dr.smith',
        password: hashedPassword,
        role: 'staff',
        department: 'Computer Science',
        fullName: 'Dr. Sarah Smith',
      },
      {
        username: 'prof.jones',
        password: hashedPassword,
        role: 'staff',
        department: 'Mathematics',
        fullName: 'Prof. Michael Jones',
      },
    ];

    for (const user of [...students, ...staff]) {
      await this.createUser(user as InsertUser);
    }

    // Get staff IDs for events
    const drSmith = Array.from(this.users.values()).find(u => u.username === 'dr.smith');
    const profJones = Array.from(this.users.values()).find(u => u.username === 'prof.jones');

    // Seed 10 events
    const events: InsertEvent[] = [
      {
        title: 'Introduction to Algorithms',
        description: 'Learn fundamental algorithmic concepts including sorting, searching, and complexity analysis.',
        type: 'lecture',
        department: 'Computer Science',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        location: 'Room 301, Building A',
        capacity: 40,
        instructor: drSmith?.fullName || 'Dr. Sarah Smith',
        instructorId: drSmith?.id || '',
      },
      {
        title: 'Data Structures Lab',
        description: 'Hands-on practice with trees, graphs, and hash tables. Bring your laptop.',
        type: 'lab',
        department: 'Computer Science',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '16:00',
        location: 'Lab 102, Building B',
        capacity: 25,
        instructor: drSmith?.fullName || 'Dr. Sarah Smith',
        instructorId: drSmith?.id || '',
      },
      {
        title: 'Office Hours - Dr. Smith',
        description: 'Drop-in office hours for CS students. Discuss assignments, projects, or general questions.',
        type: 'office_hours',
        department: 'Computer Science',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '15:00',
        endTime: '17:00',
        location: 'Office 405, Building A',
        capacity: 5,
        instructor: drSmith?.fullName || 'Dr. Sarah Smith',
        instructorId: drSmith?.id || '',
      },
      {
        title: 'Linear Algebra',
        description: 'Advanced topics in linear algebra including eigenvalues, eigenvectors, and matrix decomposition.',
        type: 'lecture',
        department: 'Mathematics',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        location: 'Room 201, Building C',
        capacity: 35,
        instructor: profJones?.fullName || 'Prof. Michael Jones',
        instructorId: profJones?.id || '',
      },
      {
        title: 'Calculus Problem Session',
        description: 'Work through challenging calculus problems with guidance. All levels welcome.',
        type: 'lab',
        department: 'Mathematics',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '15:00',
        location: 'Room 105, Building C',
        capacity: 20,
        instructor: profJones?.fullName || 'Prof. Michael Jones',
        instructorId: profJones?.id || '',
      },
      {
        title: 'Database Systems',
        description: 'Introduction to relational databases, SQL, normalization, and transaction management.',
        type: 'lecture',
        department: 'Computer Science',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        location: 'Room 302, Building A',
        capacity: 30,
        instructor: drSmith?.fullName || 'Dr. Sarah Smith',
        instructorId: drSmith?.id || '',
      },
      {
        title: 'Machine Learning Seminar',
        description: 'Guest lecture on the latest developments in deep learning and neural networks.',
        type: 'lecture',
        department: 'Computer Science',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '16:00',
        endTime: '18:00',
        location: 'Auditorium, Building D',
        capacity: 50,
        instructor: drSmith?.fullName || 'Dr. Sarah Smith',
        instructorId: drSmith?.id || '',
      },
      {
        title: 'Statistics Workshop',
        description: 'Practical statistics for data analysis. Learn hypothesis testing and confidence intervals.',
        type: 'lab',
        department: 'Mathematics',
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '16:00',
        location: 'Lab 201, Building C',
        capacity: 15,
        instructor: profJones?.fullName || 'Prof. Michael Jones',
        instructorId: profJones?.id || '',
      },
      {
        title: 'Web Development Bootcamp',
        description: 'Intensive workshop covering HTML, CSS, JavaScript, and modern frameworks.',
        type: 'lab',
        department: 'Computer Science',
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '14:00',
        location: 'Lab 103, Building B',
        capacity: 20,
        instructor: drSmith?.fullName || 'Dr. Sarah Smith',
        instructorId: drSmith?.id || '',
      },
      {
        title: 'Advanced Topology',
        description: 'Explore complex topological spaces, continuity, and compactness.',
        type: 'lecture',
        department: 'Mathematics',
        date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '11:00',
        endTime: '13:00',
        location: 'Room 202, Building C',
        capacity: 25,
        instructor: profJones?.fullName || 'Prof. Michael Jones',
        instructorId: profJones?.id || '',
      },
    ];

    for (const event of events) {
      await this.createEvent(event);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Event methods
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventWithStats(id: string): Promise<EventWithStats | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const eventBookings = Array.from(this.bookings.values()).filter(
      (b) => b.eventId === id,
    );
    const bookedCount = eventBookings.filter((b) => b.status === 'confirmed').length;
    const waitlistedCount = eventBookings.filter((b) => b.status === 'waitlisted').length;

    return {
      ...event,
      bookedCount,
      waitlistedCount,
      remainingSlots: event.capacity - bookedCount,
    };
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getAllEventsWithStats(): Promise<EventWithStats[]> {
    const events = Array.from(this.events.values());
    return Promise.all(
      events.map(async (event) => {
        const stats = await this.getEventWithStats(event.id);
        return stats!;
      }),
    );
  }

  async getEventsByInstructor(instructorId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (e) => e.instructorId === instructorId,
    );
  }

  async getEventsWithStatsByInstructor(instructorId: string): Promise<EventWithStats[]> {
    const events = await this.getEventsByInstructor(instructorId);
    return Promise.all(
      events.map(async (event) => {
        const stats = await this.getEventWithStats(event.id);
        return stats!;
      }),
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updateEvent: UpdateEvent): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updated: Event = {
      ...event,
      ...updateEvent,
    };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    // Also delete all bookings for this event
    const eventBookings = Array.from(this.bookings.entries()).filter(
      ([, b]) => b.eventId === id,
    );
    for (const [bookingId] of eventBookings) {
      this.bookings.delete(bookingId);
    }

    return this.events.delete(id);
  }

  // Booking methods
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter((b) => b.userId === userId);
  }

  async getBookingsWithDetailsByUser(userId: string): Promise<BookingWithDetails[]> {
    const bookings = await this.getBookingsByUser(userId);
    return Promise.all(
      bookings.map(async (booking) => {
        const event = await this.getEvent(booking.eventId);
        const user = await this.getUser(booking.userId);
        return {
          ...booking,
          event: event!,
          user: user!,
        };
      }),
    );
  }

  async getBookingsByEvent(eventId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter((b) => b.eventId === eventId);
  }

  async getBookingsWithDetailsByEvent(eventId: string): Promise<BookingWithDetails[]> {
    const bookings = await this.getBookingsByEvent(eventId);
    return Promise.all(
      bookings.map(async (booking) => {
        const event = await this.getEvent(booking.eventId);
        const user = await this.getUser(booking.userId);
        return {
          ...booking,
          event: event!,
          user: user!,
        };
      }),
    );
  }

  async getUserBookingForEvent(
    userId: string,
    eventId: string,
  ): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find(
      (b) => b.userId === userId && b.eventId === eventId,
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updated: Booking = {
      ...booking,
      status,
    };
    this.bookings.set(id, updated);
    return updated;
  }
}

// Database storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Event methods
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventWithStats(id: string): Promise<EventWithStats | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;

    const eventBookings = await db.select().from(bookings).where(eq(bookings.eventId, id));
    const bookedCount = eventBookings.filter((b) => b.status === 'confirmed').length;
    const waitlistedCount = eventBookings.filter((b) => b.status === 'waitlisted').length;

    return {
      ...event,
      bookedCount,
      waitlistedCount,
      remainingSlots: event.capacity - bookedCount,
    };
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getAllEventsWithStats(): Promise<EventWithStats[]> {
    const allEvents = await this.getAllEvents();
    return Promise.all(
      allEvents.map(async (event) => {
        const stats = await this.getEventWithStats(event.id);
        return stats!;
      }),
    );
  }

  async getEventsByInstructor(instructorId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.instructorId, instructorId));
  }

  async getEventsWithStatsByInstructor(instructorId: string): Promise<EventWithStats[]> {
    const instructorEvents = await this.getEventsByInstructor(instructorId);
    return Promise.all(
      instructorEvents.map(async (event) => {
        const stats = await this.getEventWithStats(event.id);
        return stats!;
      }),
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, updateEvent: UpdateEvent): Promise<Event | undefined> {
    const [updated] = await db
      .update(events)
      .set(updateEvent)
      .where(eq(events.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    // Delete all bookings for this event first
    await db.delete(bookings).where(eq(bookings.eventId, id));
    
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Booking methods
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBookingsWithDetailsByUser(userId: string): Promise<BookingWithDetails[]> {
    const userBookings = await this.getBookingsByUser(userId);
    return Promise.all(
      userBookings.map(async (booking) => {
        const event = await this.getEvent(booking.eventId);
        const user = await this.getUser(booking.userId);
        return {
          ...booking,
          event: event!,
          user: user!,
        };
      }),
    );
  }

  async getBookingsByEvent(eventId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.eventId, eventId));
  }

  async getBookingsWithDetailsByEvent(eventId: string): Promise<BookingWithDetails[]> {
    const eventBookings = await this.getBookingsByEvent(eventId);
    return Promise.all(
      eventBookings.map(async (booking) => {
        const event = await this.getEvent(booking.eventId);
        const user = await this.getUser(booking.userId);
        return {
          ...booking,
          event: event!,
          user: user!,
        };
      }),
    );
  }

  async getUserBookingForEvent(userId: string, eventId: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.userId, userId), eq(bookings.eventId, eventId)));
    return booking || undefined;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
