// Cypress test for MODULE 6: FIRST ACCESS (Landlord Profile Setup)
// Minimal test cases from 3.6.4 MINIMAL TEST CASE TABLE

// Test data
const personalData = {
  name: 'John Props',
  locale: 'en',
  currency: 'USD',
  isCompany: 'false'
};
const companyData = {
  name: 'John Props',
  locale: 'en',
  currency: 'USD',
  isCompany: 'true',
  legalRepresentative: 'Jane Doe',
  legalStructure: 'llc',
  company: 'ABC Inc',
  ein: '12-3456789',
  capital: 50000
};

const makeUser = (suffix) => ({
  firstName: 'John',
  lastName: `Props-${suffix}`,
  email: `john.props+${suffix}.${Date.now()}@example.com`,
  password: 'Passw0rd!'
});

const goToFirstAccess = (user) => {
  cy.signUp(user);
  cy.checkUrl('/signin');
  cy.signIn(user);
  cy.checkUrl('/firstaccess');
  cy.get('[data-cy="firstaccessPage"]').should('exist');
};

describe('First Access (Landlord Profile Setup)', () => {
  beforeEach(() => {
    // Each test uses a fresh account to avoid existing org redirecting to dashboard
  });

  it('TC-FIRST-MIN-001: Personal valid setup, redirect to dashboard', () => {
    const user = makeUser('personal');
    goToFirstAccess(user);
    cy.get('input[name="name"]').type(personalData.name);
    cy.get('select[name="locale"]').select(personalData.locale);
    cy.get('select[name="currency"]').select(personalData.currency);
    cy.get('[data-cy="companyFalse"]').click();
    cy.get('form').submit();
    cy.url().should('include', '/dashboard');
  });

  it('TC-FIRST-MIN-002: Company valid setup, redirect to dashboard', () => {
    const user = makeUser('company-valid');
    goToFirstAccess(user);
    cy.get('input[name="name"]').type(companyData.name);
    cy.get('select[name="locale"]').select(companyData.locale);
    cy.get('select[name="currency"]').select(companyData.currency);
    cy.get('[data-cy="companyTrue"]').click();
    cy.get('input[name="legalRepresentative"]').type(companyData.legalRepresentative);
    cy.get('input[name="legalStructure"]').type(companyData.legalStructure);
    cy.get('input[name="company"]').type(companyData.company);
    cy.get('input[name="ein"]').type(companyData.ein);
    cy.get('input[name="capital"]').type(companyData.capital.toString());
    cy.get('form').submit();
    cy.url().should('include', '/dashboard');
  });

  it('TC-FIRST-MIN-003: Company, EIN 10 chars, invalid format', () => {
    const user = makeUser('company-ein10');
    goToFirstAccess(user);
    cy.get('input[name="name"]').type(companyData.name);
    cy.get('select[name="locale"]').select(companyData.locale);
    cy.get('select[name="currency"]').select(companyData.currency);
    cy.get('[data-cy="companyTrue"]').click();
    cy.get('input[name="legalRepresentative"]').type(companyData.legalRepresentative);
    cy.get('input[name="legalStructure"]').type(companyData.legalStructure);
    cy.get('input[name="company"]').type(companyData.company);
    cy.get('input[name="ein"]').type('12-34567');
    cy.get('input[name="capital"]').type(companyData.capital.toString());
    cy.get('form').submit();
    cy.contains('Invalid EIN format').should('exist');
  });

  it('TC-FIRST-MIN-004: Company, EIN 12 chars, invalid format', () => {
    const user = makeUser('company-ein12');
    goToFirstAccess(user);
    cy.get('input[name="name"]').type(companyData.name);
    cy.get('select[name="locale"]').select(companyData.locale);
    cy.get('select[name="currency"]').select(companyData.currency);
    cy.get('[data-cy="companyTrue"]').click();
    cy.get('input[name="legalRepresentative"]').type(companyData.legalRepresentative);
    cy.get('input[name="legalStructure"]').type(companyData.legalStructure);
    cy.get('input[name="company"]').type(companyData.company);
    cy.get('input[name="ein"]').type('12-34567890');
    cy.get('input[name="capital"]').type(companyData.capital.toString());
    cy.get('form').submit();
    cy.contains('Invalid EIN format').should('exist');
  });

  it('TC-FIRST-MIN-005: Toggle company ON, fields visible', () => {
    const user = makeUser('company-toggle');
    goToFirstAccess(user);
    cy.get('[data-cy="companyFalse"]').click();
    cy.get('[data-cy="companyTrue"]').click();
    cy.get('input[name="legalStructure"]').should('be.visible');
    cy.get('input[name="company"]').should('be.visible');
    cy.get('input[name="ein"]').should('be.visible');
    cy.get('input[name="capital"]').should('be.visible');
  });
});
