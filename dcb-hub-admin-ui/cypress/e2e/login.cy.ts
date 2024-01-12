export {}
describe('navigation through DCB Admin', () => {
it('should login, verify UI elements are being displayed, and then log out', () => {
  // Tests logging in
    cy.visit('http://localhost:3000/requests')
    cy.get('.button').click()
    cy.origin('https://keycloak.sph.k-int.com', () => {
      cy.get('[id=username]').type(Cypress.env("CYPRESS_USER"))
      cy.get('[id=password]').type(Cypress.env("CYPRESS_PW"));
      cy.get('[id=kc-login]').click();
    })
    // Visits a few pages
    cy.visit('http://localhost:3000/agencies')
    cy.visit('http://localhost:3000/requests')
    cy.visit('http://localhost:3000/hostlmss')
    cy.visit('http://localhost:3000/groups')
    cy.visit('http://localhost:3000/sourceBibs')
    cy.visit('http://localhost:3000/locations')
    // Verifies key UI elements exist and are being correctly rendered.
    cy.get('[data-tid=sidebar-menu]').should('exist');
    cy.get('[data-tid=login-button]').should('exist');
    cy.get('[data-tid=profile-button]').should('exist');
    cy.get('[data-tid=header-title]').should('have.text', 'DCB Admin');
    cy.get('[data-tid=footer-information]').should('exist');
    // Logs out of DCB Admin, and checks that the login button text has changed
    cy.get('[data-tid=login-button]').should('have.text', 'Logout').click();
    cy.get('[data-tid=login-button]').should('have.text', 'Login'); 
  })
})
