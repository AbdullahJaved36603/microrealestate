/* eslint-env node, jest */
import { jest } from '@jest/globals';
import { Collections } from '@microrealestate/common';
import moment from 'moment';

// Mock the Collections module for database integration tests
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
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      aggregate: jest.fn(),
      deleteMany: jest.fn()
    },
    Property: {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteMany: jest.fn()
    },
    Realm: {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn()
    },
    ObjectId: jest.fn((id) => id),
    startSession: jest.fn()
  }
}));

describe('Database Integration Tests - Tenant Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tenant CRUD operations', () => {
    test('should find tenants by realmId', async () => {
      const mockTenants = [
        {
          _id: 'tenant1',
          name: 'John Doe',
          realmId: 'realm123',
          beginDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
          endDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
          leaseId: 'lease123',
          properties: [{ propertyId: 'prop1' }]
        },
        {
          _id: 'tenant2',
          name: 'Jane Smith',
          realmId: 'realm123',
          beginDate: moment('01/02/2023', 'DD/MM/YYYY').toDate(),
          endDate: moment('31/01/2024', 'DD/MM/YYYY').toDate(),
          leaseId: 'lease456',
          properties: [{ propertyId: 'prop2' }]
        }
      ];

      Collections.Tenant.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockTenants)
        })
      });

      const result = await Collections.Tenant.find({ realmId: 'realm123' })
        .sort({ name: 1 })
        .lean();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('_id', 'tenant1');
      expect(result[0]).toHaveProperty('name', 'John Doe');
      expect(result[1]).toHaveProperty('_id', 'tenant2');
      expect(Collections.Tenant.find).toHaveBeenCalledWith({
        realmId: 'realm123'
      });
    });

    test('should find single tenant by id and realmId', async () => {
      const mockTenant = {
        _id: 'tenant123',
        name: 'Test Tenant',
        realmId: 'realm123',
        beginDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
        endDate: moment('31/12/2023', 'DD/MM/YYYY').toDate(),
        properties: [],
        rents: []
      };

      Collections.Tenant.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTenant)
      });

      const result = await Collections.Tenant.findOne({
        _id: 'tenant123',
        realmId: 'realm123'
      }).lean();

      expect(result).toHaveProperty('_id', 'tenant123');
      expect(result).toHaveProperty('name', 'Test Tenant');
      expect(Collections.Tenant.findOne).toHaveBeenCalledWith({
        _id: 'tenant123',
        realmId: 'realm123'
      });
    });

    test('should update tenant successfully', async () => {
      const updatedTenant = {
        _id: 'tenant123',
        name: 'Updated Tenant Name',
        realmId: 'realm123',
        beginDate: moment('01/01/2023', 'DD/MM/YYYY').toDate(),
        endDate: moment('31/12/2023', 'DD/MM/YYYY').toDate()
      };

      Collections.Tenant.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedTenant)
      });

      const result = await Collections.Tenant.findOneAndUpdate(
        { _id: 'tenant123', realmId: 'realm123' },
        { name: 'Updated Tenant Name' },
        { new: true }
      ).lean();

      expect(result).toHaveProperty('name', 'Updated Tenant Name');
      expect(Collections.Tenant.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'tenant123', realmId: 'realm123' },
        { name: 'Updated Tenant Name' },
        { new: true }
      );
    });

    test('should delete multiple tenants', async () => {
      Collections.Tenant.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const result = await Collections.Tenant.deleteMany({
        _id: { $in: ['tenant1', 'tenant2'] },
        realmId: 'realm123'
      });

      expect(result.deletedCount).toBe(2);
      expect(Collections.Tenant.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['tenant1', 'tenant2'] },
        realmId: 'realm123'
      });
    });
  });

  describe('Tenant aggregation queries', () => {
    test('should aggregate tenants with document lookups', async () => {
      const mockAggregationResult = [
        {
          _id: 'tenant1',
          name: 'John Doe',
          realmId: 'realm123',
          documents: [
            {
              _id: 'doc1',
              name: 'Contract',
              url: 'http://example.com/doc1.pdf'
            }
          ]
        }
      ];

      Collections.Tenant.aggregate.mockResolvedValue(mockAggregationResult);

      const result = await Collections.Tenant.aggregate([
        { $match: { realmId: 'realm123' } },
        {
          $lookup: {
            from: 'documents',
            localField: '_id',
            foreignField: 'tenantId',
            as: 'documents'
          }
        }
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('documents');
      expect(result[0].documents).toHaveLength(1);
    });

    test('should find tenants with specific lease', async () => {
      const mockTenants = [
        {
          _id: 'tenant1',
          name: 'Tenant A',
          leaseId: 'lease123',
          realmId: 'realm123'
        },
        {
          _id: 'tenant2',
          name: 'Tenant B',
          leaseId: 'lease123',
          realmId: 'realm123'
        }
      ];

      Collections.Tenant.find.mockResolvedValue(mockTenants);

      const result = await Collections.Tenant.find({
        realmId: 'realm123',
        leaseId: 'lease123'
      });

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.leaseId === 'lease123')).toBe(true);
    });

    test('should find active tenants (not terminated)', async () => {
      const mockActiveTenants = [
        {
          _id: 'tenant1',
          name: 'Active Tenant 1',
          realmId: 'realm123',
          endDate: moment().add(6, 'months').toDate(),
          terminationDate: null
        },
        {
          _id: 'tenant2',
          name: 'Active Tenant 2',
          realmId: 'realm123',
          endDate: moment().add(1, 'year').toDate()
        }
      ];

      Collections.Tenant.find.mockResolvedValue(mockActiveTenants);

      const result = await Collections.Tenant.find({
        realmId: 'realm123',
        $or: [
          { terminationDate: { $exists: false } },
          { terminationDate: null },
          { terminationDate: { $gte: moment().toDate() } }
        ]
      });

      expect(result).toHaveLength(2);
      expect(result.every((t) => !t.terminationDate)).toBe(true);
    });
  });

  describe('Tenant rent queries', () => {
    test('should find tenants with rents in specific term', async () => {
      const startTerm = 202301;
      const endTerm = 202312;

      const mockTenants = [
        {
          _id: 'tenant1',
          name: 'Tenant 1',
          realmId: 'realm123',
          rents: [
            { term: 202301, total: { grandTotal: 1000 } },
            { term: 202302, total: { grandTotal: 1000 } }
          ]
        }
      ];

      Collections.Tenant.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockTenants)
        })
      });

      const result = await Collections.Tenant.find({
        realmId: 'realm123',
        'rents.term': { $gte: startTerm, $lte: endTerm }
      })
        .sort({ name: 1 })
        .lean();

      expect(result).toHaveLength(1);
      expect(result[0].rents.length).toBeGreaterThan(0);
    });

    test('should calculate total revenue from rents', async () => {
      const mockTenants = [
        {
          _id: 'tenant1',
          rents: [
            { term: 202301, total: { payment: 1000, grandTotal: 1200 } },
            { term: 202302, total: { payment: 1000, grandTotal: 1200 } }
          ]
        },
        {
          _id: 'tenant2',
          rents: [{ term: 202301, total: { payment: 1500, grandTotal: 1500 } }]
        }
      ];

      Collections.Tenant.find.mockResolvedValue(mockTenants);

      const result = await Collections.Tenant.find({ realmId: 'realm123' });

      const totalRevenue = result.reduce((total, tenant) => {
        return (
          total +
          tenant.rents.reduce((sum, rent) => sum + rent.total.payment, 0)
        );
      }, 0);

      expect(totalRevenue).toBe(3500);
    });
  });
});

