import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import type {
	GridAggregationModel,
	GridColDef,
	GridColumnVisibilityModel,
	GridFilterModel,
	GridPaginationModel,
	GridPinnedColumnFields,
	GridSortModel,
} from "@mui/x-data-grid-premium";

import { useRememberedViewStore } from "@hooks/rememberedViewStore";
import {
	aggregationFromView,
	aggregationToView,
	filterFromView,
	filterToView,
	gridRules,
	itemToFilter,
	modelsToView,
	orderFromView,
	orderToView,
	paginationFromView,
	paginationToView,
	parsePrivateState,
	pinnedFromView,
	pinnedToView,
	sortFromView,
	sortToView,
	visibilityFromView,
	visibilityToView,
	type GridModels,
	type GridRules,
	type GridViewSpec,
	type PrivateGridState,
} from "@helpers/viewState/gridView";
import {
	decodeView,
	emptyView,
	encodeView,
	paramName,
	VIEW_PARAMS,
	type UrlView,
	type ViewParam,
} from "@helpers/viewState/urlViewCodec";

const FILTER_DEBOUNCE_MS = 500;

const FILTER_PARAMS = ["filters", "logic"] as const satisfies ViewParam[];
const SORT_PARAMS = ["sort"] as const satisfies ViewParam[];
const PAGE_PARAMS = ["page", "pageSize"] as const satisfies ViewParam[];
const COLUMN_PARAMS = ["hide", "show"] as const satisfies ViewParam[];
const PIN_PARAMS = ["pinLeft", "pinRight"] as const satisfies ViewParam[];
const ORDER_PARAMS = ["order"] as const satisfies ViewParam[];
const AGG_PARAMS = ["agg"] as const satisfies ViewParam[];

type Search = Record<string, unknown>;

/** One part of the URL's view, re-decoded only when its own parameters change. */
const useViewPart = (
	search: Search,
	namespace: string | undefined,
	params: readonly ViewParam[],
): UrlView => {
	const raw = JSON.stringify(
		params.map((param) => search[paramName(param, namespace)] ?? null),
	);
	return useMemo(() => {
		const values = JSON.parse(raw) as unknown[];
		return decodeView(
			Object.fromEntries(
				params.map((param, index) => [
					paramName(param, namespace),
					values[index] ?? undefined,
				]),
			),
			namespace,
		);
	}, [raw, namespace, params]);
};

/** A filter as the URL and history entry will hold it, so a typed one can be matched to its arrival. */
const filterKey = (rules: GridRules, model: GridFilterModel) => {
	const { filters, logic, privateState } = filterToView(rules, model);
	return JSON.stringify([
		filters,
		logic,
		privateState?.items.map(({ index, item }) => [
			index,
			itemToFilter(rules, item),
		]),
		privateState?.quickFilterValues,
	]);
};

/** A grid's pinning and order, read from and written to its URL. DataGrid applies them. */
export interface ColumnLayout {
	pinnedColumns: GridPinnedColumnFields;
	onPinnedColumnsChange: (model: GridPinnedColumnFields) => void;
	/** The shareable fields, in order; columns the URL cannot name keep their places. */
	columnOrder: readonly string[];
	onColumnOrderChange: (fields: string[]) => void;
}

/**
 * A server-paged grid's filter, sort, page and columns, read from and written to its route's
 * search. `spec` is defined at module scope. docs/url-view-state.md says how to add a grid.
 */
