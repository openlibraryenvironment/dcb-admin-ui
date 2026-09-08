import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { defaultSupplierRequestColumnVisibility } from "@columns/columnVisibility/defaultSupplierRequestColumnVisibility";

import { libraryQuery } from "@/queryOptions/library";
import { allLibrariesQuery } from "@/queryOptions/libraries";
import { allLocationsQuery } from "@/queryOptions/locations";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import type { LoadPatronRequestsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/supplierRequests/all",
)({
	component: SupplierRequestsAll,
});

function SupplierRequestsAll() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const libraryMutation = useEntityMutation("library");
	const gridId = `supplierRequestsLibraryAll-${libraryId}`;

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
		pagination: { page: 0, pageSize: 20 },
		sort: [{ field: "dateCreated", sort: "desc" }],
		columnVisibility: defaultSupplierRequestColumnVisibility,
	});

	const {
		data: library,
		isLoading: isLibraryLoading,
		isError: isLibraryError,
	} = useQuery(libraryQuery(gqlClient, libraryId));

	const code = library?.agencyCode;

	const { data: librariesData } = useQuery(allLibrariesQuery(gqlClient));

	const { data: locationsData } = useQuery(allLocationsQuery(gqlClient));

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: locationsData ?? [],
		libraries: librariesData?.libraries?.content ?? [],
		variant: "standard",
	});

	const allColumns = useMemo(
		() => [...customColumns, ...dynamicPatronRequestColumns],
		[customColumns, dynamicPatronRequestColumns],
	);

	const {
		data: requestsData,
		isLoading: isRequestsLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, code, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const baseQuery = `supplyingAgencyCode: "${code}"`;
			return gqlClient.request<any, LoadPatronRequestsQueryVariables>(
				getPatronRequests,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					baseQuery,
					quickFilterFields: ["status", "description"],
					defaultOrder: "dateCreated",
					defaultPageSize: 20,
				}),
			);
		},
		enabled: !!code,
		placeholderData: (previousData) => previousData,
	});

	if (isLibraryLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("libraries.library"),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (isLibraryError || !library)
		return (
			<Error
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("ui.error.invalid_UUID")}
			/>
		);

	return (
		<PageContainer
			title={library?.fullName}
			pageActions={[
				libraryMutation.buildDeleteAction({
					id: libraryId,
					name: library?.fullName,
					redirect: "/libraries",
					disabled: !isAnAdmin,
					icon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
				}),
			]}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={5} />
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs value={0} sx={{ mb: 2 }}>
						<Tab
							label={t("libraries.patronRequests.all", { number: "" }).trim()}
						/>
					</Tabs>

					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
							mb: 2,
						}}
					>
						{t("libraries.patronRequests.all", {
							number: requestsData?.patronRequests?.totalSize ?? 0,
						})}
					</Typography>

					<DataGrid
						identifier={gridId}
						type="patronRequests"
						columns={allColumns}
						rows={requestsData?.patronRequests?.content ?? []}
						rowCount={requestsData?.patronRequests?.totalSize ?? 0}
						loading={isRequestsLoading || isFetching}
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
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						rowSelection
						exportConfig={{
							query: getPatronRequestsForExport,
							coreType: "patronRequests",
							baseQuery: `supplyingAgencyCode: "${code}"`,
							quickFilterFields: ["status", "description"],
							wizard: true,
						}}
						disableAggregation
						disableRowGrouping
						disableHoverInteractions={false}
						disablePivoting={true}
						rowModesModel={rowModesModel}
						onRowModesModelChange={setRowModesModel}
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible
						scrollbarVisible
						noResultsText={t("patron_requests.no_results")}
						searchText={t("patron_requests.search_placeholder_status")}
					/>
				</Grid>
			</Grid>
			<EntityMutationDialogs {...libraryMutation.dialogProps} />
		</PageContainer>
	);
}
