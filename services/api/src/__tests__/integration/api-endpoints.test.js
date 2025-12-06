/* eslint-env node, jest */
import { Collections } from '@microrealestate/common';
import request from 'supertest';
import express from 'express';
import routes from '../../routes.js';

// Mock the common module
jest.mock('@microrealestate/common', () => ({
  Collections: {
    Lease: {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteMany: jest.fn()
    },
    Tenant: {
      find: jest.fn(),
      aggregate: jest.fn()
    },
    Property: {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteMany: jest.fn()
    },
    Realm: {
      find: jest.fn(),
      findOne: jest.fn()
    },
    ObjectId: jest.fn((id) => id)
  },
  Middlewares: {
    needAccessToken: jest.fn(() => (req, res, next) => {
      req.user = {
        type: 'user',
        email: 'test@example.com',
        role: 'administrator'
      };
      next();
    }),
    checkOrganization: jest.fn(() => (req, res, next) => {
      req.realms = [
        {
          _id: 'realm123',
          name: 'Test Organization',
          members: [{ email: 'test@example.com', role: 'administrator' }]
        }
      ];
      req.realm = req.realms[0];
      next();
    }),
    notRoles: jest.fn(() => (req, res, next) => next()),
    asyncWrapper: jest.fn((fn) => fn)
  },
  Service: {
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
  },
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  ServiceError: class ServiceError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

describe('API Integration Tests - Leases', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/leases - Get all leases', () => {
    test('should return all leases for the organization', async () => {
      const mockLeases = [
        {
          _id: 'lease1',
          name: 'Monthly Lease',
          numberOfTerms: 12,
          timeRange: 'months',
          active: true,
          realmId: 'realm123'
        },
        {
          _id: 'lease2',
          name: 'Yearly Lease',
          numberOfTerms: 1,
          timeRange: 'years',
          active: true,
          realmId: 'realm123'
        }
      ];

      Collections.Lease.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLeases)
      });

      Collections.Tenant.find.mockResolvedValue([
        { leaseId: 'lease1', realmId: 'realm123' }
      ]);

      const response = await request(app)
        .get('/api/leases')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('_id', 'lease1');
      expect(response.body[0]).toHaveProperty('usedByTenants', true);
      expect(response.body[1]).toHaveProperty('_id', 'lease2');
      expect(response.body[1]).toHaveProperty('usedByTenants', false);
    });

    test('should return empty array when no leases exist', async () => {
      Collections.Lease.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leases')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/leases/:id - Get single lease', () => {
    test('should return lease by id', async () => {
      const mockLease = {
        _id: 'lease123',
        name: 'Test Lease',
        numberOfTerms: 12,
        timeRange: 'months',
        active: true,
        realmId: 'realm123'
      };

      Collections.Lease.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLease)
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leases/lease123')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('_id', 'lease123');
      expect(response.body).toHaveProperty('name', 'Test Lease');
      expect(response.body).toHaveProperty('usedByTenants', false);
    });

    test('should return 404 when lease not found', async () => {
      Collections.Lease.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leases/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'lease not found');
    });
  });

  describe('POST /api/leases - Create lease', () => {
    test('should create new lease successfully', async () => {
      const newLease = {
        name: 'New Monthly Lease',
        numberOfTerms: 12,
        timeRange: 'months',
        description: 'Test lease'
      };

      const mockSavedLease = {
        ...newLease,
        _id: 'newLease123',
        realmId: 'realm123',
        active: true
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedLease);
      Collections.Lease = jest.fn().mockImplementation(function (data) {
        this.save = mockSave;
        return Object.assign(this, data);
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/leases')
        .set('Authorization', 'Bearer test-token')
        .send(newLease)
        .expect(200);

      expect(response.body).toHaveProperty('_id', 'newLease123');
      expect(response.body).toHaveProperty('name', 'New Monthly Lease');
      expect(response.body).toHaveProperty('active', true);
    });

    test('should return 422 when lease name is missing', async () => {
      const invalidLease = {
        numberOfTerms: 12,
        timeRange: 'months'
      };

      const response = await request(app)
        .post('/api/leases')
        .set('Authorization', 'Bearer test-token')
        .send(invalidLease)
        .expect(422);

      expect(response.body).toHaveProperty('message', 'missing fields');
    });
  });

  describe('PATCH /api/leases/:id - Update lease', () => {
    test('should update lease successfully', async () => {
      const updateData = {
        _id: 'lease123',
        name: 'Updated Lease',
        numberOfTerms: 24,
        timeRange: 'months',
        active: true
      };

      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...updateData,
          realmId: 'realm123'
        })
      });

      const response = await request(app)
        .patch('/api/leases/lease123')
        .set('Authorization', 'Bearer test-token')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Lease');
      expect(response.body).toHaveProperty('numberOfTerms', 24);
    });

    test('should return 422 when lease name is missing in update', async () => {
      const invalidUpdate = {
        _id: 'lease123',
        numberOfTerms: 24
      };

      const response = await request(app)
        .patch('/api/leases/lease123')
        .set('Authorization', 'Bearer test-token')
        .send(invalidUpdate)
        .expect(422);

      expect(response.body).toHaveProperty('message', 'missing fields');
    });

    test('should return 404 when updating non-existent lease', async () => {
      const updateData = {
        _id: 'nonexistent',
        name: 'Updated Lease'
      };

      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .patch('/api/leases/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'lease not found');
    });
  });

  describe('DELETE /api/leases/:ids - Delete leases', () => {
    test('should delete single lease successfully', async () => {
      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.find.mockResolvedValue([
        { _id: 'lease123', name: 'Test Lease' }
      ]);

      Collections.Lease.deleteMany.mockResolvedValue({ deletedCount: 1 });

      await request(app)
        .delete('/api/leases/lease123')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(Collections.Lease.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['lease123'] },
        realmId: 'realm123'
      });
    });

    test('should delete multiple leases successfully', async () => {
      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.find.mockResolvedValue([
        { _id: 'lease1', name: 'Lease 1' },
        { _id: 'lease2', name: 'Lease 2' }
      ]);

      Collections.Lease.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await request(app)
        .delete('/api/leases/lease1,lease2')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(Collections.Lease.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['lease1', 'lease2'] },
        realmId: 'realm123'
      });
    });

    test('should return 422 when trying to delete lease used by tenants', async () => {
      Collections.Tenant.find.mockResolvedValue([
        { leaseId: 'lease123', realmId: 'realm123' }
      ]);

      const response = await request(app)
        .delete('/api/leases/lease123')
        .set('Authorization', 'Bearer test-token')
        .expect(422);

      expect(response.body).toHaveProperty('message', 'missing fields');
    });

    test('should return 404 when deleting non-existent lease', async () => {
      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.find.mockResolvedValue([]);

      const response = await request(app)
        .delete('/api/leases/nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'lease not found');
    });
  });
});

