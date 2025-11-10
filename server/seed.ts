import { db } from "./db";
import { users, events, type InsertUser, type InsertEvent } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if database is already seeded
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("✅ Database already seeded. Skipping seed...");
    process.exit(0);
  }

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Seed users (3 students, 2 staff)
  const studentUsers: InsertUser[] = [
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

  const staffUsers: InsertUser[] = [
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

  console.log("Creating users...");
  const createdUsers = await db
    .insert(users)
    .values([...studentUsers, ...staffUsers])
    .returning();

  const drSmith = createdUsers.find(u => u.username === 'dr.smith');
  const profJones = createdUsers.find(u => u.username === 'prof.jones');

  if (!drSmith || !profJones) {
    throw new Error("Failed to create staff users");
  }

  // Seed 10 events
  const eventData: InsertEvent[] = [
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
      instructor: drSmith.fullName,
      instructorId: drSmith.id,
    },
    {
      title: 'Linear Algebra',
      description: 'Advanced topics in linear algebra including eigenvalues, eigenvectors, and matrix operations.',
      type: 'lecture',
      department: 'Mathematics',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '12:00',
      location: 'Room 201, Building C',
      capacity: 35,
      instructor: profJones.fullName,
      instructorId: profJones.id,
    },
    {
      title: 'Office Hours - Dr. Smith',
      description: 'Drop-in office hours for CS students. Discuss assignments, projects, or general questions.',
      type: 'office_hours',
      department: 'Computer Science',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '16:00',
      location: 'Office 405, Building A',
      capacity: 5,
      instructor: drSmith.fullName,
      instructorId: drSmith.id,
    },
    {
      title: 'Python Programming Lab',
      description: 'Hands-on lab session covering Python basics, data structures, and practical applications.',
      type: 'lab',
      department: 'Computer Science',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '13:00',
      endTime: '15:00',
      location: 'Lab 102, Building B',
      capacity: 25,
      instructor: drSmith.fullName,
      instructorId: drSmith.id,
    },
    {
      title: 'Calculus Workshop',
      description: 'Interactive workshop on differential and integral calculus with problem-solving sessions.',
      type: 'lab',
      department: 'Mathematics',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '15:00',
      endTime: '17:00',
      location: 'Room 203, Building C',
      capacity: 20,
      instructor: profJones.fullName,
      instructorId: profJones.id,
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
      instructor: drSmith.fullName,
      instructorId: drSmith.id,
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
      instructor: drSmith.fullName,
      instructorId: drSmith.id,
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
      instructor: profJones.fullName,
      instructorId: profJones.id,
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
      instructor: drSmith.fullName,
      instructorId: drSmith.id,
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
      instructor: profJones.fullName,
      instructorId: profJones.id,
    },
  ];

  console.log("Creating events...");
  await db.insert(events).values(eventData);

  console.log("✅ Database seeded successfully!");
  console.log(`Created ${createdUsers.length} users and ${eventData.length} events`);
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  process.exit(1);
});
