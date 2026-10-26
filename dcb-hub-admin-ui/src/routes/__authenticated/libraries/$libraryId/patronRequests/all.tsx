import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Typography, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";
import type { GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	rememberedViewRedirect,
	scopedView,
} from "@helpers/viewState/viewRoute";
import { libraryPatronRequestsAllView } from "@constants/dataGrid/gridViews";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import type { LoadPatronRequestsQueryVariables } from "@generated/graphql";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import LibraryPatronRequestSubTabs from "@components/LibraryPatronRequestSubTabs/LibraryPatronRequestSubTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";

import { libraryQuery } from "@/queryOptions/library";
import { allLibrariesQuery } from "@/queryOptions/libraries";
import { allLocationsQuery } from "@/queryOptions/locations";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/patronRequests/all",
)({
	validateSearch: validateGridSearch,
	beforeLoad: ({ search, location, params }) => {
		const restore = rememberedViewRedirect(
			scopedView(libraryPatronRequestsAllView, params.libraryId),
			search,
			location.state,
		);
		if (restore)
			throw redirect({
				to: "/libraries/$libraryId/patronRequests/all",
				params,
				...restore,
			});
	},
	component: PatronRequestsAll,
});

function PatronRequestsAll() {
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
	const gridView = useMemo(
		() => scopedView(libraryPatronRequestsAllView, libraryId),
		[libraryId],
	);
	const gridId = gridView.id;
	const search = useSearch({
		from: "/__authenticated/libraries/$libraryId/patronRequests/all",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const {
		data: library,
		isLoading: isLibraryLoading,
		isError: isLibraryError,
	} = useQuery(libraryQuery(gqlClient, libraryId));

	const code = library?.agency?.hostLms?.code;

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
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(allColumns),
		[allColumns],
	);
	const view = useGridView(gridView, viewColumns, search);

	const {
		data: requestsData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [
			gridId,
			code,
			view.paginationModel,
			view.sortModel,
			view.appliedFilterModel,
		],
		queryFn: async () => {
			const baseQuery = `patronHostlmsCode: "${code}"`;
			return gqlClient.request<any, LoadPatronRequestsQueryVariables>(
				getPatronRequests,
				buildServerGridQueryVars({
					filterModel: view.appliedFilterModel,
					sortModel: view.sortModel,
					paginationModel: view.paginationModel,
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

	// Nothing is rendered until the library is known, which is what the sibling
	// supplierRequests/all already did. Rendering the chrome first and letting it fill
	// in moved the whole body once the title, the tabs and the sub-tabs arrived:
	// measured 0.5048 of layout shift against a 0.05 budget, where the gated sibling
	// measured 0.0108.
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
					<LibraryTabs libraryId={libraryId} value={4} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryPatronRequestSubTabs
						libraryId={libraryId}
						code={code}
						activeBucket="all"
					/>

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
						viewNotice={<GridViewNotice view={view} />}
						rows={requestsData?.patronRequests?.content ?? []}
						rowCount={requestsData?.patronRequests?.totalSize ?? 0}
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
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						rowSelection
						exportConfig={{
							query: getPatronRequestsForExport,
							coreType: "patronRequests",
							baseQuery: `patronHostlmsCode: "${code}"`,
							quickFilterFields: ["status", "description"],
							wizard: true,
						}}
						disableAggregation
						disableRowGrouping
						disableHoverInteractions={false}
						disablePivoting={true} // REQUIRED PROP ADDED
						rowModesModel={rowModesModel} // REQUIRED PROP ADDED
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
