import { describe, expect, it } from "vitest";
import type { GridColDef } from "@mui/x-data-grid-premium";

import { firstLinkableField, gridRoutesOnRowClick } from "./rowLinkColumn";
import {
	DATA_GRID_TYPES,
	nonClickableTypes,
	rowClickRedirects,
} from "@constants/dataGrid/types";

/**
 * Every detail page in this application is reached through a grid row, and the grid
 * navigated on `onRowClick` alone - a pointer event MUI X does not raise for Enter.
 * A keyboard user could focus a cell, press Enter and reach nothing. WCAG 2.1.1,
 * Level A. The leading cell is now the row's link; this fixes which grids need one
 * and which cell it is.
 */
describe("which grids need a row link", () => {
	it("names one for every grid that routes, and none that does not", () => {
		const routing = DATA_GRID_TYPES.filter(gridRoutesOnRowClick);
		const expected = DATA_GRID_TYPES.filter(
			(type) => !nonClickableTypes.includes(type) || type in rowClickRedirects,
		);
		expect([...routing].sort()).toEqual([...expected].sort());
	});

	it("covers the grids a user spends the day in", () => {
		// Named rather than counted: a refactor that silently drops one of these
		// takes a whole entity's detail page off the keyboard.
		for (const type of [
			"libraries",
			"patronRequests",
			"hostlmss",
			"locations",
			"agencies",
			"groups",
			"bibs",
			"audits",
			"dataChangeLog",
		] as const) {
			expect(gridRoutesOnRowClick(type), type).toBe(true);
		}
	});

	it("leaves an in-place-edited grid alone", () => {
		// Contacts and functional settings are edited in the row; there is no page to
		// link to, so a link there would be a dead end with a focus stop.
		for (const type of [
			"contact",
			"consortiumContact",
			"consortiumFunctionalSettings",
			"referenceValueMappings",
			"numericRangeMappings",
		] as const) {
			expect(gridRoutesOnRowClick(type), type).toBe(false);
		}
	});
});

describe("which cell becomes the link", () => {
	const columns = (...fields: string[]): GridColDef[] =>
		fields.map((field) => ({ field }));

	it("takes the first column a reader sees", () => {
		expect(firstLinkableField(columns("fullName", "agency", "status"))).toBe(
			"fullName",
		);
	});

	it("skips the selection checkbox and the detail toggle", () => {
		expect(
			firstLinkableField(
				columns("__check__", "__detail_panel_toggle__", "dateCreated"),
			),
		).toBe("dateCreated");
	});

	it("skips an actions column even when it leads", () => {
		const withActions: GridColDef[] = [
			{ field: "actions", type: "actions", getActions: () => [] },
			{ field: "code" },
		];
		expect(firstLinkableField(withActions)).toBe("code");
	});

	it("names nothing when there is no such column", () => {
		expect(firstLinkableField(columns("__check__"))).toBeUndefined();
	});
});
