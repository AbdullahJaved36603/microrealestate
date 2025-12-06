// Jest setup file for common test configurations
// Note: jest.setTimeout is not available in ES modules mode
// Use testTimeout in jest.config.js instead

// Mock console methods to reduce noise in test output
global.console = {
  ...console
  // Uncomment to suppress console output during tests
  // log: () => {},
  // debug: () => {},
  // info: () => {},
  // warn: () => {},
  // error: () => {},
};

// Global test utilities
global.testUtils = {
  // Helper to create mock request object
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: {
      type: 'user',
      email: 'test@example.com',
      role: 'administrator'
    },
    realm: {
      _id: 'realm123',
      name: 'Test Organization'
    },
    realms: [
      {
        _id: 'realm123',
        name: 'Test Organization'
      }
    ],
    ...overrides
  }),

  // Helper to create mock response object
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create mock next function
  createMockNext: () => jest.fn()
};

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-secret-key-for-testing';
process.env.DEMO_MODE = 'false';

// Clean up after each test
// Note: In ES modules mode, we can't use jest.clearAllMocks() in setup
// Each test file should handle its own mock cleanup if needed
