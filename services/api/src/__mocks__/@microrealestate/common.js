import { jest } from '@jest/globals';

// Provide reusable mocked query builders so tests can rely on lean/sort/count chains.
const createQueryResult = (defaultResult = []) => ({
  lean: jest.fn().mockResolvedValue(defaultResult),
  sort: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(defaultResult)
  }),
  count: jest
    .fn()
    .mockResolvedValue(Array.isArray(defaultResult) ? defaultResult.length : 0)
});

// Mock for @microrealestate/common module
export const Collections = {
  Lease: {
    find: jest.fn().mockReturnValue(createQueryResult()),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ value: null })
    }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
  },
  Tenant: {
    find: jest.fn().mockReturnValue(createQueryResult()),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ value: null })
    }),
    aggregate: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
  },
  Property: {
    find: jest.fn().mockReturnValue(createQueryResult()),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ value: null })
    }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
  },
  Realm: {
    find: jest.fn().mockReturnValue(createQueryResult()),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    })
  },
  Template: {
    find: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 })
  },
  startSession: jest.fn(() => ({
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn()
  })),
  ObjectId: jest.fn((id) => id)
};

export const logger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

export class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

export const Middlewares = {
  asyncWrapper: jest.fn((fn) => async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const status = error?.statusCode || 500;
      res.status(status).json({ message: error.message });
    }
  }),
  needAccessToken: jest.fn(() => (req, res, next) => {
    req.user = req.user || {
      type: 'user',
      email: 'test@example.com',
      role: 'administrator'
    };
    next();
  }),
  checkOrganization: jest.fn(() => (req, res, next) => {
    const realmId = req.headers?.organizationid || 'realm123';
    req.realms = req.realms || [
      {
        _id: realmId,
        name: 'Test Organization',
        members: [
          {
            email: req.user?.email || 'test@example.com',
            role: 'administrator'
          }
        ]
      }
    ];
    req.realm = req.realms[0];
    next();
  }),
  notRoles: jest.fn(() => (req, res, next) => next())
};

export const Crypto = {
  hash: jest.fn((data) => 'hashed_' + data),
  verify: jest.fn(() => true)
};

export const Format = {
  formatDate: jest.fn((date) => date),
  formatCurrency: jest.fn((amount) => amount.toString())
};

export const URLUtils = {
  buildURL: jest.fn((...parts) => parts.join('/'))
};

export const Service = {
  getInstance: jest.fn(() => ({
    envConfig: {
      getValues: () => ({
        ACCESS_TOKEN_SECRET: 'test-secret',
        DEMO_MODE: false,
        EMAILER_URL: 'http://localhost:8083',
        PDFGENERATOR_URL: 'http://localhost:8082'
      })
    }
  }))
};

export class EnvironmentConfig {
  static getConfig() {
    return {};
  }
}

export class MongoClient {
  async connect() {}
  async disconnect() {}
}

export default {
  Service,
  EnvironmentConfig,
  Crypto,
  Format,
  Middlewares,
  MongoClient,
  URLUtils,
  Collections,
  logger,
  ServiceError
};
