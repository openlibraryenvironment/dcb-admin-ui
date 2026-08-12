import { describe, it, expect } from "vitest";

import {
	CONSORTIUM_FUNCTIONAL_SETTINGS,
	MAX_SETTING_DESCRIPTION_LENGTH,
	defaultFunctionalSettingSelection,
	storedDescription,
} from "./functionalSettings";
import application from "@/locales/en-GB/application.json";

const translate = (key: string): string | undefined =>
	key
		.split(".")
		.reduce<any>(
			(node, segment) =>
				node && typeof node === "object" ? node[segment] : undefined,
			application,
		);

describe("consortium functional settings", () => {
	it("starts the request-behaviour settings on and the two restrictive ones off", () => {
		expect(defaultFunctionalSettingSelection()).toEqual({
			PICKUP_ANYWHERE: true,
			RE_RESOLUTION: true,
			OWN_LIBRARY_BORROWING: true,
			SELECT_UNAVAILABLE_ITEMS: true,
			TRIGGER_SUPPLIER_RENEWAL: true,
			VIRTUAL_PATRON_NAMES_VISIBLE: false,
			DENY_LIBRARY_MAPPING_EDIT: false,
		});
	});

	it("gives each setting its own explainer", () => {
		// Copying a neighbour's descriptionKey is an easy slip and produces a
		// checkbox that describes the wrong behaviour.
		const explainers = CONSORTIUM_FUNCTIONAL_SETTINGS.map(
			(setting) => setting.descriptionKey,
		);
		expect(new Set(explainers).size).toBe(explainers.length);
	});

	it("has a label and an explainer for every setting offered", () => {
		for (const setting of CONSORTIUM_FUNCTIONAL_SETTINGS) {
			expect(translate(setting.labelKey), setting.labelKey).toBeTypeOf(
				"string",
			);
			expect(
				translate(setting.descriptionKey),
				setting.descriptionKey,
			).toBeTypeOf("string");
		}
	});

	it("sends a description the column will accept for every setting", () => {
		// FunctionalSetting.description is @Size(max = 200); a longer one is a
		// constraint violation on create. The on-screen explainer is free to be
		// longer, which is the whole point of storedDescription.
		for (const setting of CONSORTIUM_FUNCTIONAL_SETTINGS) {
			const explainer = translate(setting.descriptionKey) as string;
			const stored = storedDescription(explainer);
			expect(stored.length, setting.name).toBeLessThanOrEqual(
				MAX_SETTING_DESCRIPTION_LENGTH,
			);
			expect(stored.length, setting.name).toBeGreaterThan(0);
		}
	});

	describe("storedDescription", () => {
		it("leaves an explainer that already fits alone", () => {
			expect(storedDescription("Short enough.")).toBe("Short enough.");
		});

		it("keeps whole sentences rather than cutting mid-word", () => {
			const first = `${"a".repeat(120)}.`;
			const second = ` ${"b".repeat(120)}.`;

			expect(storedDescription(first + second)).toBe(first);
		});

		it("falls back to a word boundary when one sentence is too long", () => {
			const explainer = `${"word ".repeat(60)}end.`;
			const stored = storedDescription(explainer);

			expect(stored.length).toBeLessThanOrEqual(MAX_SETTING_DESCRIPTION_LENGTH);
			expect(stored.endsWith("…")).toBe(true);
			// Cut between words, so the last kept word is intact.
			expect(stored).not.toMatch(/wor…$/);
		});
	});

	it("offers each setting exactly once", () => {
		const names = CONSORTIUM_FUNCTIONAL_SETTINGS.map((setting) => setting.name);
		expect(new Set(names).size).toBe(names.length);
	});
});