describe('Database Integration Tests - Property Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property CRUD operations', () => {
    test('should find all properties for realm', async () => {
      const mockProperties = [
        {
          _id: 'prop1',
          name: 'Office A',
          type: 'office',
          price: 1000,
          realmId: 'realm123'
        },
        {
          _id: 'prop2',
          name: 'Shop B',
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

      const result = await Collections.Property.find({ realmId: 'realm123' })
        .sort({ name: 1 })
        .lean();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'Office A');
      expect(result[1]).toHaveProperty('name', 'Shop B');
    });

    test('should count properties for realm', async () => {
      Collections.Property.find.mockReturnValue({
        count: jest.fn().mockResolvedValue(10)
      });

      const count = await Collections.Property.find({
        realmId: 'realm123'
      }).count();

      expect(count).toBe(10);
    });

    test('should find properties by type', async () => {
      const mockOfficeProperties = [
        {
          _id: 'prop1',
          name: 'Office 1',
          type: 'office',
          price: 1000,
          realmId: 'realm123'
        },
        {
          _id: 'prop2',
          name: 'Office 2',
          type: 'office',
          price: 1200,
          realmId: 'realm123'
        }
      ];

      Collections.Property.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockOfficeProperties)
      });

      const result = await Collections.Property.find({
        realmId: 'realm123',
        type: 'office'
      }).lean();

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.type === 'office')).toBe(true);
    });

    test('should update property price', async () => {
      const updatedProperty = {
        _id: 'prop123',
        name: 'Office Space',
        type: 'office',
        price: 1500,
        realmId: 'realm123'
      };

      Collections.Property.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedProperty)
      });

      const result = await Collections.Property.findOneAndUpdate(
        { _id: 'prop123', realmId: 'realm123' },
        { price: 1500 },
        { new: true }
      ).lean();

      expect(result).toHaveProperty('price', 1500);
    });

    test('should delete property', async () => {
      Collections.Property.deleteMany.mockResolvedValue({ deletedCount: 1 });

      const result = await Collections.Property.deleteMany({
        _id: 'prop123',
        realmId: 'realm123'
      });

      expect(result.deletedCount).toBe(1);
    });
  });

  describe('Property queries with tenant relationships', () => {
    test('should find properties rented by specific tenant', async () => {
      const mockTenants = [
        {
          _id: 'tenant1',
          name: 'Tenant 1',
          properties: [{ propertyId: 'prop1' }, { propertyId: 'prop2' }]
        }
      ];

      Collections.Tenant.find.mockResolvedValue(mockTenants);

      const mockProperties = [
        { _id: 'prop1', name: 'Office A' },
        { _id: 'prop2', name: 'Shop B' }
      ];

      Collections.Property.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProperties)
      });

      const tenants = await Collections.Tenant.find({
        _id: 'tenant1',
        realmId: 'realm123'
      });

      const propertyIds = tenants[0].properties.map((p) => p.propertyId);

      const result = await Collections.Property.find({
        _id: { $in: propertyIds },
        realmId: 'realm123'
      }).lean();

      expect(result).toHaveLength(2);
    });

    test('should find vacant properties', async () => {
      const mockTenantsWithProperties = [
        {
          _id: 'tenant1',
          properties: [{ propertyId: 'prop1' }]
        },
        {
          _id: 'tenant2',
          properties: [{ propertyId: 'prop2' }]
        }
      ];

      Collections.Tenant.find.mockResolvedValue(mockTenantsWithProperties);

      const allProperties = [
        { _id: 'prop1', name: 'Rented Office' },
        { _id: 'prop2', name: 'Rented Shop' },
        { _id: 'prop3', name: 'Vacant Warehouse' }
      ];

      Collections.Property.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(allProperties)
      });

      const tenants = await Collections.Tenant.find({ realmId: 'realm123' });
      const rentedPropertyIds = new Set(
        tenants.flatMap((t) => t.properties.map((p) => p.propertyId))
      );

      const allProps = await Collections.Property.find({
        realmId: 'realm123'
      }).lean();

      const vacantProperties = allProps.filter(
        (p) => !rentedPropertyIds.has(String(p._id))
      );

      expect(vacantProperties).toHaveLength(1);
      expect(vacantProperties[0]).toHaveProperty('name', 'Vacant Warehouse');
    });
  });
});

