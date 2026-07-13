import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
	Link,
} from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { z } from "zod";
import { validate } from "uuid";
import { isEqual } from "lodash";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Box } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import ErrorComponent from "@components/Error/Error";
import { SearchQueryBuilder } from "@components/SearchQueryBuilder/SearchQueryBuilder";
import CombinedRequestingModal from "@forms/CombinedRequestingModal/CombinedRequestingModal";

import { useGridState } from "@hooks/useGridState";
import { useSearchStore } from "@hooks/useSearchStore";
import {
	buildQueryFromCriteria,
	parseQueryToCriteria,
} from "@helpers/search/searchQueryHelpers";

const searchSchema = z.object({
	q: z.string().optional().catch(""),
});

export const Route = createFileRoute("/__authenticated/search/")({
	validateSearch: searchSchema,
	component: SearchPage,
});

function SearchPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const auth = useAuth();
	// Runtime config (injected via inject_env.json in production) - not the
	// build-time import.meta.env, which is undefined in the runtime-configured
	// production image and would wrongly show the "shared index unavailable" page.
	const { cfg } = useRouter().options.context as { cfg: any };
	const searchBase = cfg?.VITE_DCB_SEARCH_BASE;

	// The URL (`q`) is the single source of truth for the *executed* search:
	// shareable, bookmarkable, and the sole trigger for data fetching.
	const { q } = Route.useSearch();

	const gridId = "sharedIndexSearch";

	// The SearchQueryBuilder owns the editable *draft* criteria (the advanced
	// filter surface). We only need to push parsed criteria back into it on URL
	// changes, so we grab the stable setter with an atomic selector - subscribing
	// to `criteria` here would re-render (and repaint the grid) on every keystroke.
	const setCriteria = useSearchStore((s) => s.setCriteria);

	// Pagination is the only grid state this page owns; the query builder replaces
	// column filtering and the search API has no sort. useGridState gives us the
	// shared atomic-selector persistence used by every other grid.
	const { paginationModel, onPaginationModelChange } = useGridState(gridId, {
		pagination: { page: 0, pageSize: 25 },
	});

	// Quick walk-up can be launched straight from search results: staff already
	// have the item barcode in hand, so no cluster context is required here.
	const [showWalkUp, setShowWalkUp] = useState(false);

	// URL -> builder draft. Rehydrates the query builder on deep-link / back /
	// forward. Reads current criteria via getState() so this effect depends only
	// on `q` (setCriteria is a stable Zustand action) and never fights a reverse
	// sync - there is no reverse sync any more.
	useEffect(() => {
		const parsedCriteria = parseQueryToCriteria(q ?? "");
		if (!isEqual(parsedCriteria, useSearchStore.getState().criteria)) {
			setCriteria(parsedCriteria);
		}
	}, [q, setCriteria]);

	const { data, isLoading, isFetching, isError } = useQuery({
		queryKey: ["search", q, paginationModel.page, paginationModel.pageSize],
		queryFn: async () => {
			if (!auth.user?.access_token || !q)
				return { instances: [], totalRecords: 0 };

			const baseUrl = searchBase;
			if (!baseUrl) throw new Error("Search base URL not configured");

			const isUUID = q.length === 36 ? validate(q) : false;

			const requestURL = isUUID
				? `${baseUrl}/public/opac-inventory/instances/${q}`
				: `${baseUrl}/search/instances?query=${encodeURIComponent(q)}&offset=${paginationModel.page * paginationModel.pageSize}&limit=${paginationModel.pageSize}`;

			const response = await fetch(requestURL, {
				headers: { Authorization: `Bearer ${auth.user.access_token}` },
			});

			if (!response.ok) {
				// Safely handle 404s for specific UUID searches instead of crashing
				if (response.status === 404 && isUUID)
					return { instances: [], totalRecords: 0 };
				throw new Error("Search request failed");
			}

			const json = await response.json();

			if (isUUID && json) return { instances: [json], totalRecords: 1 };
			if (json.instances)
				return { instances: json.instances, totalRecords: json.totalRecords };

			return { instances: [], totalRecords: 0 };
		},
		enabled: !!q && !!auth.user?.access_token, // Only fetch if we have a query and a token
		placeholderData: (prev) => prev, // Keeps previous data on screen while fetching next page
	});

	// The builder is the whole filter surface: on search we read its draft
	// lazily (getState, so this page never subscribes to per-keystroke changes),
	// reset to page 0, and write the executed query to the URL - which is what
	// makes the search shareable/bookmarkable and drives the fetch.
	const handleBuilderSearch = useCallback(() => {
		const newQuery = buildQueryFromCriteria(useSearchStore.getState().criteria);
		onPaginationModelChange({ page: 0, pageSize: paginationModel.pageSize });
		if (newQuery !== q) {
			// Explicit public path: navigating off Route.id (the internal
			// "/__authenticated/search/") lands on the NotFound page.
			navigate({ to: "/search", search: { q: newQuery }, replace: true });
		}
	}, [q, navigate, onPaginationModelChange, paginationModel.pageSize]);

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "title",
				headerName: t("ui.data_grid.title"),
				minWidth: 300,
				flex: 0.7,
				filterable: false,
			},
			{
				field: "id",
				headerName: t("search.cluster_id"),
				minWidth: 100,
				filterable: false,
				flex: 0.5,
				renderCell: (params) => (
					<Link to={`/search/${params.row.id}/cluster`}>{params.row.id}</Link>
				),
			},
			{
				field: "items",
				headerName: t("search.items"),
				minWidth: 100,
				filterable: false,
				flex: 0.3,
				renderCell: (params) => (
					<Link to={`/search/${params.row.id}/items`}>
						{t("ui.data_grid.view_items")}
					</Link>
				),
			},
			{
				field: "identifiers",
				headerName: t("search.identifiers"),
				minWidth: 100,
				filterable: false,
				flex: 0.3,
				renderCell: (params) => (
					<Link to={`/search/${params.row.id}/identifiers`}>
						{t("search.identifiers")}
					</Link>
				),
			},
		],
		[t],
	);

	// --- Render ---
	if (!searchBase) {
		return (
			<PageContainer title={t("nav.search.name")}>
				<ErrorComponent
					title={t("search.shared_index_unavailable_title")}
					message={t("search.shared_index_unavailable_message")}
					action={t("ui.actions.go_back")}
					goBack="/"
				/>
			</PageContainer>
		);
	}

	const pageActions = [
		{
			key: "quickWalkUp",
			onClick: () => setShowWalkUp(true),
			label: t("requesting.quick_walk_up.actions.place"),
		},
	];

	return (
		<PageContainer title={t("nav.search.name")} pageActions={pageActions}>
			{showWalkUp && (
				<CombinedRequestingModal
					show={showWalkUp}
					onClose={() => setShowWalkUp(false)}
					initialRequestType="quickWalkUp"
				/>
			)}
			<Box sx={{ mb: 3 }}>
				<SearchQueryBuilder onSearch={handleBuilderSearch} />
			</Box>

			{isError ? (
				<ErrorComponent
					title={t("ui.error.search_failed")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.actions.reload")}
					reload
				/>
			) : (
				<DataGrid
					identifier={gridId}
					type="searchInstances"
					columns={columns}
					rows={data?.instances ?? []}
					rowCount={data?.totalRecords ?? 0}
					loading={isLoading || isFetching}
					paginationMode="server"
					pagination
					paginationModel={paginationModel}
					onPaginationModelChange={onPaginationModelChange}
					// The SearchQueryBuilder is the sole (advanced) filter surface, no need for MUI filter model
					disableColumnFilter
					disableColumnSorting
					checkboxSelection={false}
					disableAggregation
					disableRowGrouping
					disableHoverInteractions={false}
					disablePivoting
					listViewEnabled={false}
					pivotingEnabled={false}
					toolbarVisible={true}
					scrollbarVisible={false}
					noResultsText={t("search.no_data")}
					searchText={t("ui.data_grid.search")}
					disableToolbarFilter={true}
				/>
			)}
		</PageContainer>
	);
}
