/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // Coverage thresholds - ensure statement coverage
  coverageThreshold: {
    global: {
      statements: 20,
      branches: 20,
      functions: 20,
      lines: 20
    }
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/unit/**/*.test.js',
    '**/__tests__/integration/**/*.test.js',
    '**/__tests__/security/**/*.test.js'
  ],

  // Test environment
  testEnvironment: 'node',

  // Test timeout (in milliseconds)
  testTimeout: 10000,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Module name mapper for workspace packages
  moduleNameMapper: {
    '^@microrealestate/common$': '<rootDir>/src/__mocks__/@microrealestate/common.js',
    '^@microrealestate/common/(.*)$': '<rootDir>/src/__mocks__/@microrealestate/common.js',
  },

  // Transform
  transform: {},

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__mocks__/**',
    '!src/__tests__/**',
    '!src/index.js',
    '!src/locales/**'
  ],

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Max workers for parallel test execution
  maxWorkers: '50%'
};
