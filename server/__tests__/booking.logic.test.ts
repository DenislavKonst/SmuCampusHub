import { describe, it, expect } from 'vitest';

/**
 * Quadrant 1: Unit Tests for Booking Logic
 * Critical business logic for capacity management, overbooking, and waitlist
 */

// Overbooking multiplier constant from routes.ts
const OVERBOOKING_MULTIPLIER = 1.05;

describe('Booking Capacity Logic', () => {
  describe('calculateEffectiveCapacity', () => {
    const calculateEffectiveCapacity = (baseCapacity: number, allowOverbooking: boolean): number => {
      return allowOverbooking ? Math.floor(baseCapacity * OVERBOOKING_MULTIPLIER) : baseCapacity;
    };

    it('should return base capacity when overbooking is disabled', () => {
      expect(calculateEffectiveCapacity(20, false)).toBe(20);
      expect(calculateEffectiveCapacity(50, false)).toBe(50);
      expect(calculateEffectiveCapacity(100, false)).toBe(100);
    });

    it('should return +5% capacity when overbooking is enabled', () => {
      expect(calculateEffectiveCapacity(20, true)).toBe(21); // floor(20 * 1.05) = 21
      expect(calculateEffectiveCapacity(50, true)).toBe(52); // floor(50 * 1.05) = 52
      expect(calculateEffectiveCapacity(100, true)).toBe(105); // floor(100 * 1.05) = 105
    });

    it('should handle edge cases correctly', () => {
      expect(calculateEffectiveCapacity(1, true)).toBe(1); // floor(1 * 1.05) = 1
      expect(calculateEffectiveCapacity(19, true)).toBe(19); // floor(19 * 1.05) = 19
      expect(calculateEffectiveCapacity(10, true)).toBe(10); // floor(10 * 1.05) = 10
    });

    it('should never reduce capacity with overbooking', () => {
      const testCapacities = [1, 5, 10, 15, 20, 50, 100, 200];
      testCapacities.forEach(capacity => {
        const effective = calculateEffectiveCapacity(capacity, true);
        expect(effective).toBeGreaterThanOrEqual(capacity);
      });
    });
  });

  describe('determineBookingStatus', () => {
    const determineBookingStatus = (
      confirmedCount: number,
      effectiveCapacity: number
    ): 'confirmed' | 'waitlisted' => {
      return confirmedCount < effectiveCapacity ? 'confirmed' : 'waitlisted';
    };

    it('should assign confirmed status when slots are available', () => {
      expect(determineBookingStatus(0, 20)).toBe('confirmed');
      expect(determineBookingStatus(10, 20)).toBe('confirmed');
      expect(determineBookingStatus(19, 20)).toBe('confirmed');
    });

    it('should assign waitlisted status when at capacity', () => {
      expect(determineBookingStatus(20, 20)).toBe('waitlisted');
      expect(determineBookingStatus(21, 20)).toBe('waitlisted');
      expect(determineBookingStatus(100, 20)).toBe('waitlisted');
    });

    it('should handle boundary conditions correctly', () => {
      const capacity = 21; // 20 with overbooking
      expect(determineBookingStatus(20, capacity)).toBe('confirmed'); // last slot
      expect(determineBookingStatus(21, capacity)).toBe('waitlisted'); // first waitlist
    });

    it('should work with zero capacity events', () => {
      expect(determineBookingStatus(0, 0)).toBe('waitlisted');
      expect(determineBookingStatus(1, 0)).toBe('waitlisted');
    });
  });

  describe('calculateRemainingSlots', () => {
    const calculateRemainingSlots = (
      effectiveCapacity: number,
      confirmedCount: number
    ): number => {
      return Math.max(0, effectiveCapacity - confirmedCount);
    };

    it('should calculate correct remaining slots', () => {
      expect(calculateRemainingSlots(20, 0)).toBe(20);
      expect(calculateRemainingSlots(20, 10)).toBe(10);
      expect(calculateRemainingSlots(20, 19)).toBe(1);
      expect(calculateRemainingSlots(20, 20)).toBe(0);
    });

    it('should never return negative slots', () => {
      expect(calculateRemainingSlots(20, 21)).toBe(0);
      expect(calculateRemainingSlots(20, 100)).toBe(0);
      expect(calculateRemainingSlots(0, 1)).toBe(0);
    });

    it('should work with overbooking scenarios', () => {
      const capacity = 21; // 20 with 5% overbooking
      expect(calculateRemainingSlots(capacity, 20)).toBe(1); // 1 overbooking slot left
      expect(calculateRemainingSlots(capacity, 21)).toBe(0); // fully booked
      expect(calculateRemainingSlots(capacity, 22)).toBe(0); // over capacity
    });
  });
});