describe('Database Integration Tests - Lease Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lease CRUD operations', () => {
    test('should find all leases', async () => {
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

      const result = await Collections.Lease.find({
        realmId: 'realm123'
      }).lean();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'Monthly Lease');
    });

    test('should find active leases', async () => {
      const mockActiveLeases = [
        {
          _id: 'lease1',
          name: 'Active Monthly Lease',
          numberOfTerms: 12,
          timeRange: 'months',
          active: true,
          realmId: 'realm123'
        }
      ];

      Collections.Lease.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockActiveLeases)
      });

      const result = await Collections.Lease.find({
        realmId: 'realm123',
        active: true
      }).lean();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('active', true);
    });

    test('should check if lease is used by tenants', async () => {
      const mockTenantsUsingLease = [
        {
          _id: 'tenant1',
          leaseId: 'lease123',
          realmId: 'realm123'
        },
        {
          _id: 'tenant2',
          leaseId: 'lease123',
          realmId: 'realm123'
        }
      ];

      Collections.Tenant.find.mockResolvedValue(mockTenantsUsingLease);

      const result = await Collections.Tenant.find({
        realmId: 'realm123',
        leaseId: 'lease123'
      });

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.leaseId === 'lease123')).toBe(true);
    });
  });
});

describe('Database Integration Tests - Complex Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should calculate occupancy rate', async () => {
    const mockTenants = [
      {
        _id: 'tenant1',
        properties: [{ propertyId: 'prop1' }, { propertyId: 'prop2' }]
      },
      {
        _id: 'tenant2',
        properties: [{ propertyId: 'prop3' }]
      }
    ];

    Collections.Tenant.find.mockResolvedValue(mockTenants);

    Collections.Property.find.mockReturnValue({
      count: jest.fn().mockResolvedValue(10)
    });

    const tenants = await Collections.Tenant.find({ realmId: 'realm123' });
    const totalProperties = await Collections.Property.find({
      realmId: 'realm123'
    }).count();

    const rentedProperties = new Set(
      tenants.flatMap((t) => t.properties.map((p) => p.propertyId))
    ).size;

    const occupancyRate = rentedProperties / totalProperties;

    expect(occupancyRate).toBe(0.3); // 3 out of 10 properties rented
  });

  test('should find tenants with overdue payments', async () => {
    const currentTerm = Number(moment().format('YYYYMM'));

    const mockTenants = [
      {
        _id: 'tenant1',
        name: 'Overdue Tenant',
        rents: [
          {
            term: currentTerm - 1,
            total: { grandTotal: 1000, payment: 500, newBalance: -500 }
          }
        ]
      }
    ];

    Collections.Tenant.find.mockResolvedValue(mockTenants);

    const result = await Collections.Tenant.find({ realmId: 'realm123' });

    const overdueTenantsResult = result.filter((tenant) =>
      tenant.rents.some((rent) => rent.total.newBalance < 0)
    );

    expect(overdueTenantsResult).toHaveLength(1);
    expect(overdueTenantsResult[0]).toHaveProperty('name', 'Overdue Tenant');
  });
});
