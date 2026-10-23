import type { ParsedLocation } from "@tanstack/react-router";

import { rememberedView } from "@hooks/rememberedViewStore";
import type { GridModels, GridViewSpec, PrivateGridState } from "./gridView";
import { encodeView, paramName, VIEW_PARAMS } from "./urlViewCodec";

// For a grid route's options outside its component, which are not code-split: nothing here may
// import MUI X at run time, or the grid's chunk is split to share it. docs/url-view-state.md.

declare module "@tanstack/react-router" {
	interface HistoryState {
		/** Per grid id: the filter values a URL must not carry. docs/url-view-state.md. */
		gridPrivate?: Record<string, PrivateGridState | undefined>;
		/** Per grid id: the mark of the grid's own last write, to tell it from Back or a link. */
		gridWrites?: Record<string, string>;
		/** Per grid id: the view came from the reader's last one, not from the link. */
		gridRestored?: Record<string, true | undefined>;
	}
}

export type HistoryEntryState = ParsedLocation["state"];

const VIEW_PARAM_KEY = new RegExp(
	`^([a-z][A-Za-z0-9]*\\.)?(${VIEW_PARAMS.join("|")})$`,
);

/**
 * Where a bare URL should go instead: the reader's last view of this grid, written into the
 * address. For the route's `beforeLoad`, so the defaults are neither shown nor fetched first.
 */
export const rememberedViewRedirect = (
	spec: GridViewSpec,
	search: Record<string, unknown>,
	state: HistoryEntryState,
) => {
	if (!spec.remember) return undefined;
	// The grid wrote this entry itself, a Reset among them, or it holds a private filter
	if (state.gridWrites?.[spec.id] || state.gridPrivate?.[spec.id])
		return undefined;
	const own = new Set(
		VIEW_PARAMS.map((param) => paramName(param, spec.namespace)),
	);
	const linked = Object.entries(search).some(
		([key, value]) =>
			value !== undefined && (own.has(key) || !VIEW_PARAM_KEY.test(key)),
	);
	if (linked) return undefined;
	const view = rememberedView(spec.id);
	if (!view) return undefined;
	return {
		search: { ...search, ...encodeView(view, spec.namespace) },
		state: (previous: HistoryEntryState) => ({
			...previous,
			gridRestored: { ...previous.gridRestored, [spec.id]: true as const },
		}),
	};
};

/**
 * The query models of a grid showing its defaults, which a loader can prefetch without the grid's
 * columns; undefined for any other view, which only the grid can read. Equal to what useGridView
 * gives for the same entry, or the prefetch is a second request.
 */
export const defaultQueryModels = (
	spec: GridViewSpec,
	search: Record<string, unknown>,
	state: HistoryEntryState,
):
	| Pick<GridModels, "filterModel" | "sortModel" | "paginationModel">
	| undefined => {
	const own = VIEW_PARAMS.map((param) => paramName(param, spec.namespace));
	if (own.some((key) => search[key] !== undefined)) return undefined;
	if (state.gridPrivate?.[spec.id]) return undefined;
	return {
		filterModel: { items: [] },
		sortModel: spec.defaultSort,
		paginationModel: { page: 0, pageSize: spec.defaultPageSize },
	};
};

/**
 * One library's or one group's own view of a grid: each remembers its own, within the store's
 * bound. The scope is a route parameter, so the route options and the component agree on it.
 */
export const scopedView = (
	spec: GridViewSpec,
	scopeId: string,
): GridViewSpec => ({ ...spec, id: `${spec.id}-${scopeId}` });

/** rememberedViewRedirect for a page with several grids: each restored, in one redirect. */
export const rememberedViewsRedirect = (
	specs: readonly GridViewSpec[],
	search: Record<string, unknown>,
	state: HistoryEntryState,
) => {
	const restores = specs
		.map((spec) => rememberedViewRedirect(spec, search, state))
		.filter((restore) => restore !== undefined);
	if (restores.length === 0) return undefined;
	return {
		search: Object.assign({}, ...restores.map((restore) => restore.search)),
		state: (previous: HistoryEntryState) =>
			restores.reduce((next, restore) => restore.state(next), previous),
	};
};
