/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    './src/**/*.js',
    '!./src/__mocks__/**',
    '!./src/__tests__/**',
    '!./src/index.js',
    '!./src/locales/**'
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // Coverage thresholds - ensure statement coverage
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 70,
      functions: 35,
      lines: 35
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
    '!src/__tests__/**',
    '!src/__mocks__/**',
    '!src/index.js'
  ],

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Max workers for parallel test execution
  maxWorkers: '50%'
};
