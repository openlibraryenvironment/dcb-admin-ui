import { afterAll, describe, expect, it } from "vitest";

import i18n from "./i18n";
import enGB from "./locales/en-GB/application.json";

describe("the en-US overlay at runtime", () => {
	afterAll(() => i18n.changeLanguage("en-GB"));

	it("is not loaded until something asks for American English", () => {
		expect(i18n.hasResourceBundle("en-US", "application")).toBe(false);
	});

	it("loads on demand, and falls back to en-GB for every string it does not override", async () => {
		await i18n.changeLanguage("en-US");

		expect(i18n.hasResourceBundle("en-US", "application")).toBe(true);
		expect(i18n.t("catalogMetricsByHostLms.name")).toBe(
			"Catalog metrics by Host LMS",
		);
		expect(i18n.t("nav.home")).toBe(enGB.nav.home);
	});

	it("leaves en-GB its own spelling", async () => {
		await i18n.changeLanguage("en-GB");

		expect(i18n.t("catalogMetricsByHostLms.name")).toBe(
			"Catalogue metrics by Host LMS",
		);
	});
});
