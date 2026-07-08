import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import dayjs from "dayjs";
import { Grid, Typography, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { handleDeleteEntity } from "@helpers/actions/editAndDeleteActions";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

import { getLibraryBasicsLocation } from "@queries/getLibraryBasicsLocation";
import { getBibs } from "@queries/getBibs";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import { libraryBibColumnVisibility } from "@columns/columnVisibility/libraryBibColumnVisibility";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/bibs/",
)({
	component: LibraryBibs,
});

function LibraryBibs() {
	const { t } = useTranslation();
	const router = useRouter();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gridId = "libraryBibs";

	const {
		paginationModel,
		filterModel,
		columnVisibilityModel,
		onPaginationModelChange: handlePaginationChange,
		onFilterModelChange: handleFilterChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		columnVisibility: libraryBibColumnVisibility,
	});

	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const {
		data: libraryData,
		isLoading: isLibraryLoading,
		isError: isLibraryError,
	} = useQuery({
		queryKey: ["library", "basicsLocation", libraryId],
		queryFn: () =>
			gqlClient.request<any>(getLibraryBasicsLocation, {
				query: `id:${libraryId}`,
				pageno: 0,
				pagesize: 100,
				order: "fullName",
				orderBy: "DESC",
			}),
		enabled: !!libraryId,
	});

	const library = libraryData?.libraries?.content?.[0];

	const presetQueryVariables = library?.secondHostLms
		? `sourceSystemId: ${library?.agency?.hostLms?.id} OR sourceSystemId: ${library?.secondHostLms?.id}`
		: `sourceSystemId: ${library?.agency?.hostLms?.id}`;

	const {
		data: gridData,
		isLoading: isGridLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, presetQueryVariables, paginationModel, filterModel],
		queryFn: async () => {
			return gqlClient.request<any>(
				getBibs,
				buildServerGridQueryVars({
					filterModel,
					sortModel: [{ field: "sourceRecordId", sort: "asc" }],
					paginationModel,
					baseQuery: presetQueryVariables,
					defaultOrder: "sourceRecordId",
					defaultPageSize: 20,
				}),
			);
		},
		enabled: !!library?.agency?.hostLms?.id,
		placeholderData: (previousData) => previousData,
	});

	const { mutateAsync: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryMutation, variables),
	});

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns.map((col) => ({ ...col, sortable: false })), // Enforce no sorting on custom columns too
			{
				field: "title",
				headerName: t("search.title"),
				minWidth: 150,
				flex: 0.6,
				sortable: false,
				filterOperators: standardFilters,
			},
			{
				field: "clusterRecordId",
				headerName: t("patron_request.cluster_record_uuid"),
				minWidth: 50,
				flex: 0.5,
				sortable: false,
				filterOperators: equalsOnly,
				filterable: false,
				valueGetter: (val, row: any) => row?.contributesTo?.id,
			},
			{
				field: "sourceRecordId",
				headerName: t("bibRecords.source_record_id"),
				minWidth: 50,
				sortable: false,
				filterOperators: standardFilters,
				flex: 0.5,
			},
			{
				field: "sourceSystemId",
				headerName: t("bibRecords.source_system_uuid"),
				minWidth: 50,
				sortable: false,
				filterOperators: equalsOnly,
				flex: 0.5,
			},
			{
				field: "id",
				headerName: t("bibRecords.source_bib_uuid"),
				minWidth: 100,
				flex: 0.5,
				sortable: false,
				filterOperators: equalsOnly,
			},
			{
				field: "processVersion",
				headerName: t("bibRecords.process_version"),
				minWidth: 100,
				flex: 0.5,
				sortable: false,
				filterOperators: equalsOnly,
			},
			{
				field: "dateUpdated",
				headerName: t("ui.info.date_updated"),
				minWidth: 100,
				flex: 0.5,
				sortable: false,
				filterOperators: luceneDateRangeOperators,
				type: "dateTime",
				valueGetter: (val, row: any) =>
					row.dateUpdated ? new Date(row.dateUpdated) : null,
				valueFormatter: (val: Date) =>
					val ? dayjs(val).format("YYYY-MM-DD HH:mm") : "",
			},
		],
		[customColumns, t],
	);

	if (isLibraryLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.bibs").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (isLibraryError || !library)
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message="TODO"
			/>
		);

	return (
		<PageContainer
			title={library.fullName}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("ui.reference.catalog_build")}
			pageActions={[
				{
					key: "delete",
					onClick: () => setConfirmationDeletion(true),
					disabled: !isAnAdmin,
					label: t("ui.data_grid.delete_entity", {
						entity: t("libraries.library").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
			]}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={8} />
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
							mb: 2,
						}}
					>
						{t("nav.bibs")}
					</Typography>

					<DataGrid
						identifier={gridId}
						type="libraryBibs"
						columns={columns}
						rows={gridData?.sourceBibs?.content ?? []}
						rowCount={gridData?.sourceBibs?.totalSize ?? 0}
						loading={isGridLoading || isFetching}
						paginationMode="server"
						pagination
						paginationModel={paginationModel}
						onPaginationModelChange={handlePaginationChange}
						sortingMode="server"
						sortModel={[{ field: "sourceRecordId", sort: "asc" }]} // Hardcoded to prevent frontend sorting state changes
						onSortModelChange={() => {}} // Disabled intentionally
						filterMode="server"
						filterModel={filterModel}
						onFilterModelChange={handleFilterChange}
						columnVisibilityModel={columnVisibilityModel}
						onColumnVisibilityModelChange={handleColumnVisibilityChange}
						checkboxSelection={false}
						disableAggregation
						disableRowGrouping
						disableHoverInteractions={false}
						disablePivoting={true}
						rowModesModel={{}} // No inline editing on bibs
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible
						scrollbarVisible={false}
						noResultsText={t("bibRecords.no_results")}
						searchText={t("bibRecords.search_placeholder")}
					/>
				</Grid>
			</Grid>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(r, c, u) => {
					handleDeleteEntity(
						libraryId,
						r,
						c,
						u,
						setAlert,
						deleteLibrary,
						t,
						router,
						library.fullName,
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={library.fullName}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</PageContainer>
	);
}