describe('API Integration Tests - Properties', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/properties - Get all properties', () => {
    test('should return all properties for the organization', async () => {
      const mockProperties = [
        {
          _id: 'prop1',
          name: 'Office Space A',
          type: 'office',
          price: 1000,
          realmId: 'realm123'
        },
        {
          _id: 'prop2',
          name: 'Retail Shop B',
          type: 'retail',
          price: 1500,
          realmId: 'realm123'
        }
      ];

      Collections.Property.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockProperties)
        })
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('_id', 'prop1');
      expect(response.body[1]).toHaveProperty('_id', 'prop2');
    });

    test('should return empty array when no properties exist', async () => {
      Collections.Property.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/properties/:id - Get single property', () => {
    test('should return property by id', async () => {
      const mockProperty = {
        _id: 'prop123',
        name: 'Test Property',
        type: 'office',
        price: 2000,
        realmId: 'realm123'
      };

      Collections.Property.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProperty)
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/properties/prop123')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('_id', 'prop123');
      expect(response.body).toHaveProperty('name', 'Test Property');
    });
  });

  describe('POST /api/properties - Create property', () => {
    test('should create new property successfully', async () => {
      const newProperty = {
        name: 'New Office',
        type: 'office',
        price: 1200,
        surface: 100,
        description: 'Modern office space'
      };

      const mockSavedProperty = {
        ...newProperty,
        _id: 'newProp123',
        realmId: 'realm123'
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedProperty);
      Collections.Property = jest.fn().mockImplementation(function (data) {
        this.save = mockSave;
        return Object.assign(this, data);
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', 'Bearer test-token')
        .send(newProperty)
        .expect(200);

      expect(response.body).toHaveProperty('_id', 'newProp123');
      expect(response.body).toHaveProperty('name', 'New Office');
    });
  });

  describe('PATCH /api/properties/:id - Update property', () => {
    test('should update property successfully', async () => {
      const updateData = {
        _id: 'prop123',
        name: 'Updated Property',
        type: 'retail',
        price: 1800
      };

      Collections.Property.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...updateData,
          realmId: 'realm123'
        })
      });

      Collections.Tenant.find.mockResolvedValue([]);

      const response = await request(app)
        .patch('/api/properties/prop123')
        .set('Authorization', 'Bearer test-token')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Property');
      expect(response.body).toHaveProperty('price', 1800);
    });
  });

  describe('DELETE /api/properties/:ids - Delete properties', () => {
    test('should delete properties successfully', async () => {
      Collections.Property.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await request(app)
        .delete('/api/properties/prop1,prop2')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(Collections.Property.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['prop1', 'prop2'] },
        realmId: 'realm123'
      });
    });
  });
});

describe('API Integration Tests - Dashboard', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard - Get dashboard data', () => {
    test('should return dashboard statistics', async () => {
      const mockTenants = [
        {
          _id: 'tenant1',
          name: 'Tenant 1',
          endDate: new Date('2025-12-31'),
          properties: [{ propertyId: 'prop1' }],
          rents: [
            {
              term: 202312,
              total: { payment: 1000, grandTotal: 1200 }
            }
          ]
        }
      ];

      Collections.Tenant.find.mockResolvedValue(mockTenants);
      Collections.Property.find.mockReturnValue({
        count: jest.fn().mockResolvedValue(5)
      });

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer test-token')
        .set('organizationid', 'realm123')
        .expect(200);

      expect(response.body).toHaveProperty('tenantCount');
      expect(response.body).toHaveProperty('propertyCount');
      expect(response.body.propertyCount).toBe(5);
    });
  });
});
