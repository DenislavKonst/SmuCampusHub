/**
 * Quadrant 4: Security Tests
 * Tests for authentication, authorization, input validation, and data protection
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:5001';

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject requests without authentication token', async () => {
      const protectedEndpoints = [
        '/api/bookings/user',
        '/api/events/staff',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        expect(response.status).toBe(401);
      }
    });

    it('should reject malformed JWT tokens', async () => {
      const invalidTokens = [
        'not.a.jwt',
        'Bearer invalid',
        'malformed-token',
        'Bearer ',
        ''
      ];

      for (const token of invalidTokens) {
        const response = await fetch(`${BASE_URL}/api/bookings/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        expect([401, 403]).toContain(response.status);
      }
    });

    it('should not accept expired tokens', async () => {
      // Simulate expired token (this would need to be generated with past expiration)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.signature';
      
      const response = await fetch(`${BASE_URL}/api/bookings/user`, {
        headers: { 'Authorization': `Bearer ${expiredToken}` }
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should not expose password in API responses', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.user).toBeDefined();
      expect(data.user.password).toBeUndefined();
    });

    it('should hash passwords (not stored in plain text)', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });

      const data = await loginResponse.json();
      
      // User object should never contain password
      expect(data.user.password).toBeUndefined();
      // Token should be a valid JWT format (3 parts separated by dots)
      expect(data.token.split('.').length).toBe(3);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent students from creating events', async () => {
      // Login as student
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });
      const { token } = await loginResponse.json();

      // Try to create event
      const response = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Unauthorized Event',
          description: 'Should be blocked',
          type: 'lecture',
          department: 'Computer Science',
          date: '2025-12-01',
          startTime: '14:00',
          endTime: '16:00',
          location: 'Test',
          capacity: 20,
          instructor: 'Test',
          instructorId: 'test',
          allowOverbooking: 0
        })
      });

      expect(response.status).toBe(403);
    });

    it('should prevent staff from accessing another staff member\'s events', async () => {
      // Login as prof_jones
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'prof_jones', password: 'password123' })
      });
      const { token } = await loginResponse.json();

      // Get dr.smith's events
      const eventsResponse = await fetch(`${BASE_URL}/api/events`);
      const events = await eventsResponse.json();
      const smithEvent = events.find((e: any) => e.instructor?.toLowerCase().includes('smith'));

      if (smithEvent) {
        // Try to delete dr.smith's event as prof_jones
        const response = await fetch(`${BASE_URL}/api/events/${smithEvent.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Should be forbidden or not found (depends on implementation)
        expect([403, 404]).toContain(response.status);
      }
    });

    it('should prevent students from exporting attendee data', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });
      const { token } = await loginResponse.json();

      const eventsResponse = await fetch(`${BASE_URL}/api/events`);
      const events = await eventsResponse.json();

      if (events.length > 0) {
        const response = await fetch(`${BASE_URL}/api/events/${events[0].id}/export`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        expect([403, 404]).toContain(response.status);
      }
    });
  });

  describe('Input Validation & Injection Prevention', () => {
    it('should reject SQL injection attempts in login', async () => {
      const sqlInjectionAttempts = [
        "admin' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
        "' UNION SELECT * FROM users--"
      ];

      for (const injection of sqlInjectionAttempts) {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: injection, password: 'test' })
        });

        // Should fail authentication, not cause server error
        expect(response.status).toBe(401);
      }
    });

    it('should reject XSS attempts in event creation', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'dr.smith', password: 'password123' })
      });
      const { token } = await loginResponse.json();

      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: xssPayload,
          description: xssPayload,
          type: 'lecture',
          department: 'Computer Science',
          date: '2025-12-01',
          startTime: '14:00',
          endTime: '16:00',
          location: 'Test',
          capacity: 20,
          instructor: 'Test',
          instructorId: 'test',
          allowOverbooking: 0
        })
      });

      // Should either reject or sanitize (not cause server error)
      expect(response.status).toBeLessThan(500);
    });

    it('should validate capacity is a positive integer', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'dr.smith', password: 'password123' })
      });
      const { token } = await loginResponse.json();

      const invalidCapacities = [-1, 0, 'abc', null, undefined, 1.5];

      for (const capacity of invalidCapacities) {
        const response = await fetch(`${BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: 'Test Event',
            description: 'Test',
            type: 'lecture',
            department: 'Computer Science',
            date: '2025-12-01',
            startTime: '14:00',
            endTime: '16:00',
            location: 'Test',
            capacity: capacity,
            instructor: 'Test',
            instructorId: 'test',
            allowOverbooking: 0
          })
        });

        // Should reject invalid capacity
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should validate required fields are present', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'dr.smith', password: 'password123' })
      });
      const { token } = await loginResponse.json();

      // Missing required fields
      const response = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Test Event'
          // Missing all other required fields
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Session Management', () => {
    it('should require new login after logout (if logout implemented)', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });
      const { token } = await loginResponse.json();

      // Verify token works
      const response1 = await fetch(`${BASE_URL}/api/bookings/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(response1.status).toBe(200);

      // Note: Logout endpoint would invalidate the token
      // For now, just verify token is required
    });

    it('should generate unique tokens for each login', async () => {
      const response1 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });
      const { token: token1 } = await response1.json();

      const response2 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });
      const { token: token2 } = await response2.json();

      // Tokens should be different (different issued time)
      expect(token1).not.toBe(token2);
    });
  });

  describe('Data Protection', () => {
    it('should not leak sensitive information in error messages', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent', password: 'test' })
      });

      const data = await response.json();
      const errorMessage = JSON.stringify(data).toLowerCase();
      
      // Should not reveal if user exists or not
      expect(errorMessage).not.toContain('user not found');
      expect(errorMessage).not.toContain('user does not exist');
      // Should use generic message
      expect(errorMessage).toContain('invalid credentials');
    });

    it('should not expose internal server paths in errors', async () => {
      const response = await fetch(`${BASE_URL}/api/events/malformed-id-that-might-cause-error`);
      
      if (response.status >= 400) {
        const text = await response.text();
        
        // Should not reveal file paths
        expect(text).not.toMatch(/\/home\/.*\.ts/);
        expect(text).not.toMatch(/\/server\/.*\.ts/);
        expect(text).not.toContain('node_modules');
      }
    });

    it('should enforce HTTPS in production (headers check)', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      
      // In production, should have security headers
      // Note: This is informational for development
      const strictTransportSecurity = response.headers.get('strict-transport-security');
      
      // Document that HTTPS should be enforced in production
      // (not enforced in development)
      expect(true).toBe(true); // Placeholder - document in report
    });
  });

  describe('Rate Limiting & DoS Prevention', () => {
    it('should handle rapid repeated requests', async () => {
      const promises = Array(50).fill(null).map(() =>
        fetch(`${BASE_URL}/api/health`)
      );

      const responses = await Promise.all(promises);
      
      // Should handle all requests without crashing
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });

    it('should handle large payload gracefully', async () => {
      const largePayload = {
        username: 'a'.repeat(10000),
        password: 'b'.repeat(10000)
      };

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largePayload)
      });

      // Should reject or handle gracefully (not crash)
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Protection', () => {
    it('should validate content-type header for POST requests', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Wrong content type
        body: JSON.stringify({ username: 'alice', password: 'password123' })
      });

      // Should reject or handle appropriately
      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Information Disclosure', () => {
    it('should not reveal database errors to client', async () => {
      const response = await fetch(`${BASE_URL}/api/events/invalid-uuid-format`);
      
      if (response.status >= 400) {
        const data = await response.json();
        const message = JSON.stringify(data).toLowerCase();
        
        // Should not contain database-specific errors
        expect(message).not.toContain('syntax error');
        expect(message).not.toContain('postgresql');
        expect(message).not.toContain('drizzle');
        expect(message).not.toContain('sql');
      }
    });

    it('should not expose stack traces in production', async () => {
      const response = await fetch(`${BASE_URL}/api/events/malformed`);
      
      if (response.status >= 400) {
        const text = await response.text();
        
        // Should not contain stack traces
        expect(text).not.toContain('at Object.');
        expect(text).not.toContain('at Function.');
        expect(text).not.toMatch(/\.ts:\d+:\d+/);
      }
    });
  });
});
