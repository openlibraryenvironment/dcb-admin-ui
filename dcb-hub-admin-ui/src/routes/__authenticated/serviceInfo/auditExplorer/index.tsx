import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import dayjs from "dayjs";
import {
	Box,
	Chip,
	FormControlLabel,
	InputAdornment,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import {
	GridColDef,
	GridRowGroupingModel,
	type GridRowModesModel,
} from "@mui/x-data-grid-premium";
import {
	AUDIT_SEARCH_MAX,
	auditSearchTerm,
	auditsQuery,
	withAuditDescription,
} from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Link from "@components/Link/Link";
import AuditIncidenceChart from "@components/AuditIncidenceChart/AuditIncidenceChart";

import { useGridView } from "@hooks/useGridView";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { processGridFilterModel } from "@helpers/dataGrid/utilities";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { containsOnly } from "@filters/containsOnly";
import { equalsOnly } from "@filters/equalsOnly";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { getAudits } from "@queries/getAudits";
import { isAuditExplorerEnabled } from "@helpers/featureFlags";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { auditExplorerView } from "@constants/dataGrid/gridViews";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/auditExplorer/",
)({
	validateSearch: (search: Record<string, unknown>) => ({
		search: auditSearchTerm(search),
		...validateGridSearch(search),
	}),
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		// The nav entry is hidden while the flag is off, but the URL is still
		// typeable - and the page depends on dcb-service work this environment may
		// not serve yet, so block it here too.
		if (!isAuditExplorerEnabled()) {
			throw redirect({ to: "/serviceInfo" });
		}
		const restore = rememberedViewRedirect(
			auditExplorerView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({ to: "/serviceInfo/auditExplorer", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(auditExplorerView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			auditsQuery(createGraphQLClient(cfg, auth), models, deps.search),
		);
	},
	component: AuditExplorer,
});

const gridId = auditExplorerView.id;
// The description search reaches the address after this pause in typing
const SEARCH_DEBOUNCE_MS = 400;

function AuditExplorer() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const navigate = useNavigate();
	const search = useSearch({
		from: "/__authenticated/serviceInfo/auditExplorer/",
	});
	const term = search.search;
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// Group by owning patron request by default - the primary ask. Controlled so
	// the toolbar's grouping panel and the header toggle stay in sync.
	const [rowGroupingModel, setRowGroupingModel] =
		useState<GridRowGroupingModel>(["patronRequestId"]);

	// The box is owned here for lag-free typing, and follows the address only when
	// something else changes it (Back, a link): its own writes are trimmed copies
	const [searchValue, setSearchValue] = useState<string>(term ?? "");
	const [seenTerm, setSeenTerm] = useState(term);
	if (term !== seenTerm) {
		setSeenTerm(term);
		if ((term ?? "") !== searchValue.trim()) setSearchValue(term ?? "");
	}
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const commitDescription = useCallback(
		(value: string) => {
			const trimmed = value.trim().slice(0, AUDIT_SEARCH_MAX);
			void navigate({
				to: ".",
				search: (previous: Record<string, unknown>) => ({
					...previous,
					search: trimmed || undefined,
					// A new search starts on its first page
					page: undefined,
				}),
				replace: true,
				resetScroll: false,
			});
		},
		[navigate],
	);

	const handleSearchInput = useCallback(
		(value: string) => {
			setSearchValue(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(
				() => commitDescription(value),
				SEARCH_DEBOUNCE_MS,
			);
		},
		[commitDescription],
	);

	const applyPreset = useCallback(
		(term: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			const next = searchValue.trim() === term ? "" : term;
			setSearchValue(next);
			commitDescription(next);
		},
		[commitDescription, searchValue],
	);

	// Known signals that do not fail a request but matter for monitoring. Matched as
	// `contains` (-> ILIKE '%term%'), so the partial terms below match real messages
	// and stay robust to wording drift.
	const presetSignals = useMemo(
		() => [
			{
				label: t("audit_explorer.presets.virtual_checkout_failed"),
				term: "Virtual checkout failed",
			},
			{ label: t("audit_explorer.presets.read_timeout"), term: "Read timeout" },
			{ label: t("audit_explorer.presets.timeout"), term: "timeout" },
			{ label: t("audit_explorer.presets.failed"), term: "failed" },
			{
				label: t("audit_explorer.presets.tracking_failed"),
				term: "Tracking failed",
			},
		],
		[t],
	);

	const auditColumns: GridColDef[] = useMemo(
		() => [
			{
				field: "patronRequestId",
				headerName: t("audit_explorer.patron_request"),
				minWidth: 320,
				flex: 0.9,
				filterable: false,
				sortable: false,
				valueGetter: (_value, row) =>
					row?.patronRequest?.id ?? row?.auditData?.patronRequestId ?? null,
				renderCell: (params) =>
					params.value ? (
						<Link
							to={`/patronRequests/${params.value}`}
							onClick={(e: React.MouseEvent) => e.stopPropagation()}
						>
							{params.value}
						</Link>
					) : (
						t("audit_explorer.no_request")
					),
			},
			{
				field: "auditDate",
				headerName: t("audit_log.audit_date"),
				minWidth: 190,
				flex: 0.35,
				type: "dateTime",
				filterOperators: luceneDateRangeOperators,
				valueGetter: (_value, row) =>
					row?.auditDate ? new Date(row.auditDate) : null,
				valueFormatter: (value: Date | null) =>
					value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "",
			},
			{
				field: "briefDescription",
				headerName: t("audit_log.audit_description"),
				minWidth: 240,
				flex: 1,
				// Substring match: `*term*`, which the backend turns into
				// `brief_description ILIKE '%term%'`. A quoted phrase would compile to
				// exact equality instead, which silently matches nothing for the partial
				// terms this page is built around ("timeout", "failed").
				filterOperators: containsOnly,
			},
			{
				field: "fromStatus",
				headerName: t("audit_log.audit_from_status"),
				minWidth: 140,
				flex: 0.35,
				// Enum status codes on the same index that rejects wildcards - exact
				// match is both correct here and the operator the backend answers.
				filterOperators: equalsOnly,
			},
			{
				field: "toStatus",
				headerName: t("audit_log.audit_to_status"),
				minWidth: 140,
				flex: 0.35,
				filterOperators: equalsOnly,
			},
			{
				field: "requestStatus",
				headerName: t("audit_explorer.request_status"),
				minWidth: 140,
				flex: 0.35,
				filterable: false,
				sortable: false,
				valueGetter: (_value, row) => row?.patronRequest?.status ?? null,
			},
		],
		[t],
	);

	const columns: GridColDef[] = useMemo(
		() => [...customColumns, ...auditColumns],
		[customColumns, auditColumns],
	);
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(auditExplorerView, viewColumns, search);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery(
		auditsQuery(
			gqlClient,
			{
				paginationModel: view.paginationModel,
				sortModel: view.sortModel,
				filterModel: view.appliedFilterModel,
			},
			term,
		),
	);

	const totalSize = gridData?.audits?.totalSize ?? 0;

	// The exact Lucene query the grid is showing, minus paging/sort, so the
	// incidence chart's histogram always reflects the active search and filters.
	const appliedFilterModel = view.appliedFilterModel;
	const incidenceQuery = useMemo(
		() =>
			processGridFilterModel(
				withAuditDescription(appliedFilterModel, term),
				"",
				["briefDescription"],
			),
		[appliedFilterModel, term],
	);

	return (
		<PageContainer title={t("nav.serviceInfo.auditExplorer")}>
			<Stack spacing={2}>
				<Typography color="text.secondary">
					{t("audit_explorer.intro")}
				</Typography>
				<TextField
					fullWidth
					value={searchValue}
					onChange={(e) => handleSearchInput(e.target.value)}
					label={t("audit_explorer.search_label")}
					placeholder={t("audit_explorer.search_placeholder")}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<Search />
								</InputAdornment>
							),
						},
					}}
				/>
				<Stack
					direction="row"
					spacing={1}
					useFlexGap
					sx={{ flexWrap: "wrap", alignItems: "center" }}
				>
					<Typography variant="body2" color="text.secondary">
						{t("audit_explorer.common_signals")}
					</Typography>
					{presetSignals.map((preset) => (
						<Chip
							key={preset.term}
							label={preset.label}
							onClick={() => applyPreset(preset.term)}
							color={searchValue.trim() === preset.term ? "primary" : "default"}
							variant={
								searchValue.trim() === preset.term ? "filled" : "outlined"
							}
						/>
					))}
				</Stack>
				<Stack
					direction="row"
					sx={{
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
					}}
				>
					<Typography variant="subtitle1">
						{t("audit_explorer.incidence", { count: totalSize })}
					</Typography>
					<FormControlLabel
						control={
							<Switch
								checked={rowGroupingModel.includes("patronRequestId")}
								onChange={(e) =>
									setRowGroupingModel(
										e.target.checked ? ["patronRequestId"] : [],
									)
								}
							/>
						}
						label={t("audit_explorer.group_by_request")}
					/>
				</Stack>
				<AuditIncidenceChart query={incidenceQuery} />
				<Box>
					<DataGrid
						identifier={gridId}
						type={"audits"}
						columns={columns}
						viewNotice={<GridViewNotice view={view} />}
						rows={gridData?.audits?.content ?? []}
						rowCount={totalSize}
						loading={isLoading || isFetching}
						paginationMode="server"
						pagination
						paginationModel={view.paginationModel}
						onPaginationModelChange={view.onPaginationModelChange}
						sortingMode="server"
						sortModel={view.sortModel}
						onSortModelChange={view.onSortModelChange}
						filterMode="server"
						filterModel={view.filterModel}
						onFilterModelChange={view.onFilterModelChange}
						columnVisibilityModel={view.columnVisibilityModel}
						onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
						columnLayout={view.columnLayout}
						rowGroupingModel={rowGroupingModel}
						onRowGroupingModelChange={setRowGroupingModel}
						groupingColDef={{
							headerName: t("audit_explorer.patron_request"),
							minWidth: 340,
						}}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="audits" />
						)}
						exportConfig={{
							query: getAudits,
							coreType: "audits",
							quickFilterFields: ["briefDescription"],
						}}
						disableAggregation
						disableHoverInteractions={false}
						disablePivoting
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible
						scrollbarVisible={false}
						noResultsText={t("audit_log.audit_log_no_rows")}
						searchText={t("audit_explorer.search_placeholder")}
						rowModesModel={rowModesModel}
						onRowModesModelChange={setRowModesModel}
					/>
				</Box>
			</Stack>
		</PageContainer>
	);
}
