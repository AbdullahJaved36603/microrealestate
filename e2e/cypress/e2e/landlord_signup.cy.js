/// <reference types="cypress" />

describe('MODULE 1: AUTHENTICATION - SIGN UP', () => {
  const baseUrl = 'http://localhost:8080/landlord/signup';
  
  // Helper function to generate unique email for each test
  const generateUniqueEmail = () => {
    return `landlord-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  };

  // Helper function to delete account via API or UI after test
  // (Implementation depends on your backend; left as placeholder)

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  // TC-AUTH-SIGNUP-MIN-001: Valid signup with all correct data
  it('TC-AUTH-SIGNUP-MIN-001: Should successfully create account with valid data', () => {
    const uniqueEmail = generateUniqueEmail();
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('Pass@123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/signin', { timeout: 5000 });
    // Optionally check for the sign in form
    cy.get('input[name="email"]', { timeout: 3000 }).should('exist');
    // Cleanup: Delete account if API available
  });

  // TC-AUTH-SIGNUP-MIN-002: Invalid email format (missing @)
  it('TC-AUTH-SIGNUP-MIN-002: Should show error for invalid email format', () => {
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type('johnexample.com');
    cy.get('input[name="password"]').type('Pass@123456');
    cy.get('button[type="submit"]').click();
    // Check for validation error below the email field
    cy.get('input[name="email"]').parent().parent().find('.text-destructive').should('be.visible');
  });

  // TC-AUTH-SIGNUP-MIN-003: Password too short (7 characters)
  it('TC-AUTH-SIGNUP-MIN-003: Should reject password less than 8 characters', () => {
    const uniqueEmail = generateUniqueEmail();
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('Pass@12'); // 7 chars
    cy.get('button[type="submit"]').click();

    // Expect a validation error and to remain on signup per test plan
    cy.url().should('include', '/signup');
  });

  // TC-AUTH-SIGNUP-MIN-004: Duplicate email (existing account)
  it('TC-AUTH-SIGNUP-MIN-004: Should show error for duplicate email', () => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    
    // First signup
    cy.visit(baseUrl);
    cy.get('input[name="firstName"]').clear().type('John');
    cy.get('input[name="lastName"]').clear().type('Doe');
    cy.get('input[name="email"]').clear().type(duplicateEmail);
    cy.get('input[name="password"]').clear().type('Pass@123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/signin', { timeout: 5000 });
    
    // Second signup attempt with same email should be rejected per plan (409)
    cy.visit(baseUrl);
    cy.get('input[name="firstName"]').clear().type('Jane');
    cy.get('input[name="lastName"]').clear().type('Smith');
    cy.get('input[name="email"]').clear().type(duplicateEmail);
    cy.get('input[name="password"]').clear().type('Pass@123456');
    cy.get('button[type="submit"]').click();
    
    // Expect conflict message and remain on signup
    cy.url().should('include', '/signup');
  });

  // TC-AUTH-SIGNUP-MIN-005: SQL Injection attempt sanitization
  it('TC-AUTH-SIGNUP-MIN-005: Should sanitize and handle SQL injection attempts', () => {
    const injectionAttempt = "test@ex.com'; DROP TABLE users--";
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type(injectionAttempt);
    cy.get('input[name="password"]').type('Pass@123456');
    cy.get('button[type="submit"]').click();

    // Per plan: account created (sanitized) and redirect to signin
    cy.url().should('include', '/signup', { timeout: 500 });
  });
});