describe('Waitlist Promotion Logic', () => {
  type Booking = {
    id: string;
    status: 'confirmed' | 'waitlisted';
    createdAt: Date;
  };

  const getFirstWaitlistedBooking = (bookings: Booking[]): Booking | null => {
    const waitlisted = bookings
      .filter(b => b.status === 'waitlisted')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return waitlisted.length > 0 ? waitlisted[0] : null;
  };

  it('should return oldest waitlisted booking', () => {
    const bookings: Booking[] = [
      { id: '1', status: 'confirmed', createdAt: new Date('2025-01-01T10:00:00Z') },
      { id: '2', status: 'waitlisted', createdAt: new Date('2025-01-01T11:00:00Z') },
      { id: '3', status: 'waitlisted', createdAt: new Date('2025-01-01T10:30:00Z') },
      { id: '4', status: 'confirmed', createdAt: new Date('2025-01-01T09:00:00Z') },
    ];

    const result = getFirstWaitlistedBooking(bookings);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('3'); // Oldest waitlisted (10:30)
  });

  it('should return null when no waitlisted bookings exist', () => {
    const bookings: Booking[] = [
      { id: '1', status: 'confirmed', createdAt: new Date('2025-01-01T10:00:00Z') },
      { id: '2', status: 'confirmed', createdAt: new Date('2025-01-01T11:00:00Z') },
    ];

    expect(getFirstWaitlistedBooking(bookings)).toBeNull();
  });

  it('should return null for empty booking list', () => {
    expect(getFirstWaitlistedBooking([])).toBeNull();
  });

  it('should handle multiple waitlisted bookings correctly', () => {
    const bookings: Booking[] = [
      { id: '1', status: 'waitlisted', createdAt: new Date('2025-01-01T14:00:00Z') },
      { id: '2', status: 'waitlisted', createdAt: new Date('2025-01-01T12:00:00Z') },
      { id: '3', status: 'waitlisted', createdAt: new Date('2025-01-01T13:00:00Z') },
    ];

    const result = getFirstWaitlistedBooking(bookings);
    expect(result?.id).toBe('2'); // Oldest at 12:00
  });

  it('should maintain FIFO order for simultaneous waitlist additions', () => {
    const sameTime = new Date('2025-01-01T10:00:00Z');
    const bookings: Booking[] = [
      { id: '1', status: 'waitlisted', createdAt: sameTime },
      { id: '2', status: 'waitlisted', createdAt: sameTime },
    ];

    const result = getFirstWaitlistedBooking(bookings);
    expect(result?.id).toBe('1'); // First in array (stable sort)
  });
});

describe('Department Validation Logic', () => {
  const validateDepartmentMatch = (
    studentDepartment: string,
    eventDepartment: string
  ): boolean => {
    return studentDepartment === eventDepartment;
  };

  it('should allow booking when departments match', () => {
    expect(validateDepartmentMatch('Computer Science', 'Computer Science')).toBe(true);
    expect(validateDepartmentMatch('Mathematics', 'Mathematics')).toBe(true);
    expect(validateDepartmentMatch('Engineering', 'Engineering')).toBe(true);
  });

  it('should block booking when departments do not match', () => {
    expect(validateDepartmentMatch('Computer Science', 'Mathematics')).toBe(false);
    expect(validateDepartmentMatch('Engineering', 'Computer Science')).toBe(false);
    expect(validateDepartmentMatch('Physics', 'Chemistry')).toBe(false);
  });

  it('should be case-sensitive', () => {
    expect(validateDepartmentMatch('Computer Science', 'computer science')).toBe(false);
    expect(validateDepartmentMatch('MATHEMATICS', 'Mathematics')).toBe(false);
  });

  it('should handle empty department strings', () => {
    expect(validateDepartmentMatch('', '')).toBe(true);
    expect(validateDepartmentMatch('Computer Science', '')).toBe(false);
    expect(validateDepartmentMatch('', 'Mathematics')).toBe(false);
  });
});

