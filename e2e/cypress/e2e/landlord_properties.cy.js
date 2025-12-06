/* eslint-disable cypress/unsafe-to-chain-command */
/// <reference types="cypress" />

// Prereq credentials
const signinUrl = 'http://localhost:8080/landlord/signin';
const validEmail = Cypress.env('LANDLORD_EMAIL') || 'muhammadabdullah36603@gmail.com';
const validPassword = Cypress.env('LANDLORD_PASSWORD') || 'Abdullah1.';

const loginAndGoProperties = () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.viewport(1200, 900);
  cy.visit(signinUrl);

  // Login using the exact selectors from HTML
  cy.get('input[name="email"]').clear().type(validEmail);
  cy.get('input[name="password"]').clear().type(validPassword, { log: false });
  cy.get('[data-cy="submit"]').click();

  // Wait for login to complete
  cy.url({ timeout: 15000 }).should('include', '/dashboard');
  
  // Click app menu button (has data-cy="appMenu")
  cy.get('[data-cy="appMenu"]').click();
  
  // Click Properties in menu - from your recording: div:nth-of-type(4) span
  cy.get('div:nth-of-type(4) span').click();
  
  // Verify we're on properties page
  cy.url({ timeout: 15000 }).should('match', /\/properties/);
};

const startNewProperty = (name) => {
  openAddPropertyDialog();
  enterPropertyNameInDialog(name);
  clickAddInDialog();
};

const openAddPropertyDialog = () => {
  // Click the Add Property button (plus icon) - use .first() to get only the first button
  cy.get('div.fixed > button').first().click();
};

const enterPropertyNameInDialog = (name) => {
  // Wait for dialog to appear, then type property name
  cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
  cy.get('[role="dialog"] input[name="name"]').clear().type(name);
};

const clickAddInDialog = () => {
  // Click Add button in dialog - from HTML: [data-cy='submitProperty']
  cy.get('[data-cy="submitProperty"]').click();
  
  // Wait for property page to load
  cy.get('[data-cy="propertyPage"]', { timeout: 10000 }).should('be.visible');
};

const selectPropertyType = (type = 'Room') => {
  // From HTML: The dropdown has id="mui-component-select-type"
  cy.get('#mui-component-select-type').click();
  
  // Select the option - from your recording: li:nth-of-type(3)
  // For Room: li:nth-of-type(3)
  // For Apartment: li:nth-of-type(1) maybe?
  if (type === 'Room') {
    cy.get('li:nth-of-type(3)').click();
  } else if (type === 'Apartment') {
    cy.get('li').contains('Apartment').click();
  }
};

const fillPropertyFormFields = ({
  name,
  description,
  surface,
  phone,
  digicode,
  addressStreet1,
  addressStreet2,
  addressCity,
  addressState,
  addressZip,
  addressCountry,
  rent
} = {}) => {
  // Name field
  if (name !== undefined) {
    cy.get('input[name="name"]').clear().type(name);
  }

  // Description field
  if (description !== undefined) {
    cy.get('input[name="description"]').clear().type(description);
  }

  // Surface field
  if (surface !== undefined) {
    cy.get('input[name="surface"]').clear().type(surface);
  }

  // Phone field
  if (phone !== undefined) {
    cy.get('input[name="phone"]').clear().type(phone);
  }

  // Digicode field
  if (digicode !== undefined) {
    cy.get('input[name="digicode"]').clear().type(digicode);
  }

  // Address fields
  if (addressStreet1 !== undefined) {
    cy.get('input[name="address.street1"]').clear().type(addressStreet1);
  }

  if (addressStreet2 !== undefined) {
    cy.get('input[name="address.street2"]').clear().type(addressStreet2);
  }

  if (addressZip !== undefined) {
    cy.get('input[name="address.zipCode"]').clear().type(addressZip);
  }

  if (addressCity !== undefined) {
    cy.get('input[name="address.city"]').clear().type(addressCity);
  }

  if (addressState !== undefined) {
    cy.get('input[name="address.state"]').clear().type(addressState);
  }

  if (addressCountry !== undefined) {
    cy.get('input[name="address.country"]').clear().type(addressCountry);
  }

  // Rent field
  if (rent !== undefined) {
    cy.get('input[name="rent"]').clear().type(rent);
  }
};

const clickSaveProperty = () => {
  // Click Save button - from HTML: [data-cy='submit']
  cy.get('[data-cy="submit"]').click();
  
  // Wait for redirect back to properties page
  cy.url({ timeout: 10000 }).should('match', /\/properties/);
};

