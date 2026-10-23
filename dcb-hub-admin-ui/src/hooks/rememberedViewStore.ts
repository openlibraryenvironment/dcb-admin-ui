import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { storageKey } from "@helpers/appBase";
import {
	decodeView,
	encodeView,
	type UrlView,
} from "@helpers/viewState/urlViewCodec";

/** Per-library and per-group grids each remember a view: the oldest goes first past this. */
export const MAX_REMEMBERED_VIEWS = 50;

interface RememberedViewState {
	/** In the order last written, oldest first. */
	views: Record<string, UrlView>;
	remember: (gridId: string, view: UrlView) => void;
	forget: (gridId: string) => void;
}

const isEmpty = (view: UrlView) =>
	view.filters.length === 0 &&
	view.logic === undefined &&
	view.sort === undefined &&
	view.pageSize === undefined &&
	view.hide.length === 0 &&
	view.show.length === 0 &&
	!view.pinLeft?.length &&
	!view.pinRight?.length &&
	!view.order?.length &&
	view.agg === undefined;

/** Through the codec both ways, as a link is: what comes back from storage is not trusted. */
const sanitised = (view: unknown): UrlView | undefined => {
	try {
		const clean = decodeView(encodeView(view as UrlView));
		// The page is never remembered: rows move between visits
		delete clean.page;
		return isEmpty(clean) ? undefined : clean;
	} catch {
		return undefined;
	}
};

const without = (views: Record<string, UrlView>, gridId: string) =>
	Object.fromEntries(Object.entries(views).filter(([id]) => id !== gridId));

export const useRememberedViewStore = create<RememberedViewState>()(
	persist(
		(set) => ({
			views: {},
			remember: (gridId, view) =>
				set((state) => {
					const clean = sanitised(view);
					const rest = without(state.views, gridId);
					if (!clean) return { views: rest };
					const entries = Object.entries(rest);
					return {
						views: Object.fromEntries([
							...entries.slice(
								Math.max(0, entries.length - MAX_REMEMBERED_VIEWS + 1),
							),
							[gridId, clean],
						]),
					};
				}),
			forget: (gridId) =>
				set((state) =>
					gridId in state.views
						? { views: without(state.views, gridId) }
						: state,
				),
		}),
		{
			name: storageKey("grid-views"),
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({ views: state.views }),
		},
	),
);

export const rememberedView = (gridId: string): UrlView | undefined =>
	sanitised(useRememberedViewStore.getState().views[gridId]);
