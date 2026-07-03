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
import {
	GridColDef,
	GridPaginationModel,
	GridFilterModel,
} from "@mui/x-data-grid-premium";
import { Box } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import ErrorComponent from "@components/Error/Error";
import { SearchQueryBuilder } from "@components/SearchQueryBuilder/SearchQueryBuilder";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useSearchStore } from "@hooks/useSearchStore";
import {
	buildQueryFromCriteria,
	mapCriteriaToFilterModel,
	mapFilterModelToCriteria,
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

	// Read the query directly from the URL
	const { q } = Route.useSearch();

	// Global Stores
	const { criteria, setCriteria } = useSearchStore();
	const {
		paginationModel: storedPaginationModel,
		filterModel: storedFilterModel,
		setPaginationModel,
		setFilterModel,
	} = useGridStore();

	const gridId = "sharedIndexSearch";

	// Local UI State mapped to persistent storage
	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedPaginationModel[gridId] ?? { page: 0, pageSize: 25 },
		);
	const [filterModelLocal, setLocalFilterModel] = useState<GridFilterModel>(
		storedFilterModel[gridId] ?? { items: [] },
	);

	// 2. Sync URL -> Query Builder Criteria (When user clicks a link or hits back/forward)
	useEffect(() => {
		const parsedCriteria = parseQueryToCriteria(q || "");
		if (!isEqual(parsedCriteria, criteria)) {
			setCriteria(parsedCriteria);
		}
		// intentionally re-syncs only when the URL (q) changes; depending on `criteria` would fight the reverse Criteria->URL sync
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [q, setCriteria]);

	// 3. Sync Query Builder Criteria -> DataGrid Filter Model UI
	/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- intentionally re-syncs the grid filter model only when `criteria` changes; depending on `filterModelLocal` would fight the reverse grid->criteria sync */
	useEffect(() => {
		const newFilterModel = mapCriteriaToFilterModel(criteria);
		if (!isEqual(newFilterModel, filterModelLocal)) {
			setLocalFilterModel(newFilterModel);
		}
	}, [criteria]);
	/* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

	// 4. TanStack Query for Data Fetching (Replaces useEffect + Axios)
	const { data, isLoading, isError, isFetching } = useQuery({
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

	// --- Handlers ---
	const executeSearch = useCallback(
		(newCriteria: any) => {
			const newQuery = buildQueryFromCriteria(newCriteria);
			if (newQuery !== q) {
				// Explicit public path: navigating off Route.id (the internal
				// "/__authenticated/search/") landed on the NotFound page. Writing the
				// URL here is what makes the search shareable/bookmarkable.
				navigate({ to: "/search", search: { q: newQuery }, replace: true });
			}
		},
		[q, navigate],
	);

	const handleBuilderSearch = () => {
		// Reset to page 0 on a fresh search
		const newPagination = { page: 0, pageSize: paginationModel.pageSize };
		setLocalPaginationModel(newPagination);
		setPaginationModel(gridId, newPagination);
		executeSearch(criteria);
	};

	const handleFilterModelChange = useCallback(
		(newFilterModel: GridFilterModel) => {
			const newCriteriaFromGrid = mapFilterModelToCriteria(newFilterModel);
			const currentCriteriaFromGrid =
				mapFilterModelToCriteria(filterModelLocal);

			if (!isEqual(currentCriteriaFromGrid, newCriteriaFromGrid)) {
				setCriteria(newCriteriaFromGrid);
				executeSearch(newCriteriaFromGrid);
			}

			setLocalFilterModel(newFilterModel);
			setFilterModel(gridId, newFilterModel);
		},
		[filterModelLocal, setCriteria, setFilterModel, gridId, executeSearch],
	);

	const handlePaginationChange = useCallback(
		(m: GridPaginationModel) => {
			setLocalPaginationModel(m);
			setPaginationModel(gridId, m);
		},
		[gridId, setPaginationModel],
	);

	// --- Columns ---
	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "title",
				headerName: t("ui.data_grid.title"),
				minWidth: 300,
				flex: 0.7,
			},
			{
				field: "id",
				headerName: t("search.cluster_id"),
				minWidth: 100,
				flex: 0.5,
				renderCell: (params) => (
					<Link to={`/search/${params.row.id}/cluster`}>{params.row.id}</Link>
				),
			},
			{
				field: "items",
				headerName: t("search.items"),
				minWidth: 100,
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

	return (
		<PageContainer title={t("nav.search.name")}>
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
					onPaginationModelChange={handlePaginationChange}
					sortingMode="server"
					filterMode="server"
					filterModel={filterModelLocal}
					onFilterModelChange={handleFilterModelChange}
					checkboxSelection={false}
					disableAggregation
					disableRowGrouping
					disableHoverInteractions={false}
					disablePivoting
					rowModesModel={{}}
					listViewEnabled={false}
					pivotingEnabled={false}
					toolbarVisible={true}
					scrollbarVisible={false}
					noResultsText={t("search.no_data")}
					searchText={t("general.search")}
				/>
			)}
		</PageContainer>
	);
}
