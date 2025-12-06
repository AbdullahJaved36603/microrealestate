# Quick Start Guide - Running Tests

## Setup

### 1. Install Dependencies

```bash
# From project root
npm ci

# Install API service dependencies
cd services/api
npm ci
```

### 2. Build TypeScript Dependencies

```bash
# From project root
npm run build --workspace=types
npm run build --workspace=services/common
```

## Running Tests

### Run All Tests

```bash
cd services/api
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Security tests only
npm run test:security
```

### Run with Coverage

```bash
# All tests with coverage
npm run test:coverage

# Unit tests with coverage
npm run test:coverage:unit

# Integration tests with coverage
npm run test:coverage:integration

# Security tests with coverage
npm run test:coverage:security
```

### Development Mode

```bash
# Watch mode - tests re-run on file changes
npm run test:watch
```

## View Coverage Report

```bash
# After running tests with coverage
# Open the HTML report in your browser

# Windows
start coverage/lcov-report/index.html

# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

## Test Results

### Expected Output

```
PASS  src/__tests__/unit/businesslogic.test.js
PASS  src/__tests__/unit/contract.test.js
PASS  src/__tests__/unit/leasemanager.test.js
PASS  src/__tests__/integration/api-endpoints.test.js
PASS  src/__tests__/integration/database-queries.test.js
PASS  src/__tests__/security/authentication-authorization.test.js
PASS  src/__tests__/security/input-validation.test.js

Test Suites: 7 passed, 7 total
Tests:       150+ passed, 150+ total
Snapshots:   0 total
Time:        XX.XXXs

Coverage Summary:
-----------------
Statements   : 85.67% ( XXX/XXX )
Branches     : 78.45% ( XXX/XXX )
Functions    : 82.33% ( XXX/XXX )
Lines        : 86.21% ( XXX/XXX )
```

## Troubleshooting

### Issue: Tests fail with "Cannot find module"

**Solution:**

```bash
# Rebuild TypeScript dependencies
npm run build --workspace=types
npm run build --workspace=services/common
```

### Issue: Tests timeout

**Solution:**

```bash
# Tests have 10 second timeout by default
# If needed, increase in jest.config.js or individual test files
```

### Issue: Coverage below threshold

**Solution:**

```bash
# View detailed coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# Find uncovered lines and add tests
```

## CI/CD

Tests automatically run on:

- Every commit to master/develop
- Every pull request
- Can be triggered manually via GitHub Actions

## Next Steps

1. ✅ Review test coverage report
2. ✅ Add tests for new features
3. ✅ Ensure coverage thresholds are met
4. ✅ Check CI/CD pipeline status

## Documentation

- Full testing documentation: [TESTING.md](./TESTING.md)
- Jest documentation: https://jestjs.io/docs/getting-started
