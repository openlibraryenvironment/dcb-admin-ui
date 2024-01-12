export {}

describe('HostLMSs page', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/hostlmss')
        cy.get('.button').click()
        cy.origin('https://keycloak.sph.k-int.com', () => {
          cy.get('[id=username]').type(Cypress.env("CYPRESS_USER"))
          cy.get('[id=password]').type(Cypress.env("CYPRESS_PW"));
          cy.get('[id=kc-login]').click();
        })
        cy.visit('http://localhost:3000/hostlmss')
        cy.intercept('POST', '/graphql', { fixture: 'hostlmss.json'}).as('fetchHostlmss')
    })    
    it('should render the Host LMS page with the correct data and UI elements', () => {
      cy.get('[id=page-title]').should('have.text', 'Host LMSs');
      // contain can be used for any of the items visible on that row.
      cy.get('[data-id=eb745468-c69c-5f7e-9bd4-cf3cf8db6cd9]').should('contain', 'COOLCAT');
    })

    it('should search for a Host LMS and return the expected result', () => {
        // Search
        // Having to use aria-label because MUI Data Grid doesn't expose data-tids
        cy.get('[aria-label=Search]').type('Test HostLMS');
        cy.get('[data-id=kfe60600-0879-5ec5-8831-ae524b11639c]').should('contain', 'TESTLMS')
        // Can test multiple search variations here
        //As well as sort and filter when we can get to their unique ids
    })
  })