export const useGridView = (
	spec: GridViewSpec,
	columns: readonly GridColDef[],
	search: Search,
) => {
	const navigate = useNavigate();
	const router = useRouter();
	const { id, namespace } = spec;
	// The page this grid is on: a write that runs after the reader has left it must not land elsewhere
	const pathname = useLocation({ select: (location) => location.pathname });
	const onPage = useRef<string | null>(pathname);
	useEffect(() => {
		onPage.current = pathname;
		return () => {
			onPage.current = null;
		};
	}, [pathname]);

	// Rebuilt only when the URL could read differently: a grid whose select options load late
	// would otherwise get a new filter model, which MUI X takes as a change and pages back to 1
	const freshRules = useMemo(() => gridRules(columns), [columns]);
	const [rules, setRules] = useState(freshRules);
	if (freshRules.key !== rules.key) setRules(freshRules);

	const filterView = useViewPart(search, namespace, FILTER_PARAMS);
	const sortView = useViewPart(search, namespace, SORT_PARAMS);
	const pageView = useViewPart(search, namespace, PAGE_PARAMS);
	const columnView = useViewPart(search, namespace, COLUMN_PARAMS);
	const pinView = useViewPart(search, namespace, PIN_PARAMS);
	const orderView = useViewPart(search, namespace, ORDER_PARAMS);
	const aggView = useViewPart(search, namespace, AGG_PARAMS);
	const hidden = useLocation({
		select: (location) => location.state.gridPrivate?.[id],
	});
	const restored = useLocation({
		select: (location) => location.state.gridRestored?.[id] === true,
	});

	const appliedFilter = useMemo(
		() => filterFromView(rules, filterView, parsePrivateState(rules, hidden)),
		[rules, filterView, hidden],
	);
	const appliedSort = useMemo(
		() => sortFromView(spec, rules, sortView.sort),
		[spec, rules, sortView],
	);
	const appliedPagination = useMemo(
		() => paginationFromView(spec, pageView),
		[spec, pageView],
	);
	const appliedVisibility = useMemo(
		() => visibilityFromView(spec, rules, columnView),
		[spec, rules, columnView],
	);
	const appliedPinned = useMemo(
		() => pinnedFromView(rules, pinView),
		[rules, pinView],
	);
	const appliedOrder = useMemo(
		() => orderFromView(rules, orderView.order),
		[rules, orderView],
	);
	const appliedAggregation = useMemo(
		() => aggregationFromView(spec, rules, aggView.agg),
		[spec, rules, aggView],
	);

	// What the reader just did, shown until somebody else moves the address. A navigation
	// commits a tick later, and MUI X resets the page on a sort or filter prop it sees late.
	const [pending, setPending] = useState<Partial<GridModels>>({});
	const shown: GridModels = {
		filterModel: pending.filterModel ?? appliedFilter,
		sortModel: pending.sortModel ?? appliedSort,
		paginationModel: pending.paginationModel ?? appliedPagination,
		columnVisibilityModel: pending.columnVisibilityModel ?? appliedVisibility,
		pinnedColumns: pending.pinnedColumns ?? appliedPinned,
		columnOrder: pending.columnOrder ?? appliedOrder,
		aggregationModel: pending.aggregationModel ?? appliedAggregation,
	};
	const shownRef = useRef(shown);
	useEffect(() => {
		shownRef.current = shown;
	});

	// Marks on this grid's own writes; an entry without one is the address changing under it
	const ownWrites = useRef<string[]>([]);
	const writeCount = useRef(0);
	const mountMark = useId();

	// One push per visit: the first change adds the entry Back returns from; the rest replace it
	const pushed = useRef(false);
	// In order: a change made while the visit's first push is under way must not overtake it
	const queue = useRef<Promise<unknown>>(Promise.resolve());

	const nextMark = useCallback(() => {
		const mark = `${mountMark}${++writeCount.current}`;
		ownWrites.current = [...ownWrites.current.slice(-19), mark];
		return mark;
	}, [mountMark]);

	const writeNow = useCallback(
		async (
			part: Partial<UrlView>,
			params: readonly ViewParam[],
			privateState?: PrivateGridState | null,
		) => {
			// "." resolves against wherever the reader is now
			if (router.state.location.pathname !== onPage.current) return undefined;
			// MUI reports some changes it made itself, such as page 1 again after a filter: a write that
			// changes nothing is not the reader's, and must not spend the visit's one push
			const encodedPart = encodeView({ ...emptyView(), ...part }, namespace);
			const current = router.state.location.search as Search;
			// One repeated value reads back as a plain string
			const asRead = (value: unknown) =>
				JSON.stringify(
					(Array.isArray(value) && value.length === 1 ? value[0] : value) ??
						null,
				);
			const unchanged = params.every(
				(param) =>
					asRead(current[paramName(param, namespace)]) ===
					asRead(encodedPart[paramName(param, namespace)]),
			);
			if (unchanged && privateState === undefined) return undefined;
			const replace = pushed.current;
			pushed.current = true;
			if (!replace) {
				// The entry Back returns to keeps the view it arrived with: marked as this grid's,
				// it is not taken for a bare address and given the last view in its place
				const arrival = nextMark();
				await navigate({
					to: ".",
					search: (previous: Search) => previous,
					replace: true,
					resetScroll: false,
					state: (previous) => ({
						...previous,
						gridWrites: { ...previous.gridWrites, [id]: arrival },
					}),
				});
				if (router.state.location.pathname !== onPage.current) return undefined;
			}
			const mark = nextMark();
			const encoded = encodeView({ ...emptyView(), ...part }, namespace);
			return navigate({
				to: ".",
				search: (previous: Search) => {
					const next = { ...previous };
					for (const param of params) {
						const key = paramName(param, namespace);
						next[key] = encoded[key];
					}
					return next;
				},
				replace,
				resetScroll: false,
				state: (previous) => ({
					...previous,
					gridWrites: { ...previous.gridWrites, [id]: mark },
					gridRestored: { ...previous.gridRestored, [id]: undefined },
					...(privateState === undefined
						? {}
						: {
								gridPrivate: {
									...previous.gridPrivate,
									[id]: privateState ?? undefined,
								},
							}),
				}),
			});
		},
		[id, namespace, nextMark, navigate, router],
	);

	const write = useCallback(
		(
			part: Partial<UrlView>,
			params: readonly ViewParam[],
			privateState?: PrivateGridState | null,
		) => {
			const next = queue.current.then(() =>
				writeNow(part, params, privateState),
			);
			queue.current = next.catch(() => undefined);
			return next;
		},
		[writeNow],
	);

	// Rule 1: only the reader's own changes reach the remembered view, never a view a link opened
	const rememberView = useRememberedViewStore((state) => state.remember);
	const forgetView = useRememberedViewStore((state) => state.forget);
	const remember = useCallback(
		(change: Partial<GridModels>) => {
			if (!spec.remember) return;
			const { view } = modelsToView(spec, rules, {
				...shownRef.current,
				...change,
			});
			rememberView(id, view);
		},
		[spec, rules, id, rememberView],
	);

	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const unwritten = useRef<GridFilterModel | null>(null);
	useEffect(() => () => clearTimeout(timer.current), []);

	const entry = useLocation({
		select: (location) => location.state.__TSR_key,
	});
	const entryMark = useLocation({
		select: (location) => location.state.gridWrites?.[id],
	});
	const seenEntry = useRef(entry);
	useEffect(() => {
		if (entry === seenEntry.current) return;
		seenEntry.current = entry;
		const own =
			entryMark === undefined ? -1 : ownWrites.current.indexOf(entryMark);
		if (own >= 0) {
			ownWrites.current = ownWrites.current.slice(own + 1);
			return;
		}
		// Back, forward or a link: a new visit, and a filter still being typed was for the view that left
		pushed.current = false;
		clearTimeout(timer.current);
		unwritten.current = null;
		setPending((current) => (Object.keys(current).length > 0 ? {} : current));
	}, [entry, entryMark]);

	const appliedFilterKey = filterKey(rules, appliedFilter);
	const appliedFilterKeyRef = useRef(appliedFilterKey);
	useEffect(() => {
		appliedFilterKeyRef.current = appliedFilterKey;
	}, [appliedFilterKey]);

	const writeFilter = useCallback(
		(model: GridFilterModel) => {
			unwritten.current = null;
			// An unfinished row changes nothing the URL carries: not a change of the reader's, so
			// neither written nor remembered, or opening a link's filter panel would keep its view
			if (filterKey(rules, model) === appliedFilterKeyRef.current)
				return Promise.resolve(undefined);
			// A changed filter starts on its first page, in the same write: paging inside the
			// debounce would otherwise carry over to the new filter
			setPending((current) => {
				const next = { ...current };
				delete next.paginationModel;
				return next;
			});
			const { filters, logic, privateState } = filterToView(rules, model);
			remember({ filterModel: model });
			return write(
				{ filters, logic },
				[...FILTER_PARAMS, "page"],
				privateState ?? null,
			);
		},
		[rules, remember, write],
	);

	const onFilterModelChange = useCallback(
		(model: GridFilterModel) => {
			setPending((current) => ({ ...current, filterModel: model }));
			clearTimeout(timer.current);
			unwritten.current = model;
			timer.current = setTimeout(
				() => void writeFilter(model),
				FILTER_DEBOUNCE_MS,
			);
		},
		[writeFilter],
	);

	const onSortModelChange = useCallback(
		(model: GridSortModel) => {
			// The first page of the new order in one write, not this page and then page 1
			const paginationModel = {
				page: 0,
				pageSize: shownRef.current.paginationModel.pageSize,
			};
			setPending((current) => ({
				...current,
				sortModel: model,
				paginationModel,
			}));
			remember({ sortModel: model });
			void write({ sort: sortToView(spec, rules, model) }, [
				...SORT_PARAMS,
				"page",
			]);
		},
		[spec, rules, remember, write],
	);

	const onPaginationModelChange = useCallback(
		(model: GridPaginationModel) => {
			const sizeChanged =
				model.pageSize !== shownRef.current.paginationModel.pageSize;
			setPending((current) => ({ ...current, paginationModel: model }));
			// The page itself is never remembered
			if (sizeChanged) remember({ paginationModel: model });
			void write(paginationToView(spec, model), PAGE_PARAMS);
		},
		[spec, remember, write],
	);

	const onColumnVisibilityModelChange = useCallback(
		(model: GridColumnVisibilityModel) => {
			setPending((current) => ({ ...current, columnVisibilityModel: model }));
			remember({ columnVisibilityModel: model });
			void write(visibilityToView(spec, rules, model), COLUMN_PARAMS);
		},
		[spec, rules, remember, write],
	);

	const onPinnedColumnsChange = useCallback(
		(model: GridPinnedColumnFields) => {
			setPending((current) => ({ ...current, pinnedColumns: model }));
			remember({ pinnedColumns: model });
			void write(pinnedToView(rules, model), PIN_PARAMS);
		},
		[rules, remember, write],
	);

	const onColumnOrderChange = useCallback(
		(unpinned: string[]) => {
			// Pinned columns keep their default places in the order: pinning alone is not a reorder
			const { left = [], right = [] } = shownRef.current.pinnedColumns;
			const pinned = new Set([...left, ...right]);
			const moved = orderFromView(rules, unpinned).filter(
				(field) => !pinned.has(field),
			);
			let next = 0;
			const columnOrder = rules.order.map((field) =>
				pinned.has(field) ? field : moved[next++],
			);
			setPending((current) => ({ ...current, columnOrder }));
			remember({ columnOrder });
			void write({ order: orderToView(rules, columnOrder) }, ORDER_PARAMS);
		},
		[rules, remember, write],
	);

	const onAggregationModelChange = useCallback(
		(model: GridAggregationModel) => {
			setPending((current) => ({ ...current, aggregationModel: model }));
			remember({ aggregationModel: model });
			void write({ agg: aggregationToView(spec, rules, model) }, AGG_PARAMS);
		},
		[spec, rules, remember, write],
	);

	/** Rule 2's Reset: the grid's defaults, a bare address, and nothing remembered. */
	const reset = useCallback(() => {
		clearTimeout(timer.current);
		unwritten.current = null;
		forgetView(id);
		setPending(viewToDefaults(spec, rules));
		void write(emptyView(), VIEW_PARAMS, null);
	}, [spec, rules, id, forgetView, write]);

	/** Writes a filter still waiting on the debounce, so the address is the grid as shown. */
	const flush = useCallback(async () => {
		if (!unwritten.current) return;
		clearTimeout(timer.current);
		await writeFilter(unwritten.current);
	}, [writeFilter]);

	return {
		/** What the grid shows: the filter as typed, before the debounce. */
		filterModel: shown.filterModel,
		/** What the server is asked for. */
		appliedFilterModel: appliedFilter,
		sortModel: shown.sortModel,
		paginationModel: shown.paginationModel,
		columnVisibilityModel: shown.columnVisibilityModel,
		/** Pinning and order, for DataGrid's columnLayout. */
		columnLayout: {
			pinnedColumns: shown.pinnedColumns,
			onPinnedColumnsChange,
			columnOrder: shown.columnOrder,
			onColumnOrderChange,
		} satisfies ColumnLayout,
		/** For a grid whose spec aggregates: the aggregate per column, from the URL. */
		aggregationModel: shown.aggregationModel,
		onAggregationModelChange,
		onFilterModelChange,
		onSortModelChange,
		onPaginationModelChange,
		onColumnVisibilityModelChange,
		/** Rule 2: the view is the reader's last one, restored onto a bare address. */
		restored,
		reset,
		flush,
		/** A filter is in force that a copied link will not carry. */
		hasPrivate:
			filterToView(rules, shown.filterModel).privateState !== undefined,
	};
};

const viewToDefaults = (spec: GridViewSpec, rules: GridRules): GridModels => ({
	filterModel: filterFromView(rules, emptyView()),
	sortModel: spec.defaultSort,
	paginationModel: paginationFromView(spec, emptyView()),
	columnVisibilityModel: visibilityFromView(spec, rules, emptyView()),
	pinnedColumns: pinnedFromView(rules, emptyView()),
	columnOrder: orderFromView(rules, undefined),
	aggregationModel: aggregationFromView(spec, rules, emptyView().agg),
});

export type GridView = ReturnType<typeof useGridView>;
