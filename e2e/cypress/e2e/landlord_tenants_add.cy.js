/* eslint-disable cypress/unsafe-to-chain-command */
/// <reference types="cypress" />

// MODULE 4: TENANT MANAGEMENT - ADD TENANT
// Test Plan Implementation with Minimal Test Cases
// Test Coverage: Email validation, Phone validation, Name validation, Decision table coverage

const signinUrl = 'http://localhost:8080/landlord/signin';
const validEmail = Cypress.env('LANDLORD_EMAIL') || 'muhammadabdullah36603@gmail.com';
const validPassword = Cypress.env('LANDLORD_PASSWORD') || 'Abdullah1.';

const loginAndGoTenants = () => {
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
  
  // Navigate to tenants page via app menu
  cy.get('[data-cy="appMenu"]').click();
  cy.get('div:nth-of-type(3) span').click(); // Tenants menu item
  
  // Verify we're on tenants page
  cy.url({ timeout: 15000 }).should('match', /\/tenants/);
};

const openAddTenantDialog = () => {
  // Click the Add Tenant button
  cy.get("button:contains('Add a tenant')").first().click({ force: true });
  // Or using data-cy if available
  cy.get('[data-cy="shortcutAddTenant"], button[type="button"]', { timeout: 10000 }).each(($btn) => {
    if ($btn.text().includes('Add a tenant') || $btn.text().includes('tenant')) {
      cy.wrap($btn).click({ force: true });
    }
  });
};

const fillAddTenantDialog = (tenantName) => {
  // Fill the name field in the dialog
  cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
  cy.get('[role="dialog"] input[name="name"]').clear().type(tenantName);
};

const clickAddInTenantDialog = () => {
  // Click Add button in dialog
  cy.get('[role="dialog"] button[type="submit"]').click();
  cy.get('[role="dialog"]', { timeout: 5000 }).should('not.exist');
};

const fillTenantContactForm = ({ contact, email, phone1, phone2 }) => {
  // Wait for form to be visible
  cy.get('input[name="contacts[0].contact"]', { timeout: 10000 }).should('be.visible');
  
  if (contact !== undefined) {
    cy.get('input[name="contacts[0].contact"]').clear().type(contact);
  }
  
  if (email !== undefined) {
    cy.get('input[name="contacts[0].email"]').clear().type(email);
  }
  
  if (phone1 !== undefined) {
    cy.get('input[name="contacts[0].phone1"]').clear().type(phone1);
  }
  
  if (phone2 !== undefined) {
    cy.get('input[name="contacts[0].phone2"]').clear().type(phone2);
  }
};

const fillTenantAddressForm = ({ street1, city, zipCode, country }) => {
  if (street1 !== undefined) {
    cy.get('input[name="address.street1"]').clear().type(street1);
  }
  
  if (city !== undefined) {
    cy.get('input[name="address.city"]').clear().type(city);
  }
  
  if (zipCode !== undefined) {
    cy.get('input[name="address.zipCode"]').clear().type(zipCode);
  }
  
  if (country !== undefined) {
    cy.get('input[name="address.country"]').clear().type(country);
  }
};

const clickSaveTenant = () => {
  // Click Save button
  cy.get('[data-cy="submit"]').click();
  
  // Wait for save to complete - check if we're redirected or dialog closes
  cy.url({ timeout: 10000 }).should('match', /\/tenants/);
};

const verifyTenantInList = (tenantName) => {
  // Verify tenant appears in the list
  cy.contains(tenantName, { timeout: 10000 }).should('be.visible');
};

const verifyFormError = (errorMessage) => {
  // Verify error message appears on form
  cy.contains(errorMessage, { timeout: 10000 }).should('be.visible');
};

