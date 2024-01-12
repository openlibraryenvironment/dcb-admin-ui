export {}
describe('Locations page', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/locations')
        cy.get('.button').click()
        cy.origin('https://keycloak.sph.k-int.com', () => {
          cy.get('[id=username]').type(Cypress.env("CYPRESS_USER"))
          cy.get('[id=password]').type(Cypress.env("CYPRESS_PW"));
          cy.get('[id=kc-login]').click();
        })
        cy.visit('http://localhost:3000/locations')
        cy.intercept('POST', '/graphql', { fixture: 'locations.json'}).as('loadLocations')


    })    
    it('should render the locations page with the correct data and UI elements', () => {
      cy.get('[id=page-title]').should('have.text', 'Locations');
      cy.get('[data-id=01cd1cd7-7c67-5ca3-b0f4-4d709792a804]').should('contain', 'Concordia Seminary');
    })

    it('should search for a location and return the expected result', () => {
        // Search
        cy.get('[aria-label=Search]').type('Paradise Street');
        cy.get('[data-id=7250910d-1b73-59ac-8482-8b53d0eb12b8]').should('contain', 'ps')
        // Can test multiple search variations here
        //As well as sort and filter when we can get to their unique ids
    })
  })