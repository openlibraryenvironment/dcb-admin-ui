import { basicUser } from "../users/basic_user";
describe("Groups page", () => {
	beforeEach(() => {
		cy.login(basicUser);
		cy.visit("http://localhost:3000/groups");
		cy.intercept("POST", "/graphql", { fixture: "groups.json" }).as(
			"initialLoadGroups",
		);

		// This is for catching different GraphQL queries and aliasing them.
		// It is designed for more complex use cases and is a useful pattern to follow in future testing.
		// https://docs.cypress.io/guides/end-to-end-testing/working-with-graphql
		// cy.intercept('POST', '/graphql', (req) => {
		//     // Queries
		//     aliasQuery(req, 'FindGroups')
		//     // Mutations
		//     aliasMutation(req, 'CreateAgencyGroup')
		//   })
	});
	it("should render the groups page with the correct data and UI elements.", () => {
		// cy.intercept('POST', '/graphql', { fixture: 'groups.json'})
		cy.get("[id=page-title]").should("have.text", "Groups");
		cy.get("[data-id=c23df3ab-77c0-5689-b56d-fc8a2d6a5f22]").should(
			"contain",
			"Cathedral",
		);
	});
	it("should open the new group modal, add a new group, and have it display in the grid", () => {
		// Intercept the initial request to load the groups, and supply the fixture.
		// Create a new group
		cy.get("[data-tid=new-group-button]").click();
		cy.get("[data-tid=new-group-title]").should("have.text", " New Group");
		cy.get("[data-tid=new-group-name").type("Hunter's Bar");
		cy.get("[data-tid=new-group-code").type("HUNTR");
		cy.get("[data-tid=new-group-submit").click();
		cy.wait(["@initialLoadGroups"]); // Wait for the request to be made
		cy.visit("http://localhost:3000/groups"); // Reload the page to fetch the new groups - not necessary normally but forces Cypress to update the fixture.
		cy.intercept("POST", "/graphql", { fixture: "updated-groups.json" }).as(
			"updatedGroups",
		); // Intercept the request for updated groups, load the updated list fixture
		cy.wait("@updatedGroups"); // Wait for the groups update to complete
		cy.get("[data-id=4196d9f7-da46-58df-9a1f-2930c37f19b8]").should(
			"contain",
			"Hunter's Bar",
		); // And check the grid has updated with the new group
	});

	it("should search for a group and return the expected result", () => {
		// Sort and filter to be added in future work.
		cy.intercept("POST", "/graphql", { fixture: "groups.json" });
		// Search
		cy.get("[aria-label=Search]").type("Ecclesfield");
		cy.get("[data-id=47fbcee4-2fb6-51d3-9e7e-f0bc1c7efa57]").should(
			"contain",
			"ECCLF",
		);
	});
	afterEach(() => {
		cy.logout();
	});
});
