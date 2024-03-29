import { basicUser } from "../users/basic_user";
// see https://github.com/vercel/next.js/issues/38957 for why we have to do this at the start of all tests
describe("Source bibs page", () => {
	beforeEach(() => {
		cy.login(basicUser);
		cy.visit("http://localhost:3000/bibs");
		cy.intercept("POST", "/graphql", { fixture: "sourceBibs.json" }).as(
			"loadBibs",
		);
	});
	it("should render the bib records page with the correct data", () => {
		// Expected data comes from the fixture above - we're checking that the grid is displaying it correctly.
		cy.get("[id=page-title]").should("have.text", "Bib records");
		cy.get("[data-id=84b52f96-8fa1-53ca-9600-66b7619dd105]").should(
			"contain",
			"Swamp Thing by Brian K. Vaughan",
		);
	});

	it("should search bib records by different values, and apply multiple filters based on Boolean logic, returning the expected result", () => {
		// To make this a live test of searching, move the cy.intercept out of 'beforeEach' and into the test above.
		// Enter test data into the search bar and verify the results
		cy.get("[aria-label=Search]").type("sourceRecordId:843");
		cy.get("[data-id=80bf9c74-a5ae-56c9-8cfe-814220ee38a5]").should(
			"contain",
			"Paper towns John Green.",
		);
		// Test clearing the input, and applying multiple filters through the search bar.
		cy.get("[aria-label=Clear]").click();
		cy.get("[aria-label=Search]").type(
			"sourceRecordId:843 AND id:80bf9c74-a5ae-56c9-8cfe-814220ee38a5",
		);
		// Verify the results.
		cy.get("[data-id=80bf9c74-a5ae-56c9-8cfe-814220ee38a5]").should(
			"contain",
			"Paper towns John Green.",
		);
	});
	afterEach(() => {
		cy.logout();
	});
});
