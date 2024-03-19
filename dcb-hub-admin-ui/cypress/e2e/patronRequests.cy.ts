import { basicUser } from "../users/basic_user"
describe('Patron requests page', () => {
    beforeEach(() => {
        cy.login(basicUser)
        cy.visit('http://localhost:3000/patronRequests')
        cy.intercept('POST', '/graphql', { fixture: 'patronRequests.json'}).as('loadRequests')
    })    
    it('should render the Patron requests page with the correct data', () => {
      // We can add more requests to the patronRequests fixture if we want to test sorting, filtering etc.
      cy.get('[id=page-title]').should('have.text', 'Patron requests');
      cy.get('[data-id=jb3b9a22-2ab3-4118-ae81-61932265777e]').should('contain', 'Another test request strikes again!');
    })

    it('should search for a given request by title, and display the expected result', () => {
        // Searches for an example request, verifies that the expected request is found.
        cy.get('[aria-label=Search]').type('Return of the test request');
        cy.get('[data-id=zi3b9a22-2ab3-4118-ae81-61932265777e').should('contain', 'Return of the test request')
    })
    afterEach(() => {
      cy.logout();
    })
  })
