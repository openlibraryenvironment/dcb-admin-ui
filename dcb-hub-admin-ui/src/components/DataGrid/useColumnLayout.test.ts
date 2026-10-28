import { describe, expect, it } from "vitest";
import type { GridColDef } from "@mui/x-data-grid-premium";

import { orderColumns } from "./useColumnLayout";

const columns = (...fields: string[]): GridColDef[] =>
	fields.map((field) => ({ field }));
const fields = (list: GridColDef[]) => list.map((column) => column.field);

describe("orderColumns", () => {
	it("keeps the expander and the checkbox first when a view orders the columns", () => {
		const grid = columns(
			"__detail_panel_toggle__",
			"__check__",
			"dateCreated",
			"status",
			"title",
		);
		expect(
			fields(orderColumns(grid, ["title", "dateCreated", "status"])),
		).toEqual([
			"__detail_panel_toggle__",
			"__check__",
			"title",
			"dateCreated",
			"status",
		]);
	});

	it("puts the columns an order does not name after it, in their own order", () => {
		const grid = columns("__check__", "a", "b", "c", "d");
		expect(fields(orderColumns(grid, ["c"]))).toEqual([
			"__check__",
			"c",
			"a",
			"b",
			"d",
		]);
	});

	it("leaves the columns as given without an order", () => {
		const grid = columns("__check__", "b", "a");
		expect(orderColumns(grid, undefined)).toBe(grid);
		expect(orderColumns(grid, [])).toBe(grid);
	});
});
