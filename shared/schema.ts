import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role and department
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // "student" or "staff"
  department: text("department").notNull(), // e.g., "Computer Science", "Mathematics"
  fullName: text("full_name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "lecture", "lab", "office_hours"
  department: text("department").notNull(),
  date: text("date").notNull(), // ISO date string
  startTime: text("start_time").notNull(), // e.g., "14:00"
  endTime: text("end_time").notNull(), // e.g., "16:00"
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  instructor: text("instructor").notNull(),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const updateEventSchema = insertEventSchema.partial();

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type Event = typeof events.$inferSelect;

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull(), // "confirmed" or "waitlisted"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Extended types for API responses
export type BookingWithDetails = Booking & {
  event: Event;
  user: User;
};

export type EventWithStats = Event & {
  bookedCount: number;
  waitlistedCount: number;
  remainingSlots: number;
};

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export type AuthResponse = {
  token: string;
  user: Omit<User, 'password'>;
};

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  instructor: one(users, {
    fields: [events.instructorId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  event: one(events, {
    fields: [bookings.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));
