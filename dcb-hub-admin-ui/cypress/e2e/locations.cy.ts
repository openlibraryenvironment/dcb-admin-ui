import { basicUser } from "../users/basic_user";
import hexToRgb from "../utils/hex-to-rgb";
describe("Locations page", () => {
	beforeEach(() => {
		cy.login(basicUser);
		cy.visit("http://localhost:3000/locations");
		cy.intercept("POST", "/graphql", { fixture: "locations.json" }).as(
			"loadLocations",
		);
	});
	it("should render the locations page with the correct data and UI elements", () => {
		// A test example of checking colours in Cypress
		const yourColor = hexToRgb("#0C4068");
		cy.get("[id=page-title]")
			.should("have.text", "Locations")
			.should("have.css", "color", yourColor);
		cy.get("[data-id=01cd1cd7-7c67-5ca3-b0f4-4d709792a804]").should(
			"contain",
			"Concordia Seminary",
		);
	});

	it("should search for a location and return the expected result", () => {
		// Conduct an example search, and verify the result is as we expect
		cy.get("[aria-label=Search]").type("Paradise Street");
		// 'PS' is the location code for the Paradise Street location - see locations.json
		// This is verifying that not only does the location have the name we expect,
		// but that it also has all of thethe other data we would expect it to have.
		cy.get("[data-id=7250910d-1b73-59ac-8482-8b53d0eb12b8]").should(
			"contain",
			"ps",
		);
	});
	afterEach(() => {
		cy.logout();
	});
});
