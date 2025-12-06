/* eslint-env node, jest */
import { jest } from '@jest/globals';
import { Collections, ServiceError } from '@microrealestate/common';
import * as leaseManager from '../../managers/leasemanager.js';

// Mock the Collections module
jest.mock('@microrealestate/common', () => ({
  Collections: {
    Lease: {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteMany: jest.fn()
    },
    Tenant: {
      find: jest.fn()
    },
    Template: {
      find: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn()
    },
    startSession: jest.fn(() => ({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    })),
    ObjectId: jest.fn((id) => id)
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

describe('Lease Manager - Unit Tests', () => {
  let mockReq, mockRes;

  const resetCollections = () => {
    Collections.Lease = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteMany: jest.fn()
    };
    Collections.Tenant = {
      find: jest.fn()
    };
    Collections.Template = {
      find: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn()
    };
    Collections.startSession = jest.fn(() => ({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    }));
  };

  beforeEach(() => {
    resetCollections();
    mockReq = {
      realm: {
        _id: 'realm123'
      },
      body: {},
      params: {}
    };
    mockRes = {
      json: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('add() - Create new lease', () => {
    test('should create a new lease successfully', async () => {
      const leaseData = {
        name: 'Monthly Lease',
        numberOfTerms: 12,
        timeRange: 'months',
        active: true,
        description: 'Standard monthly lease'
      };

      mockReq.body = leaseData;

      const mockSavedLease = {
        ...leaseData,
        _id: 'lease123',
        realmId: 'realm123',
        usedByTenants: false
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedLease);
      Collections.Lease = jest.fn().mockImplementation(function (data) {
        this.save = mockSave;
        return Object.assign(this, data);
      });

      Collections.Tenant.find.mockResolvedValue([]);

      await leaseManager.add(mockReq, mockRes);

      expect(Collections.Lease).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monthly Lease',
          realmId: 'realm123',
          active: true
        })
      );
      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monthly Lease',
          usedByTenants: false
        })
      );
    });

    test('should set active to true when numberOfTerms and timeRange are provided', async () => {
      const leaseData = {
        name: 'Yearly Lease',
        numberOfTerms: 1,
        timeRange: 'years',
        active: true
      };

      mockReq.body = leaseData;

      const mockSave = jest.fn().mockResolvedValue({
        ...leaseData,
        _id: 'lease456',
        realmId: 'realm123'
      });

      Collections.Lease = jest.fn().mockImplementation(function (data) {
        this.save = mockSave;
        return Object.assign(this, data);
      });

      Collections.Tenant.find.mockResolvedValue([]);

      await leaseManager.add(mockReq, mockRes);

      expect(Collections.Lease).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true
        })
      );
    });

    test('should set active to false when numberOfTerms or timeRange is missing', async () => {
      const leaseData = {
        name: 'Inactive Lease',
        active: true
      };

      mockReq.body = leaseData;

      const mockSave = jest.fn().mockResolvedValue({
        ...leaseData,
        _id: 'lease789',
        realmId: 'realm123',
        active: false
      });

      Collections.Lease = jest.fn().mockImplementation(function (data) {
        this.save = mockSave;
        return Object.assign(this, data);
      });

      Collections.Tenant.find.mockResolvedValue([]);

      await leaseManager.add(mockReq, mockRes);

      expect(Collections.Lease).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false
        })
      );
    });

    test('should throw error when lease name is missing', async () => {
      mockReq.body = {
        numberOfTerms: 12,
        timeRange: 'months'
      };

      await expect(leaseManager.add(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
      await expect(leaseManager.add(mockReq, mockRes)).rejects.toThrow(
        'missing fields'
      );
    });

    test('should throw error when lease name is empty string', async () => {
      mockReq.body = {
        name: '',
        numberOfTerms: 12,
        timeRange: 'months'
      };

      await expect(leaseManager.add(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
    });

    test('should check if lease is used by tenants', async () => {
      const leaseData = {
        name: 'Used Lease',
        numberOfTerms: 12,
        timeRange: 'months',
        active: true
      };

      mockReq.body = leaseData;

      const mockSavedLease = {
        ...leaseData,
        _id: 'leaseUsed123',
        realmId: 'realm123'
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedLease);
      Collections.Lease = jest.fn().mockImplementation(function (data) {
        this.save = mockSave;
        return Object.assign(this, data);
      });

      Collections.Tenant.find.mockResolvedValue([
        { leaseId: 'leaseUsed123', realmId: 'realm123' }
      ]);

      await leaseManager.add(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          usedByTenants: true
        })
      );
    });
  });

  describe('update() - Update existing lease', () => {
    test('should update lease when not used by tenants', async () => {
      const updatedLeaseData = {
        _id: 'lease123',
        name: 'Updated Monthly Lease',
        numberOfTerms: 24,
        timeRange: 'months',
        active: true,
        description: 'Updated description'
      };

      mockReq.body = updatedLeaseData;

      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...updatedLeaseData,
          realmId: 'realm123'
        })
      });

      await leaseManager.update(mockReq, mockRes);

      expect(Collections.Lease.findOneAndUpdate).toHaveBeenCalledWith(
        {
          realmId: 'realm123',
          _id: 'lease123'
        },
        updatedLeaseData,
        { new: true }
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Monthly Lease',
          usedByTenants: false
        })
      );
    });

    test('should only update allowed fields when lease is used by tenants', async () => {
      const updatedLeaseData = {
        _id: 'leaseUsed123',
        name: 'Updated Name',
        numberOfTerms: 24,
        timeRange: 'years',
        active: false,
        description: 'New description',
        stepperMode: true
      };

      mockReq.body = updatedLeaseData;

      Collections.Tenant.find.mockResolvedValue([
        { leaseId: 'leaseUsed123', realmId: 'realm123' }
      ]);

      const dbLease = {
        _id: 'leaseUsed123',
        name: 'Old Name',
        numberOfTerms: 12,
        timeRange: 'months',
        active: true,
        description: 'Old description',
        stepperMode: false
      };

      Collections.Lease.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...dbLease,
          name: 'Updated Name',
          description: 'New description',
          active: false,
          stepperMode: true
        })
      });

      await leaseManager.update(mockReq, mockRes);

      expect(Collections.Lease.findOneAndUpdate).toHaveBeenCalledWith(
        {
          realmId: 'realm123',
          _id: 'leaseUsed123'
        },
        expect.objectContaining({
          name: 'Updated Name',
          description: 'New description',
          active: false,
          stepperMode: true
        }),
        { new: true }
      );
    });

    test('should throw error when lease name is missing in update', async () => {
      mockReq.body = {
        _id: 'lease123',
        numberOfTerms: 12
      };

      await expect(leaseManager.update(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
      await expect(leaseManager.update(mockReq, mockRes)).rejects.toThrow(
        'missing fields'
      );
    });

    test('should throw error when lease is not found', async () => {
      mockReq.body = {
        _id: 'nonexistent',
        name: 'Test Lease'
      };

      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      await expect(leaseManager.update(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
      await expect(leaseManager.update(mockReq, mockRes)).rejects.toThrow(
        'lease not found'
      );
    });

    test('should set active based on numberOfTerms and timeRange', async () => {
      const updatedLeaseData = {
        _id: 'lease123',
        name: 'Test Lease',
        numberOfTerms: 12,
        timeRange: 'months'
      };

      mockReq.body = updatedLeaseData;

      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...updatedLeaseData,
          realmId: 'realm123',
          active: true
        })
      });

      await leaseManager.update(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true
        })
      );
    });
  });

  describe('remove() - Delete lease', () => {
    test('should delete lease when not used by tenants', async () => {
      mockReq.params.ids = 'lease1,lease2';

      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.find.mockResolvedValue([
        { _id: 'lease1', name: 'Lease 1' },
        { _id: 'lease2', name: 'Lease 2' }
      ]);

      Collections.Lease.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await leaseManager.remove(mockReq, mockRes);

      expect(Collections.Lease.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['lease1', 'lease2'] },
        realmId: 'realm123'
      });

      expect(mockRes.sendStatus).toHaveBeenCalledWith(200);
    });

    test('should throw error when trying to delete lease used by tenants', async () => {
      mockReq.params.ids = 'lease1,lease2';

      Collections.Tenant.find.mockResolvedValue([
        { leaseId: 'lease1', realmId: 'realm123' }
      ]);

      await expect(leaseManager.remove(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
      await expect(leaseManager.remove(mockReq, mockRes)).rejects.toThrow(
        'missing fields'
      );
    });

    test('should throw error when lease ids are missing', async () => {
      mockReq.params.ids = '';

      await expect(leaseManager.remove(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
    });

    test('should throw error when lease is not found', async () => {
      mockReq.params.ids = 'nonexistent';

      Collections.Tenant.find.mockResolvedValue([]);
      Collections.Lease.find.mockResolvedValue([]);

      await expect(leaseManager.remove(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
      await expect(leaseManager.remove(mockReq, mockRes)).rejects.toThrow(
        'lease not found'
      );
    });

    test('should delete multiple leases', async () => {
      mockReq.params.ids = 'lease1,lease2,lease3';

      Collections.Tenant.find.mockResolvedValue([]);

      Collections.Lease.find.mockResolvedValue([
        { _id: 'lease1' },
        { _id: 'lease2' },
        { _id: 'lease3' }
      ]);

      Collections.Lease.deleteMany.mockResolvedValue({ deletedCount: 3 });

      await leaseManager.remove(mockReq, mockRes);

      expect(Collections.Lease.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['lease1', 'lease2', 'lease3'] },
        realmId: 'realm123'
      });
    });
  });

  describe('all() - Get all leases', () => {
    test('should return all leases for realm', async () => {
      const mockLeases = [
        {
          _id: 'lease1',
          name: 'Monthly Lease',
          numberOfTerms: 12,
          timeRange: 'months',
          realmId: 'realm123'
        },
        {
          _id: 'lease2',
          name: 'Yearly Lease',
          numberOfTerms: 1,
          timeRange: 'years',
          realmId: 'realm123'
        }
      ];

      Collections.Lease.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLeases)
      });

      Collections.Tenant.find.mockResolvedValue([
        { leaseId: 'lease1', realmId: 'realm123' }
      ]);

      await leaseManager.all(mockReq, mockRes);

      expect(Collections.Lease.find).toHaveBeenCalledWith({
        realmId: 'realm123'
      });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: 'lease1',
            usedByTenants: true
          }),
          expect.objectContaining({
            _id: 'lease2',
            usedByTenants: false
          })
        ])
      );
    });

    test('should return empty array when no leases exist', async () => {
      Collections.Lease.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      Collections.Tenant.find.mockResolvedValue([]);

      await leaseManager.all(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });
  });

  describe('one() - Get single lease', () => {
    test('should return single lease by id', async () => {
      mockReq.params.id = 'lease123';

      const mockLease = {
        _id: 'lease123',
        name: 'Test Lease',
        numberOfTerms: 12,
        timeRange: 'months',
        realmId: 'realm123'
      };

      Collections.Lease.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLease)
      });

      Collections.Tenant.find.mockResolvedValue([
        { leaseId: 'lease123', realmId: 'realm123' }
      ]);

      await leaseManager.one(mockReq, mockRes);

      expect(Collections.Lease.findOne).toHaveBeenCalledWith({
        _id: 'lease123',
        realmId: 'realm123'
      });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'lease123',
          name: 'Test Lease',
          usedByTenants: true
        })
      );
    });

    test('should throw error when lease is not found', async () => {
      mockReq.params.id = 'nonexistent';

      Collections.Lease.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      Collections.Tenant.find.mockResolvedValue([]);

      await expect(leaseManager.one(mockReq, mockRes)).rejects.toThrow(
        ServiceError
      );
      await expect(leaseManager.one(mockReq, mockRes)).rejects.toThrow(
        'lease not found'
      );
    });
  });
});
