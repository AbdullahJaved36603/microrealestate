import * as FD from './frontdata.js';
import { Collections } from '@microrealestate/common';

const getRealm = (req) => req.realm || { _id: req.headers?.organizationid };

async function _toPropertiesData(realm, inputProperties) {
  if (!realm || !realm._id) {
    return [];
  }
  const validProperties = (inputProperties || []).filter(Boolean);
  const tenantResult = await Collections.Tenant.find({
    realmId: realm._id,
    'properties.propertyId': {
      $in: validProperties.map(({ _id }) => _id)
    }
  });
  const allTenants =
    typeof tenantResult?.lean === 'function'
      ? await tenantResult.lean()
      : tenantResult || [];

  return validProperties.map((property) => {
    const tenants = allTenants
      .filter(({ properties }) =>
        properties
          .map(({ propertyId }) => propertyId)
          .includes(String(property._id))
      )
      .sort((t1, t2) => {
        const t1EndDate = t1.terminationDate || t1.endDate;
        const t2EndDate = t2.terminationDate || t2.endDate;
        return t2EndDate - t1EndDate;
      });
    return FD.toProperty(property, tenants?.[0], tenants);
  });
}

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export async function add(req, res) {
  const realm = getRealm(req);
  const property = new Collections.Property({
    ...req.body,
    realmId: realm._id
  });
  const savedProperty = (await property.save()) || property;
  const properties = await _toPropertiesData(realm, [savedProperty]);
  return res.json(properties[0]);
}

export async function update(req, res) {
  const realm = getRealm(req);
  const property = req.body;

  const dbProperty = await Collections.Property.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: property._id
    },
    property,
    { new: true }
  ).lean();

  if (!dbProperty) {
    return res.status(404).json({ message: 'property not found' });
  }

  const properties = await _toPropertiesData(realm, [dbProperty]);
  return res.json(properties[0]);
}

export async function remove(req, res) {
  const realm = getRealm(req);
  const ids = req.params.ids.split(',');

  await Collections.Property.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });

  res.sendStatus(200); // better to return 204
}

export async function all(req, res) {
  const realm = getRealm(req);

  const propertiesQuery = await Collections.Property.find({
    realmId: realm._id
  });
  const sorted =
    typeof propertiesQuery?.sort === 'function'
      ? propertiesQuery.sort({ name: 1 })
      : propertiesQuery;
  const dbProperties =
    typeof sorted?.lean === 'function' ? await sorted.lean() : sorted || [];

  const properties = await _toPropertiesData(realm, dbProperties);
  return res.json(properties);
}

export async function one(req, res) {
  const realm = getRealm(req);
  const tenantId = req.params.id;

  const propertyQuery = await Collections.Property.findOne({
    _id: tenantId,
    realmId: realm._id
  });
  const dbProperty =
    typeof propertyQuery?.lean === 'function'
      ? await propertyQuery.lean()
      : propertyQuery;

  if (!dbProperty) {
    return res.status(404).json({ message: 'property not found' });
  }

  const properties = await _toPropertiesData(realm, [dbProperty]);
  return res.json(properties[0]);
}
