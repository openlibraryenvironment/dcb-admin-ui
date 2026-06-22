import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridRowModesModel,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";
import { handleDeleteEntity } from "@helpers/actions/editAndDeleteActions";
import { defaultPatronRequestLibraryColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestLibraryColumnVisibility";

import { getLibrary } from "@queries/getLibrary";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import { getLibraries } from "@queries/getLibraries";
import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import { getPatronRequests } from "@queries/getPatronRequests";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/patronRequests/active",
)({
	component: PatronRequestsActive,
});

function PatronRequestsActive() {
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

	const gridId = "patronRequestsLibraryActive";

	const {
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		paginationModel: storedPaginationModel,
		columnVisibilityModel: storedColumnVisibilityModel,
		setSortModel,
		setFilterModel,
		setPaginationModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedPaginationModel[gridId] ?? { page: 0, pageSize: 20 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedFilterModel[gridId] ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedSortModel[gridId] ?? [{ field: "dateCreated", sort: "desc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedColumnVisibilityModel[gridId] ??
				defaultPatronRequestLibraryColumnVisibility,
		);

	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const { data: libraryData } = useQuery({
		queryKey: ["library", libraryId],
		queryFn: () =>
			gqlClient.request<any>(getLibrary, { query: `id:${libraryId}` }),
		enabled: !!libraryId,
	});

	const library = libraryData?.libraries?.content?.[0];
	const code = library?.agency?.hostLms?.code;

	const { data: librariesData } = useQuery({
		queryKey: ["allLibrariesDictionary"],
		queryFn: () =>
			gqlClient.request<any>(getLibraries, {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
		staleTime: 1000 * 60 * 30,
	});

	const { data: locationsData } = useQuery({
		queryKey: ["allLocationsDictionary"],
		queryFn: () =>
			gqlClient.request<any>(getLocationForPatronRequestGrid, {
				query: "",
				order: "name",
				orderBy: "ASC",
				pagesize: 1000,
				pageno: 0,
			}),
		staleTime: 1000 * 60 * 30,
	});

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: locationsData?.locations?.content ?? [],
		libraries: librariesData?.libraries?.content ?? [],
		variant: "standard",
	});

	const allColumns = useMemo(
		() => [...customColumns, ...dynamicPatronRequestColumns],
		[customColumns, dynamicPatronRequestColumns],
	);

	const {
		data: requestsData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, code, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const baseQuery = `patronHostlmsCode: "${code}" AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:false`;
			const queryVariables = {
				query:
					processGridFilterModel(filterModel, baseQuery, [
						"status",
						"description",
					]) ?? "",
				pageno: paginationModel.page ?? 0,
				pagesize: paginationModel.pageSize ?? 20,
				order: sortModel[0]?.field ?? "dateCreated",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "DESC",
			};
			return gqlClient.request<any>(getPatronRequests, queryVariables);
		},
		enabled: !!code,
		placeholderData: (previousData) => previousData,
	});

	const { mutateAsync: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryMutation, variables),
	});

	const handlePaginationChange = useCallback(
		(model: GridPaginationModel) => {
			setLocalPaginationModel(model);
			setPaginationModel(gridId, model);
		},
		[gridId, setPaginationModel],
	);
	const handleSortChange = useCallback(
		(model: GridSortModel) => {
			setLocalSortModel(model);
			setSortModel(gridId, model);
		},
		[gridId, setSortModel],
	);
	const handleFilterChange = useCallback(
		(model: GridFilterModel) => {
			setLocalFilterModel(model);
			setFilterModel(gridId, model);
		},
		[gridId, setFilterModel],
	);
	const handleColumnVisibilityChange = useCallback(
		(model: GridColumnVisibilityModel) => {
			setLocalColumnVisibilityModel(model);
			setColumnVisibilityModel(gridId, model);
		},
		[gridId, setColumnVisibilityModel],
	);

	const handleSubTabChange = (_: React.SyntheticEvent, val: number) => {
		const routes = ["all", "outOfSequence", "active", "completed", "exception"];
		router.navigate({
			to: `/libraries/${libraryId}/patronRequests/${routes[val]}`,
		});
	};

	return (
		<PageContainer
			title={library?.fullName}
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
					<Tabs
						value={2}
						onChange={(_, val) =>
							router.navigate({
								to: [
									`/libraries/${libraryId}`,
									`/libraries/${libraryId}/contacts`,
									`/libraries/${libraryId}/patronRequests/all`,
								][val],
							})
						}
					>
						<Tab label={t("nav.libraries.profile")} />
						<Tab label={t("nav.libraries.contacts")} />
						<Tab label={t("nav.libraries.patronRequests")} />
					</Tabs>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs value={2} onChange={handleSubTabChange} sx={{ mb: 2 }}>
						<Tab
							label={t("libraries.patronRequests.all", { number: "" }).trim()}
						/>
						<Tab
							label={t("libraries.patronRequests.out_of_sequence", {
								number: "",
							}).trim()}
						/>
						<Tab
							label={t("libraries.patronRequests.active", {
								number: "",
							}).trim()}
						/>
						<Tab
							label={t("libraries.patronRequests.completed", {
								number: "",
							}).trim()}
						/>
						<Tab
							label={t("libraries.patronRequests.exception", {
								number: "",
							}).trim()}
						/>
					</Tabs>

					<Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
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
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						checkboxSelection={true}
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
						library?.fullName,
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={library?.fullName}
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
