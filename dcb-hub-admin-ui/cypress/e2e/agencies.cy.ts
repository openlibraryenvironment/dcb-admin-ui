export {}
 // see https://github.com/vercel/next.js/issues/38957 
 // for why we have to do either an export or an import at the start of all tests - otherwise TS build fails

describe('Agencies page', () => {
    beforeEach(() => {
      // This exists to essentially log us in and navigate to the correct page before each test
      // Should be re-factored into a cy.login commmand in future work.
        cy.visit('http://localhost:3000/agencies')
        cy.get('.button').click()
        cy.origin('https://keycloak.sph.k-int.com', () => {
          cy.get('[id=username]').type(Cypress.env("CYPRESS_USER"))
          cy.get('[id=password]').type(Cypress.env("CYPRESS_PW"));
          cy.get('[id=kc-login]').click();
        })
        // Cypress doesn't redirect back to agencies like the normal login process does, so we have to do it.
        cy.visit('http://localhost:3000/agencies')
        cy.intercept('POST', '/graphql', { fixture: 'agencies.json'}).as('getAgencies');

    })    
    it('should render the agencies page with the correct data and UI elements.', () => {
      // This intercepts the request sent to the DCB server for agencies data
      // and mocks the GraphQL 'agencies' response from DCB. https://docs.cypress.io/api/commands/intercept 
      // The fixture agencies.json is used to stub the response https://docs.cypress.io/api/commands/fixture
      // cy.get is a way of getting a page element by its id https://docs.cypress.io/guides/end-to-end-testing/writing-your-first-end-to-end-test#Adding-more-commands-and-assertions
      // And .should creates an assertion - see documentation for the many, many ways of using this https://docs.cypress.io/api/commands/should
      cy.get('[id=page-title]').should('have.text', 'Agencies');
      cy.get('[data-tid=add-agencies-to-group]').should('exist');
      // We use 'contain' to get data from the DataGrid rows.
      cy.get('[data-id=dd51ff90-55ae-5225-be90-fa82c1f0f0ff]').should('contain', 'The Great Test University');
    })
    // it('should add an agency to a group', () => {
    //     // This will be re-worked to use a stubbed response.
    //     cy.get('[data-tid=add-agencies-to-group]').click();
    //     cy.get('[data-tid=add-agency-title]').should('have.text', ' Add agencies to a group');
    //     cy.get('[data-tid=add-agency-groupid]').type('eeeb1526-52ca-5826-8ae7-e63e43aa6909');
    //     cy.get('[data-tid=add-agency-agencyid]').type('dd51ff90-55ae-5225-be90-fa82c1f0f0ff');
    //     cy.wait(1);
    //     cy.get('[data-tid=add-agency-submit]').click();
    // })
    it('should search for an agency and return the expected result', () => {
        cy.get('[aria-label=Search]').type('Benedictine College');
        cy.get('[data-id=d74636f3-3ab5-5325-922e-a46e20fe52e7]').should('contain', 'Benedictine College')
    })
  })