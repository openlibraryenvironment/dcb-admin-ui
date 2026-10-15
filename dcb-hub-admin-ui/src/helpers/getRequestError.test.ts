import { describe, expect, it } from "vitest";

import { getRequestError } from "@helpers/getRequestError";

import es from "../../public/locales/es/application.json";
import enGB from "../locales/en-GB/application.json";

type Tree = { [key: string]: string | Tree };

const lookup = (tree: Tree, key: string) =>
	key
		.split(".")
		.reduce<string | Tree | undefined>(
			(node, part) => (typeof node === "object" ? node[part] : undefined),
			tree,
		);

const refusal = (code: string) => [{ code, description: "why. To fix: how" }];

describe("getRequestError", () => {
	it("gives a supplier that cannot supply its own message", () => {
		expect(getRequestError(refusal("SUPPLIER_CANNOT_SUPPLY"))).toBe(
			"requesting.staff_request.patron.error.request.supplier_cannot_supply",
		);
	});

	it("still maps a duplicate request to its own message", () => {
		expect(getRequestError(refusal("DUPLICATE_REQUEST_ATTEMPT"))).toBe(
			"requesting.staff_request.patron.error.request.duplicate",
		);
	});

	it("falls back to the generic message for any other code, or none", () => {
		const generic = "requesting.staff_request.patron.error.request.generic";
		expect(getRequestError(refusal("NO_ITEMS_SELECTABLE_AT_ANY_AGENCY"))).toBe(
			generic,
		);
		expect(getRequestError([])).toBe(generic);
		expect(
			getRequestError(
				undefined as unknown as Parameters<typeof getRequestError>[0],
			),
		).toBe(generic);
	});

	it("names a key every locale translates, carrying the description", () => {
		const key = getRequestError(refusal("SUPPLIER_CANNOT_SUPPLY"));
		for (const locale of [enGB, es] as Tree[]) {
			expect(lookup(locale, key)).toEqual(
				expect.stringContaining("{{description}}"),
			);
		}
	});
});
