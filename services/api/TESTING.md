# Landlord API Testing Suite

Comprehensive white-box testing suite for the MicroRealEstate Landlord API module.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)

## Overview

This testing suite implements comprehensive white-box testing for the landlord module using Jest. The tests focus on statement coverage and include:

- **Unit Tests**: Testing individual functions and business logic
- **Integration Tests**: Testing API endpoints and database interactions
- **Security Tests**: Testing authentication, authorization, and input validation

### Testing Technique

- **White-box Testing**: Statement coverage approach
- **Test Coverage Target**: 80% statement and line coverage
- **Mocking Strategy**: Uses real functions with mocked database connections

## Test Structure

```
services/api/src/__tests__/
├── setup.js                          # Global test configuration
├── unit/                             # Unit tests
│   ├── businesslogic.test.js        # Business logic tests
│   ├── contract.test.js             # Contract manager tests
│   └── leasemanager.test.js         # Lease manager tests
├── integration/                      # Integration tests
│   ├── api-endpoints.test.js        # API endpoint tests
│   └── database-queries.test.js     # Database query tests
└── security/                         # Security tests
    ├── authentication-authorization.test.js
    └── input-validation.test.js
```

## Test Types

### 1. Unit Tests

Tests for individual functions and business logic components.

#### Business Logic Tests (`unit/businesslogic.test.js`)
- ✅ Rent calculation for single property
- ✅ Rent calculation with multiple properties
- ✅ VAT calculation
- ✅ Discount application
- ✅ Balance carryforward (debt accumulation)
- ✅ Edge cases (zero VAT, no expenses)

#### Contract Manager Tests (`unit/contract.test.js`)
- ✅ Contract creation with different frequencies
- ✅ Contract validation (dates, properties)
- ✅ Contract update and renewal
- ✅ Contract termination
- ✅ Payment processing
- ✅ Error handling

#### Lease Manager Tests (`unit/leasemanager.test.js`)
- ✅ CRUD operations
- ✅ Lease validation
- ✅ Usage tracking by tenants
- ✅ Permission checks

### 2. Integration Tests

Tests for API endpoints and database operations.

#### API Endpoints Tests (`integration/api-endpoints.test.js`)
- ✅ Lease endpoints (GET, POST, PATCH, DELETE)
- ✅ Property endpoints
- ✅ Dashboard statistics
- ✅ Error responses (404, 422, 403)

#### Database Query Tests (`integration/database-queries.test.js`)
- ✅ Tenant CRUD operations
- ✅ Property queries
- ✅ Lease queries
- ✅ Aggregation queries
- ✅ Complex queries (occupancy rate, overdue payments)

### 3. Security Tests

Tests for authentication, authorization, and security vulnerabilities.

#### Authentication & Authorization Tests (`security/authentication-authorization.test.js`)
- ✅ Access token validation
- ✅ Token expiration handling
- ✅ Invalid token detection
- ✅ Role-based access control
- ✅ Organization access control
- ✅ NoSQL injection prevention
- ✅ XSS prevention
- ✅ Data exposure prevention

#### Input Validation Tests (`security/input-validation.test.js`)
- ✅ Lease input validation
- ✅ Property input validation
- ✅ Tenant input validation
- ✅ Payment input validation
- ✅ Realm/organization validation
- ✅ Bulk operation validation
- ✅ Rate limiting and DoS prevention

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm ci

# Build TypeScript dependencies
npm run build --workspace=types
npm run build --workspace=services/common
```

### Run All Tests

```bash
cd services/api
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration

# Security tests only
npm test -- --testPathPattern=security
```

### Run with Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Generate coverage for specific suite
npm test -- --testPathPattern=unit --coverage --coverageDirectory=coverage/unit
```

### Watch Mode (Development)

```bash
# Run tests in watch mode
npm test -- --watch

# Run specific file in watch mode
npm test -- --watch unit/businesslogic.test.js
```

## Coverage Requirements

The test suite enforces the following coverage thresholds:

| Metric      | Threshold |
|-------------|-----------|
| Statements  | 80%       |
| Branches    | 75%       |
| Functions   | 75%       |
| Lines       | 80%       |

### View Coverage Report

After running tests with coverage:

```bash
# View HTML coverage report
open coverage/lcov-report/index.html

# View coverage summary in terminal
cat coverage/coverage-summary.json | jq '.total'
```

## CI/CD Integration

### GitHub Actions Workflow

The tests are automatically executed on:
- Push to `master` or `develop` branches
- Pull requests to `master` or `develop` branches
- Changes to API, common services, or types

### Workflow Jobs

1. **Unit Tests**: Runs unit tests in parallel on Node.js 18.x and 20.x
2. **Integration Tests**: Runs with MongoDB and Redis services
3. **Security Tests**: Validates security measures
4. **All Tests**: Comprehensive test run with full coverage
5. **Code Quality**: ESLint and Prettier checks
6. **Test Summary**: Aggregates results from all jobs

### Running CI/CD Locally

```bash
# Install act (GitHub Actions local runner)
# macOS
brew install act

# Windows
choco install act-cli

# Run workflow locally
act -j unit-tests
act -j integration-tests
act -j security-tests
```

## Test Coverage by Module

### Business Logic (`businesslogic/`)
- ✅ computeRent function
- ✅ All task modules (base, debts, discounts, VATs, balance, payments, total)

### Managers (`managers/`)
- ✅ Contract Manager (100% coverage)
- ✅ Lease Manager (100% coverage)
- ⚠️ Occupant Manager (covered via integration tests)
- ⚠️ Property Manager (covered via integration tests)
- ⚠️ Rent Manager (covered via integration tests)
- ⚠️ Dashboard Manager (covered via integration tests)

### Routes (`routes.js`)
- ✅ All endpoints tested via integration tests
- ✅ Authentication middleware
- ✅ Authorization middleware

## Mock Data Strategy

The tests use a combination of:
- **Jest mocks** for external dependencies (database, services)
- **Real functions** for business logic
- **Test fixtures** for consistent test data
- **Stubs and drivers** for isolated component testing

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Cleanup**: Mocks are cleared after each test
3. **Descriptive Names**: Test names clearly describe what is being tested
4. **Arrange-Act-Assert**: Tests follow AAA pattern
5. **Edge Cases**: Tests include boundary conditions and error cases
6. **Real Code**: Tests use actual production code, not just mocks

## Troubleshooting

### Common Issues

#### Tests timing out
```bash
# Increase timeout in jest.config.js or individual tests
jest.setTimeout(10000);
```

#### Module not found errors
```bash
# Rebuild TypeScript dependencies
npm run build --workspace=types
npm run build --workspace=services/common
```

#### Coverage below threshold
```bash
# Check coverage report to identify uncovered lines
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Contributing

When adding new features to the landlord module:

1. Write unit tests for new functions
2. Add integration tests for new endpoints
3. Include security tests for input validation
4. Ensure coverage thresholds are met
5. Update this README if needed

## Test Scenarios Covered

### Functional Testing
- ✅ Login and authentication
- ✅ Data submission and validation
- ✅ Navigation between endpoints
- ✅ Error handling

### Non-Functional Testing
- ✅ Security (injection attacks, XSS)
- ✅ Input validation
- ✅ Authentication and authorization

### White-box Testing
- ✅ Statement coverage
- ✅ Branch coverage
- ✅ Function coverage
- ✅ Line coverage

## Automated Test Execution

Tests are automatically executed:
- ✅ On every commit to protected branches
- ✅ On every pull request
- ✅ With detailed coverage reports
- ✅ With quality gate enforcement

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