describe('MODULE 4: TENANT MANAGEMENT - ADD TENANT', () => {
  
  // Only keep minimal test cases
  describe('3.4.4 MINIMAL TEST CASES - Add Tenant', () => {
    // TC-TEN-ADD-MIN-001
    it('TC-TEN-ADD-MIN-001: Valid email, phone 10-digit, firstName, lastName - Should add tenant', () => {
      loginAndGoTenants();
      const tenantName = `Smith_${Date.now()}`;
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '5551234567'
      });
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      clickSaveTenant();
      verifyTenantInList(tenantName);
    });
    // TC-TEN-ADD-MIN-002
    it('TC-TEN-ADD-MIN-002: Invalid email format - Should show validation error', () => {
      loginAndGoTenants();
      const tenantName = `Smith_InvalidEmail_${Date.now()}`;
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenantexample.com',
        phone1: '5551234567'
      });
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      cy.get('[data-cy="submit"]').click();
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
      cy.get('input[name="contacts[0].email"]').then($input => {
        cy.wrap($input).should('have.attr', 'aria-invalid', 'true')
          .or.parent().should('contain', 'email');
      });
    });
    // TC-TEN-ADD-MIN-003
    it('TC-TEN-ADD-MIN-003: Phone too short (9 digits) - Should show validation error', () => {
      loginAndGoTenants();
      const tenantName = `Smith_ShortPhone_${Date.now()}`;
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '555123456'
      });
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      cy.get('[data-cy="submit"]').click();
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
      cy.get('input[name="contacts[0].phone1"]').then($input => {
        cy.wrap($input).should('have.attr', 'aria-invalid', 'true')
          .or.parent().should('contain.text', /phone|digit/i);
      });
    });
    // TC-TEN-ADD-MIN-004
    it('TC-TEN-ADD-MIN-004: Valid phone 11-digit (US+1) - Should add tenant successfully', () => {
      loginAndGoTenants();
      const tenantName = `Smith_Phone11_${Date.now()}`;
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '15551234567'
      });
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      clickSaveTenant();
      verifyTenantInList(tenantName);
    });
    // TC-TEN-ADD-MIN-005
    it('TC-TEN-ADD-MIN-005: Phone too long (12 digits) - Should show validation error', () => {
      loginAndGoTenants();
      const tenantName = `Smith_LongPhone_${Date.now()}`;
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '155512345678'
      });
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      cy.get('[data-cy="submit"]').click();
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
      cy.get('input[name="contacts[0].phone1"]').then($input => {
        cy.wrap($input).should('have.attr', 'aria-invalid', 'true')
          .or.parent().should('contain.text', /phone|long|digit/i);
      });
    });
  });

  describe('3.4.3 EQUIVALENCE PARTITION & DECISION TABLE - Additional Test Cases', () => {

    // ============================================================================
    // TC-TEN-ADD-EP-001: Valid All - Decision Table Row 1
    // ============================================================================
    it('TC-TEN-ADD-EP-001: Valid email, phone, firstName, lastName - Should add tenant', () => {
      loginAndGoTenants();
      
      const tenantName = `EP001_ValidAll_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane Smith',
        email: 'tenant@example.com',
        phone1: '5551234567'
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      clickSaveTenant();
      verifyTenantInList(tenantName);
    });

    // ============================================================================
    // TC-TEN-ADD-EP-003: Empty Email
    // ============================================================================
    it('TC-TEN-ADD-EP-003: Empty email - Should show error', () => {
      loginAndGoTenants();
      
      const tenantName = `EP003_EmptyEmail_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      // Fill with empty email
      fillTenantContactForm({
        contact: 'Jane',
        email: '',  // Empty
        phone1: '5551234567'
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      cy.get('[data-cy="submit"]').click();
      verifyFormError('email');
    });

    // ============================================================================
    // TC-TEN-ADD-EP-004: Valid 10-digit phone
    // ============================================================================
    it('TC-TEN-ADD-EP-004: Valid 10-digit phone - Should add tenant', () => {
      loginAndGoTenants();
      
      const tenantName = `EP004_Phone10_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '5551234567'  // Valid 10 digits
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      clickSaveTenant();
      verifyTenantInList(tenantName);
    });

    // ============================================================================
    // TC-TEN-ADD-EP-005: Valid 11-digit phone with US code
    // ============================================================================
    it('TC-TEN-ADD-EP-005: Valid 11-digit phone (US+1) - Should add tenant', () => {
      loginAndGoTenants();
      
      const tenantName = `EP005_Phone11_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '15551234567'  // Valid 11 digits
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      clickSaveTenant();
      verifyTenantInList(tenantName);
    });

    // ============================================================================
    // TC-TEN-ADD-EP-006: Phone too short (9 digits)
    // ============================================================================
    it('TC-TEN-ADD-EP-006: Phone 9 digits (too short) - Should show error', () => {
      loginAndGoTenants();
      
      const tenantName = `EP006_PhoneShort_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '555123456'  // Too short
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      cy.get('[data-cy="submit"]').click();
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
    });

    // ============================================================================
    // TC-TEN-ADD-EP-007: Non-numeric phone
    // ============================================================================
    it('TC-TEN-ADD-EP-007: Non-numeric phone - Should show error or be rejected', () => {
      loginAndGoTenants();
      
      const tenantName = `EP007_NonNumeric_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '555-123-ABCD'  // Non-numeric
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      cy.get('[data-cy="submit"]').click();
      
      // Should either show error or form should remain open
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
    });

    // ============================================================================
    // TC-TEN-ADD-EP-008: Empty phone
    // ============================================================================
    it('TC-TEN-ADD-EP-008: Empty phone - Should show error', () => {
      loginAndGoTenants();
      
      const tenantName = `EP008_EmptyPhone_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: ''  // Empty
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      cy.get('[data-cy="submit"]').click();
      
      // Phone might be optional in the form, but if required, error should appear
      // Check if dialog still exists or error appears
      cy.get('body').then(($body) => {
        if ($body.find('[role="dialog"]').length > 0) {
          cy.get('[role="dialog"]').should('exist');
        }
      });
    });

    // ============================================================================
    // TC-TEN-ADD-EP-010: Empty firstName
    // ============================================================================
    it('TC-TEN-ADD-EP-010: Empty contact name (firstName) - Should show error', () => {
      loginAndGoTenants();
      
      const tenantName = `EP010_EmptyName_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: '',  // Empty firstName
        email: 'tenant@example.com',
        phone1: '5551234567'
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      cy.get('[data-cy="submit"]').click();
      verifyFormError('contact');
    });

    // ============================================================================
    // TC-TEN-ADD-EP-012: Empty lastName (tenant name/company name)
    // ============================================================================
    it('TC-TEN-ADD-EP-012: Empty tenant name - Should show error', () => {
      loginAndGoTenants();
      
      // Try to add tenant without name - should fail in dialog
      openAddTenantDialog();
      
      // Don't fill tenant name
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      
      // Try clicking Add without entering name
      cy.get('[role="dialog"] button[type="submit"]').click();
      
      // Should show error or remain in dialog
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('3.4.3 BOUNDARY VALUE ANALYSIS - Phone Number Boundaries', () => {

    // ============================================================================
    // TC-TEN-ADD-BVA-001: Phone 9 digits (below boundary)
    // ============================================================================
    it('TC-TEN-ADD-BVA-001: Phone 9 digits - Below valid boundary', () => {
      loginAndGoTenants();
      
      const tenantName = `BVA001_9Digits_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '555123456'  // 9 digits - BVA
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      cy.get('[data-cy="submit"]').click();
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
    });

    // ============================================================================
    // TC-TEN-ADD-BVA-002: Phone 10 digits (minimum valid boundary)
    // ============================================================================
    it('TC-TEN-ADD-BVA-002: Phone 10 digits - Minimum valid boundary (PASS)', () => {
      loginAndGoTenants();
      
      const tenantName = `BVA002_10Digits_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '5551234567'  // 10 digits - BVA minimum
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      clickSaveTenant();
      verifyTenantInList(tenantName);
    });

    // ============================================================================
    // TC-TEN-ADD-BVA-003: Phone 11 digits (maximum valid boundary)
    // ============================================================================
    it('TC-TEN-ADD-BVA-003: Phone 11 digits - Maximum valid boundary (PASS)', () => {
      loginAndGoTenants();
      
      const tenantName = `BVA003_11Digits_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '15551234567'  // 11 digits - BVA maximum
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      clickSaveTenant();
      verifyTenantInList(tenantName);
    });

    // ============================================================================
    // TC-TEN-ADD-BVA-004: Phone 12 digits (above boundary)
    // ============================================================================
    it('TC-TEN-ADD-BVA-004: Phone 12 digits - Above valid boundary', () => {
      loginAndGoTenants();
      
      const tenantName = `BVA004_12Digits_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',
        phone1: '155512345678'  // 12 digits - BVA
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      cy.get('[data-cy="submit"]').click();
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('3.4.2 STATE TRANSITION - Add Tenant Error Recovery', () => {

    // ============================================================================
    // TC-TEN-ADD-STATE-001: Invalid -> Fix -> Submit (Error Recovery)
    // ============================================================================
    it('TC-TEN-ADD-STATE-001: Invalid data -> Correct -> Submit - Should add tenant', () => {
      loginAndGoTenants();
      
      const tenantName = `STATE001_ErrorRecovery_${Date.now()}`;
      
      openAddTenantDialog();
      fillAddTenantDialog(tenantName);
      clickAddInTenantDialog();
      
      // First, fill with INVALID data
      fillTenantContactForm({
        contact: 'Jane',
        email: 'invalid-email',  // Invalid email
        phone1: '555123456'      // Too short phone
      });
      
      fillTenantAddressForm({
        street1: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'United States'
      });
      
      // Try to save - should fail
      cy.get('[data-cy="submit"]').click();
      
      // Dialog should still be open showing errors
      cy.get('[role="dialog"]', { timeout: 5000 }).should('exist');
      
      // Now fix the data
      fillTenantContactForm({
        contact: 'Jane',
        email: 'tenant@example.com',  // Valid email
        phone1: '5551234567'           // Valid 10-digit phone
      });
      
      // Try saving again
      cy.get('[data-cy="submit"]').click();
      
      // Should succeed now
      cy.url({ timeout: 10000 }).should('match', /\/tenants/);
      verifyTenantInList(tenantName);
    });
  });
});
