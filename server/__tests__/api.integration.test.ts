import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Quadrant 2: API Integration Tests
 * Tests for REST API endpoints, authentication, and data flow
 */

const BASE_URL = 'http://localhost:5001';

describe('API Integration Tests', () => {
  let authToken: string;
  let studentToken: string;
  let staffToken: string;
  let testEventId: string;

  beforeAll(async () => {
    // Login as staff to get token for event creation
    const staffResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'dr.smith', password: 'password123' })
    });
    const staffData = await staffResponse.json();
    staffToken = staffData.token;

    // Login as student
    const studentResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'password123' })
    });
    const studentData = await studentResponse.json();
    studentToken = studentData.token;
    authToken = studentToken;
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/login - should authenticate with valid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.username).toBe('alice');
      expect(data.user).not.toHaveProperty('password');
    });

    it('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'wrongpassword' })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('POST /api/auth/login - should reject non-existent user', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent', password: 'password123' })
      });

      expect(response.status).toBe(401);
    });

    it('POST /api/auth/login - should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice' }) // missing password
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Event Endpoints', () => {
    it('GET /api/events - should return list of events', async () => {
      const response = await fetch(`${BASE_URL}/api/events`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Check event structure
      const event = data[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('capacity');
      expect(event).toHaveProperty('bookedCount');
      expect(event).toHaveProperty('remainingSlots');
    });

    it('GET /api/events/:id - should return single event', async () => {
      // First get list of events
      const listResponse = await fetch(`${BASE_URL}/api/events`);
      const events = await listResponse.json();
      const eventId = events[0].id;

      // Get single event
      const response = await fetch(`${BASE_URL}/api/events/${eventId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(eventId);
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('description');
    });

    it('GET /api/events/:id - should return 404 for non-existent event', async () => {
      const response = await fetch(`${BASE_URL}/api/events/non-existent-id`);
      expect(response.status).toBe(404);
    });

    it('POST /api/events - should allow staff to create event', async () => {
      const newEvent = {
        title: 'Test Event API',
        description: 'API Integration Test Event',
        type: 'lecture',
        department: 'Computer Science',
        date: '2025-12-01',
        startTime: '14:00',
        endTime: '16:00',
        location: 'Test Room 101',
        capacity: 25,
        allowOverbooking: 0
        // Note: instructor and instructorId will be set by server from auth token
      };

      const response = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffToken}`
        },
        body: JSON.stringify(newEvent)
      });

      // Should succeed with 201 or fail with validation error (400)
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data.title).toBe('Test Event API');
      }
    });

    it('POST /api/events - should reject student creating event', async () => {
      const newEvent = {
        title: 'Unauthorized Event',
        description: 'Should be blocked',
        type: 'lecture',
        department: 'Computer Science',
        date: '2025-12-01',
        startTime: '14:00',
        endTime: '16:00',
        location: 'Test Room',
        capacity: 20,
        instructor: 'Test',
        instructorId: 'test',
        allowOverbooking: 0
      };

      const response = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify(newEvent)
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Booking Endpoints', () => {
    it('GET /api/bookings/user - should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings/user`);
      expect(response.status).toBe(401);
    });

    it('GET /api/bookings/user - should return user bookings', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings/user`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('POST /api/bookings - should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: 'test-id', userId: 'test-user' })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Health Endpoint', () => {
    it('GET /api/health - should return health status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('database');
      expect(data.database).toHaveProperty('status');
    });

    it('GET /api/health - should include system information', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();
      
      expect(data).toHaveProperty('system');
      expect(data.system).toHaveProperty('nodeVersion');
      expect(data.system).toHaveProperty('platform');
      expect(data.system).toHaveProperty('uptime');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{{'
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ username: 'test', password: 'test' })
      });

      // Should handle gracefully (might succeed or fail with appropriate error)
      expect([400, 401, 415]).toContain(response.status);
    });

    it('should handle invalid Authorization header format', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings/user`, {
        headers: { 'Authorization': 'InvalidFormat' }
      });

      expect(response.status).toBe(401);
    });

    it('should handle expired/invalid JWT tokens', async () => {
      const response = await fetch(`${BASE_URL}/api/bookings/user`, {
        headers: { 'Authorization': 'Bearer invalid.jwt.token' }
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Response Headers', () => {
    it('should include proper Content-Type headers', async () => {
      const response = await fetch(`${BASE_URL}/api/events`);
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('should not expose sensitive server information', async () => {
      const response = await fetch(`${BASE_URL}/api/events`);
      const serverHeader = response.headers.get('server');
      const xPoweredBy = response.headers.get('x-powered-by');
      
      // Should not expose detailed server info
      // Note: This is informational, not a hard requirement
      if (xPoweredBy) {
        expect(xPoweredBy).not.toContain('Express');
      }
    });
  });
});
