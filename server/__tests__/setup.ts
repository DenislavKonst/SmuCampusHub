/**
 * Test Setup File
 * Runs before all tests to initialize test environment
 */

import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Test environment initialized');
});

afterAll(() => {
  console.log('Test environment cleaned up');
});
