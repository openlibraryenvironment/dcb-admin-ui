import { basicUser } from "../users/basic_user";
import hexToRgb from "../utils/hex-to-rgb";

describe("Sidebar behaviour", () => {
	beforeEach(() => {
		cy.login(basicUser);
		cy.visit("http://localhost:3000/");
	});

	describe("Verify all items in sidebar have been rendered (text and icons)", () => {
		// this array will need to be updated every time a new section is added to DCB Admin
		const sidebarItems = [
			"Home",
			"Patron requests",
			"Agencies",
			"Host LMSs",
			"Locations",
			"Groups",
			"Bib records",
			"Mappings",
			"Service info",
		];

		it("Check sidebar exists", () => {
			cy.get("[data-tid=sidebar]").should("contain.text", "Home");
		});

		it("Should verify all text items in the sidebar have been rendered", () => {
			sidebarItems.forEach((item) => {
				cy.get(`[data-tid="${item} button"]`).should("exist");
				cy.get(`[data-tid="${item} icon"]`).should("exist");
				cy.get(`[data-tid="${item} text"]`).should("exist");
			});
		});

		it("Should verify that the sidebar menu button has been rendered", () => {
			cy.get(`[data-tid="sidebar-menu"]`)
				.should("exist")
				.should("not.have.attr", "aria-disabled", "true");
			cy.get(`[data-tid="menu-icon"]`)
				.should("exist");
		})
	});

	describe("Verify button behaviour on current page", () => {
		it("should verify that the button is blue and text is bold", () => {
			cy.get('[data-tid="Home text"]')
				// Font is bold (400)
				.should("have.css", "font-weight", "400");
			const lightBlue = hexToRgb("#287BAF");
			cy.get('[data-tid="Home button"]').should(
				"have.css",
				"background-color",
				lightBlue,
			);
		});

		it("Should verify the button is not a link and not clickable", () => {
			// check if button is on current page
			cy.get('[data-tid="Home button"]')
				.should("have.attr", "aria-current", "page")
				.should("have.attr", "aria-disabled", "true")
				// checks if button can become a target for pointer events (e.g. click)
				.should("have.css", "pointer-events", "none");
		});
	});

	describe("Verify button behaviour on a different page", () => {
		beforeEach(() => {
			cy.visit("http://localhost:3000/hostlmss");
		});

		it("should verify that the button is blue and text is bold", () => {
			cy.get('[data-tid="Host LMSs text"]').should(
				"have.css",
				"font-weight",
				"400",
			);
			const lightBlue = hexToRgb("#287BAF");
			cy.get('[data-tid="Host LMSs button"]').should(
				"have.css",
				"background-color",
				lightBlue,
			);
		});

		it("should verify the button is not a link and not clickable", () => {
			cy.get('[data-tid="Host LMSs button"]')
				.should("have.attr", "aria-current", "page")
				.should("have.attr", "aria-disabled", "true")
				.should("have.css", "pointer-events", "none");
		});
	});

	describe("Verify button behaviour on nested pages", () => {
		const lightGrey = hexToRgb("#999999");

		//go to the details page
		beforeEach(() => {
			cy.login(basicUser);
			cy.visit("http://localhost:3000/hostlmss");
			cy.intercept("POST", "/graphql", { fixture: "hostlmss.json" }).as(
				"fetchHostlmss",
			);
			cy.wait("@fetchHostlmss");

			cy.get("[id=page-title]").should("have.text", "Host LMSs");
			cy.get("[data-id=eb745468-c69c-5f7e-9bd4-cf3cf8db6cd9]")
				.should("contain", "COOLCAT")
				.click()
			cy.intercept("POST", "/graphql", {fixture: "hostlmss-details.json"}).as(
				"fetchHostlmssDetails"
			)
			cy.wait("@fetchHostlmssDetails")
		});

		it("should verify that the button is a different colour and text is bold", () => {
			cy.get('[data-tid="Host LMSs text"]').should(
				"have.css",
				"font-weight",
				"400",
			);
			cy.get('[data-tid="Host LMSs button"]').should(
				"have.css",
				"background-color",
				lightGrey,
			);
		});

		it('should verify that the button changes colour on hover in the details page', () => {
			cy.get('[data-tid="Host LMSs button"]')
				.realHover()
			cy.get('[data-tid="Host LMSs button"]')
				.should("have.css", "background-color")
				.and('not.equal', lightGrey)
		})

		it("should verify the button is a link and is clickable", () => {
			cy.get('[data-tid="Host LMSs button"]')
				.as("HostLMSsBtn")
				.should("not.have.attr", "aria-current", "page");
			cy.get("@HostLMSsBtn").should("not.have.attr", "aria-disabled", "true");
			cy.get("@HostLMSsBtn").click();
		});
	});
});
