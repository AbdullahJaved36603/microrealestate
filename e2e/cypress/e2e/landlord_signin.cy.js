/* eslint-disable cypress/unsafe-to-chain-command */
/// <reference types="cypress" />

const baseUrl = 'http://localhost:8080/landlord/signin';
const validEmail = Cypress.env('LANDLORD_EMAIL') || 'muhammadabdullah36603@gmail.com';
const validPassword = Cypress.env('LANDLORD_PASSWORD') || 'Abdullah1.'; // provided credentials; override with env if needed

const expectSignedInRedirect = () => {
  cy.url({ timeout: 10000 }).should((url) => {
    expect(url).to.match(/(dashboard|firstaccess)/);
  });
};

const signOutIfPossible = () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="orgMenu"]').length) {
      cy.get('[data-cy="orgMenu"]').click({ force: true });
      cy.get('[data-cy="signoutNav"]', { timeout: 10000 }).click({ force: true });
    }
  });
};

describe('MODULE 2: AUTHENTICATION - SIGN IN', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit(baseUrl);
  });

  // TC-AUTH-SIGNIN-MIN-001: Valid registered user (login success)
  it('TC-AUTH-SIGNIN-MIN-001: Should login successfully and redirect', () => {
    cy.get('input[name="email"]').clear().type(validEmail);
    cy.get('input[name="password"]').clear().type(validPassword, { log: false });
    cy.get('button[type="submit"]').click();

    expectSignedInRedirect();

    // Cleanup: sign out to reset state
    signOutIfPossible();
    cy.url({ timeout: 10000 }).should('include', '/signin');
  });

  // TC-AUTH-SIGNIN-MIN-002: Valid format but unregistered email
  it('TC-AUTH-SIGNIN-MIN-002: Should show error for valid but unregistered email', () => {
    const unknownEmail = `unknown-${Date.now()}@example.com`;
    cy.get('input[name="email"]').clear().type(unknownEmail);
    cy.get('input[name="password"]').clear().type('Pass@123456');
    cy.get('button[type="submit"]').click();

    cy.contains(/Incorrect email or password/i, { timeout: 5000 }).should('be.visible');
    cy.url().should('include', '/signin');
  });

  // TC-AUTH-SIGNIN-MIN-003: Empty email
  it('TC-AUTH-SIGNIN-MIN-003: Should show error when email is empty', () => {
    cy.get('input[name="email"]').clear();
    cy.get('input[name="password"]').clear().type('Pass@123456');
    cy.get('button[type="submit"]').click();

    cy.get('input[name="email"]').parents().find('.text-destructive').should('be.visible');
    cy.url().should('include', '/signin');
  });

  // TC-AUTH-SIGNIN-MIN-004: Logout after successful login
  it('TC-AUTH-SIGNIN-MIN-004: Should logout and redirect to signin', () => {
    cy.get('input[name="email"]').clear().type(validEmail);
    cy.get('input[name="password"]').clear().type(validPassword, { log: false });
    cy.get('button[type="submit"]').click();

    expectSignedInRedirect();

    cy.get('[data-cy="orgMenu"]', { timeout: 10000 }).click({ force: true });
    cy.get('[data-cy="signoutNav"]', { timeout: 10000 }).click({ force: true });

    cy.url({ timeout: 10000 }).should('include', '/signin');
  });
});
