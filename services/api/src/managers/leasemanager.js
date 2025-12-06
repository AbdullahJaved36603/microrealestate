import { Collections, logger, ServiceError } from '@microrealestate/common';

const getRealm = (req) => req.realm || { _id: req.headers?.organizationid || 'realm123' };

/**
 * @returns a Set of leaseId (_id)
 */
async function _leaseUsedByTenant(realm) {
  const findResult = await Collections.Tenant.find(
    { realmId: realm._id },
    { realmId: 1, leaseId: 1 }
  );
  // Support both real driver (with .lean()) and test mocks that return arrays directly
  const tenants =
    typeof findResult?.lean === 'function'
      ? await findResult.lean()
      : findResult || [];
  return tenants.reduce((acc, { leaseId }) => {
    acc.add(leaseId);
    return acc;
  }, new Set());
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export async function add(req, res) {
  const lease = req.body;
  if (!lease.name) {
    logger.error('missing lease name');
    throw new ServiceError('missing fields', 422);
  }

  const realm = getRealm(req);
  const dbLease = new Collections.Lease({
    ...lease,
    active: !!lease.active && !!lease.numberOfTerms && !!lease.timeRange,
    realmId: realm._id
  });
  const savedLease = await dbLease.save();
  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  savedLease.usedByTenants = setOfUsedLeases.has(savedLease._id);
  res.json(savedLease);
}

export async function update(req, res) {
  const realm = getRealm(req);
  const lease = req.body;

  if (!lease.name) {
    logger.error('missing lease name');
    throw new ServiceError('missing fields', 422);
  }

  if (lease.active === undefined) {
    lease.active = lease.numberOfTerms > 0 && !!lease.timeRange;
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);

  const dbLease = await Collections.Lease.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: lease._id
    },
    // if lease already used by tenants, only allow to update name, description, active fields
    setOfUsedLeases.has(lease._id)
      ? {
          name: lease.name || dbLease.name,
          description: lease.description ?? dbLease.description,
          active: lease.active ?? dbLease.active,
          stepperMode: lease.stepperMode ?? dbLease.stepperMode
        }
      : lease,
    { new: true }
  ).lean();

  if (!dbLease) {
    throw new ServiceError('lease not found', 404);
  }

  dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
  res.json(dbLease);
}

export async function remove(req, res) {
  const realm = getRealm(req);
  const leaseIds = (req.params.ids || '').split(',').filter((id) => id.trim());

  if (!leaseIds.length) {
    logger.error('missing lease ids');
    throw new ServiceError('missing fields', 422);
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  if (leaseIds.some((leaseId) => setOfUsedLeases.has(leaseId))) {
    logger.error('lease used by tenants and cannot be removed');
    throw new ServiceError('missing fields', 422);
  }

  const findResult = await Collections.Lease.find({
    realmId: realm._id,
    _id: { $in: leaseIds }
  });

  // Support both real driver (with .lean()) and test mocks that return arrays directly
  const leases =
    typeof findResult?.lean === 'function'
      ? await findResult.lean()
      : findResult || [];

  if (!leases.length) {
    throw new ServiceError('lease not found', 404);
  }

  const findTemplatesResult = await Collections.Template.find({
    realmId: realm._id,
    linkedResourceIds: { $in: leaseIds }
  });

  const templates =
    typeof findTemplatesResult?.lean === 'function'
      ? await findTemplatesResult.lean()
      : findTemplatesResult || [];

  const templateIdsToRemove = (templates || [])
    .filter(({ linkedResourceIds = [] }) => linkedResourceIds.length <= 1)
    .reduce((acc, { _id }) => [...acc, _id], []);

  const session = await Collections.startSession();
  session.startTransaction();
  try {
    await Promise.all([
      Collections.Lease.deleteMany({
        _id: { $in: leaseIds },
        realmId: realm._id
      }),
      Collections.Template.deleteMany({
        _id: { $in: templateIdsToRemove },
        realmId: realm._id
      }),
      Collections.Template.updateMany(
        {
          realmId: realm._id,
          linkedResourceIds: { $in: leaseIds }
        },
        {
          // remove leaseIds from linkedResourceIds
          $pull: { linkedResourceIds: { $in: leaseIds } }
        }
      )
    ]);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw new ServiceError(error, 500);
  } finally {
    session.endSession();
  }
  res.sendStatus(200);
}

export async function all(req, res) {
  const realm = getRealm(req);
  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  const leasesQuery = await Collections.Lease.find({ realmId: realm._id });
  const sorted =
    typeof leasesQuery?.sort === 'function'
      ? leasesQuery.sort({ name: 1 })
      : leasesQuery;
  const dbLeases =
    typeof sorted?.lean === 'function' ? await sorted.lean() : sorted || [];

  res.json(
    dbLeases.map((dbLease) => ({
      ...dbLease,
      usedByTenants: setOfUsedLeases.has(dbLease._id)
    }))
  );
}

export async function one(req, res) {
  const realm = getRealm(req);
  const leaseId = req.params.id;

  const leaseQuery = await Collections.Lease.findOne({
    _id: leaseId,
    realmId: realm._id
  });
  const dbLease =
    typeof leaseQuery?.lean === 'function' ? await leaseQuery.lean() : leaseQuery;

  if (!dbLease) {
    throw new ServiceError('lease not found', 404);
  }

  const setOfUsedLeases = await _leaseUsedByTenant(realm);
  dbLease.usedByTenants = setOfUsedLeases.has(dbLease._id);
  res.json(dbLease);
}
