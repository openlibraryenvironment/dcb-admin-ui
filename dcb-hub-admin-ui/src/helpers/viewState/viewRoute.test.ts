import { describe, expect, it } from "vitest";
import type { GridColDef } from "@mui/x-data-grid-premium";

import { gridRules, viewToModels, type GridViewSpec } from "./gridView";
import { emptyView } from "./urlViewCodec";
import { defaultQueryModels, type HistoryEntryState } from "./viewRoute";

const spec: GridViewSpec = {
	id: "grid",
	defaultSort: [{ field: "dateCreated", sort: "desc" }],
	defaultPageSize: 20,
	pageSizeOptions: [20, 50],
	defaultColumnVisibility: {},
	remember: true,
};
const columns: GridColDef[] = [{ field: "dateCreated", type: "dateTime" }];
const entry = { __TSR_index: 0 } as HistoryEntryState;

describe("the defaults a loader prefetches", () => {
	it("are the models the grid reads from a bare address, so the prefetch is the grid's request", () => {
		const { filterModel, sortModel, paginationModel } = viewToModels(
			spec,
			gridRules(columns),
			emptyView(),
		);
		expect(defaultQueryModels(spec, { q: "status:ERROR" }, entry)).toEqual({
			filterModel,
			sortModel,
			paginationModel,
		});
	});

	it("are not guessed for a linked view, which only the grid can read", () => {
		expect(
			defaultQueryModels(spec, { sort: "dateCreated:asc" }, entry),
		).toBeUndefined();
	});

	it("are not guessed when the history entry holds a private filter", () => {
		const state = {
			...entry,
			gridPrivate: { grid: { items: [], quickFilterValues: ["x"] } },
		} as HistoryEntryState;
		expect(defaultQueryModels(spec, {}, state)).toBeUndefined();
	});
});
