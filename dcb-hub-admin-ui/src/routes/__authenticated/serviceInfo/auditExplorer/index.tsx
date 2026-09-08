import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
	GridFilterModel,
	GridRowGroupingModel,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Link from "@components/Link/Link";
import AuditIncidenceChart from "@components/AuditIncidenceChart/AuditIncidenceChart";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import {
	buildServerGridQueryVars,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { containsOnly } from "@filters/containsOnly";
import { equalsOnly } from "@filters/equalsOnly";
import type { LoadAuditsQueryVariables } from "@generated/graphql";
import { getAudits } from "@queries/getAudits";
import { isAuditExplorerEnabled } from "@helpers/featureFlags";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/auditExplorer/",
)({
	// The nav entry is hidden while the flag is off, but the URL is still
	// typeable - and the page depends on dcb-service work this environment may
	// not serve yet, so block it here too.
	beforeLoad: () => {
		if (!isAuditExplorerEnabled()) {
			throw redirect({ to: "/serviceInfo" });
		}
	},
	component: AuditExplorer,
});

const gridId = "auditExplorer";
const DEFAULT_PAGE_SIZE = 50;
// The server search item this page owns. Kept out of the grid's own filter panel
// items so the search box and the panel never fight over one description filter.
const DESCRIPTION_FILTER_ID = "audit-description-search";

function AuditExplorer() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const {
		paginationModel,
		sortModel,
		filterModel,
		columnVisibilityModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange: handlePaginationChange,
		onSortModelChange: handleSortChange,
		onFilterModelChange: handleFilterChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: DEFAULT_PAGE_SIZE },
		sort: [{ field: "auditDate", sort: "desc" }],
	});

	// Group by owning patron request by default - the primary ask. Controlled so
	// the toolbar's grouping panel and the header toggle stay in sync.
	const [rowGroupingModel, setRowGroupingModel] =
		useState<GridRowGroupingModel>(["patronRequestId"]);

	// The brief-description search. Seeded once from any persisted description
	// filter so a returning user sees their term, then owned locally for lag-free
	// typing; committed (debounced) into the server filter model.
	const [searchValue, setSearchValue] = useState<string>(
		() =>
			(filterModel.items.find((item) => item.id === DESCRIPTION_FILTER_ID)
				?.value as string) ?? "",
	);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const commitDescription = useCallback(
		(value: string) => {
			const others = filterModel.items.filter(
				(item) => item.id !== DESCRIPTION_FILTER_ID,
			);
			const trimmed = value.trim();
			const nextModel: GridFilterModel = {
				...filterModel,
				items: trimmed
					? [
							...others,
							{
								id: DESCRIPTION_FILTER_ID,
								field: "briefDescription",
								operator: "contains",
								value: trimmed,
							},
						]
					: others,
			};
			handleFilterChange(nextModel);
		},
		[filterModel, handleFilterChange],
	);

	const handleSearchInput = useCallback(
		(value: string) => {
			setSearchValue(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => commitDescription(value), 400);
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

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any, LoadAuditsQueryVariables>(
				getAudits,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					defaultOrder: "auditDate",
					defaultPageSize: DEFAULT_PAGE_SIZE,
					quickFilterFields: ["briefDescription"],
				}),
			),
		placeholderData: (previousData) => previousData,
	});

	const totalSize = gridData?.audits?.totalSize ?? 0;

	// The exact Lucene query the grid is showing, minus paging/sort, so the
	// incidence chart's histogram always reflects the active search and filters.
	const incidenceQuery = useMemo(
		() => processGridFilterModel(filterModel, "", ["briefDescription"]),
		[filterModel],
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
						rows={gridData?.audits?.content ?? []}
						rowCount={totalSize}
						loading={isLoading || isFetching}
						paginationMode="server"
						pagination
						paginationModel={paginationModel}
						onPaginationModelChange={handlePaginationChange}
						sortingMode="server"
						sortModel={sortModel}
						onSortModelChange={handleSortChange}
						filterMode="server"
						filterModel={filterModel}
						onFilterModelChange={handleFilterChange}
						columnVisibilityModel={columnVisibilityModel}
						onColumnVisibilityModelChange={handleColumnVisibilityChange}
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