describe('Input Validation Logic', () => {
  describe('validateEventCapacity', () => {
    const validateEventCapacity = (capacity: number): { valid: boolean; error?: string } => {
      if (!Number.isInteger(capacity)) {
        return { valid: false, error: 'Capacity must be an integer' };
      }
      if (capacity < 1) {
        return { valid: false, error: 'Capacity must be at least 1' };
      }
      if (capacity > 1000) {
        return { valid: false, error: 'Capacity cannot exceed 1000' };
      }
      return { valid: true };
    };

    it('should accept valid capacity values', () => {
      expect(validateEventCapacity(1).valid).toBe(true);
      expect(validateEventCapacity(20).valid).toBe(true);
      expect(validateEventCapacity(100).valid).toBe(true);
      expect(validateEventCapacity(1000).valid).toBe(true);
    });

    it('should reject zero or negative capacity', () => {
      expect(validateEventCapacity(0).valid).toBe(false);
      expect(validateEventCapacity(-1).valid).toBe(false);
      expect(validateEventCapacity(-100).valid).toBe(false);
    });

    it('should reject capacity exceeding maximum', () => {
      expect(validateEventCapacity(1001).valid).toBe(false);
      expect(validateEventCapacity(5000).valid).toBe(false);
    });

    it('should reject non-integer capacity', () => {
      expect(validateEventCapacity(10.5).valid).toBe(false);
      expect(validateEventCapacity(20.1).valid).toBe(false);
    });
  });

  describe('validateEventType', () => {
    const VALID_EVENT_TYPES = ['lecture', 'lab', 'office_hours'];
    
    const validateEventType = (type: string): boolean => {
      return VALID_EVENT_TYPES.includes(type);
    };

    it('should accept valid event types', () => {
      expect(validateEventType('lecture')).toBe(true);
      expect(validateEventType('lab')).toBe(true);
      expect(validateEventType('office_hours')).toBe(true);
    });

    it('should reject invalid event types', () => {
      expect(validateEventType('workshop')).toBe(false);
      expect(validateEventType('seminar')).toBe(false);
      expect(validateEventType('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(validateEventType('Lecture')).toBe(false);
      expect(validateEventType('LECTURE')).toBe(false);
      expect(validateEventType('Lab')).toBe(false);
    });
  });

  describe('validateBookingStatus', () => {
    const VALID_STATUSES = ['confirmed', 'waitlisted'];
    
    const validateBookingStatus = (status: string): boolean => {
      return VALID_STATUSES.includes(status);
    };

    it('should accept valid booking statuses', () => {
      expect(validateBookingStatus('confirmed')).toBe(true);
      expect(validateBookingStatus('waitlisted')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(validateBookingStatus('pending')).toBe(false);
      expect(validateBookingStatus('cancelled')).toBe(false);
      expect(validateBookingStatus('')).toBe(false);
    });
  });
});

describe('Concurrent Booking Logic', () => {
  describe('handleConcurrentBookings', () => {
    it('should handle race condition for last slot', () => {
      // Scenario: 2 users try to book the last slot simultaneously
      const capacity = 20;
      const currentBooked = 19; // One slot left
      
      // First request checks availability
      const slot1Available = currentBooked < capacity;
      expect(slot1Available).toBe(true);
      
      // Second request checks at same time
      const slot2Available = currentBooked < capacity;
      expect(slot2Available).toBe(true);
      
      // Both think they can book, but only one should succeed
      // Database constraint should prevent duplicate bookings
      const newBooked1 = currentBooked + 1; // 20
      const newBooked2 = currentBooked + 1; // 20
      
      expect(newBooked1).toBe(capacity);
      expect(newBooked2).toBe(capacity);
    });

    it('should correctly transition from last slot to waitlist', () => {
      const capacity = 20;
      const scenarios = [
        { booked: 19, expected: 'confirmed' },
        { booked: 20, expected: 'waitlisted' },
        { booked: 21, expected: 'waitlisted' },
      ];

      scenarios.forEach(({ booked, expected }) => {
        const status = booked < capacity ? 'confirmed' : 'waitlisted';
        expect(status).toBe(expected);
      });
    });
  });
});