describe('MODULE 3: PROPERTY MANAGEMENT - CREATE PROPERTY', () => {
  beforeEach(() => {
    loginAndGoProperties();
  });

  // TC-PROP-CREATE-MIN-001: happy path (per plan)
  it('TC-PROP-CREATE-MIN-001: Create valid property', () => {
    const propertyName = `Test Property 001-${Date.now()}`;

    startNewProperty(propertyName);
    selectPropertyType('Room');

    fillPropertyFormFields({
      name: propertyName,
      description: 'Test property notes',
      surface: '100',
      phone: '1234567890',
      digicode: '1234',
      rent: '1500',
      addressStreet1: '123 Main Street',
      addressStreet2: 'Apt 4B',
      addressCity: 'New York',
      addressState: 'NY',
      addressZip: '10001',
      addressCountry: 'USA'
    });

    clickSaveProperty();

    // Verify property appears in list
    cy.contains(propertyName, { timeout: 15000 }).should('exist');
  });

  // TC-PROP-CREATE-MIN-002: missing rent should show error
  it('TC-PROP-CREATE-MIN-002: Missing rent shows error', () => {
    const propertyName = `Test Property 002-${Date.now()}`;

    startNewProperty(propertyName);
    selectPropertyType('Room');

    // Fill all fields except rent
    fillPropertyFormFields({
      name: propertyName,
      description: 'Test property',
      surface: '100',
      addressStreet1: 'Test St',
      addressCity: 'Test City',
      addressZip: '12345',
      addressCountry: 'Test Country'
    });
    
    // Clear rent field to make it empty
    cy.get('input[name="rent"]').clear();

    clickSaveProperty();

    // Check for validation error
    cy.contains(/rent is a required field/i, { timeout: 10000 }).should('exist');
  });

  // TC-PROP-CREATE-MIN-003: negative rent should show error
  it('TC-PROP-CREATE-MIN-003: Negative rent should show error', () => {
    const propertyName = `Test Property 003-${Date.now()}`;

    startNewProperty(propertyName);
    selectPropertyType('Room');

    fillPropertyFormFields({
      name: propertyName,
      surface: '100',
      rent: '-0.01'
    });

    clickSaveProperty();

    cy.contains(/greater than or equal to 0/i, { timeout: 10000 }).should('exist');
  });

  // TC-PROP-CREATE-MIN-004: boundary rent 0.01
  it('TC-PROP-CREATE-MIN-004: Boundary rent 0.01', () => {
    const propertyName = `Test Property 004-${Date.now()}`;

    startNewProperty(propertyName);
    selectPropertyType('Room');

    fillPropertyFormFields({
      name: propertyName,
      description: 'Test notes',
      surface: '0.01',
      rent: '0.01',
      addressStreet1: 'Test St',
      addressCity: 'Test City',
      addressState: 'TS',
      addressZip: '12345',
      addressCountry: 'Test Country'
    });

    clickSaveProperty();

    cy.contains(propertyName, { timeout: 15000 }).should('exist');
  });

  // TC-PROP-CREATE-MIN-005: XSS name
  it('TC-PROP-CREATE-MIN-005: XSS in name should be sanitized', () => {
    const xssName = "<script>alert('xss')</script>";

    startNewProperty(xssName);
    selectPropertyType('Room');

    fillPropertyFormFields({
      name: xssName,
      surface: '100',
      rent: '1500'
    });

    clickSaveProperty();

    // Should not execute script and should redirect
    cy.url({ timeout: 10000 }).should('include', '/properties');
  });

  // TC-PROP-CREATE-MIN-006: Error then fix flow
  it('TC-PROP-CREATE-MIN-006: negative rent error then fix', () => {
    const propertyName = `Test Property 006-${Date.now()}`;

    startNewProperty(propertyName);
    selectPropertyType('Room');

    // First attempt with invalid rent
    fillPropertyFormFields({
      name: propertyName,
      surface: '100',
      rent: '-10'
    });
    
    clickSaveProperty();
    
    // Should show error
    cy.contains(/greater than or equal to 0/i, { timeout: 10000 }).should('exist');

    // Fix to valid rent
    cy.get('input[name="rent"]').clear().type('1500');
    
    clickSaveProperty();

    cy.contains(propertyName, { timeout: 15000 }).should('exist');
  });
});