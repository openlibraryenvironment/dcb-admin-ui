import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Button, Tooltip, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Import from "@components/Import/Import";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import NewMapping from "@forms/NewMapping/NewMapping";

import { useMappingGridState } from "@/hooks/useMappingGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { standardRefValueMappingColumns } from "@columns/referenceValueMappingColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";

import { getMappings } from "@queries/getMappings";
import { getHostLmsCodes } from "@queries/getHostLmsCodes";
import type {
	LoadHostLmsCodesQueryVariables,
	LoadMappingsQueryVariables,
} from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/mappings/allReferenceValue/",
)({
	component: ReferenceValueMappingsRoute,
});

function ReferenceValueMappingsRoute() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gridId = "referenceValueMappings";

	// is this really better?
	const {
		paginationModel,
		handlePaginationChange,
		filterModel,
		handleFilterChange,
		sortModel,
		handleSortChange,
		columnVisibilityModel,
		handleColumnVisibilityChange,
		rowModesModel,
		setRowModesModel,
		showImport,
		setImport,
		showNewMapping,
		setNewMapping,
	} = useMappingGridState(gridId, { lastImported: false, toCategory: false });

	const mappingMutation = useEntityMutation("referenceValueMapping");

	// This page is consortium-wide, so it has no library to take a Host LMS code
	// from. The new-mapping form still needs the set of contexts a mapping can be
	// scoped to, so fetch the codes and hand it the full list.
	const { data: hostLmsData } = useQuery({
		queryKey: ["hostLmsCodes"],
		queryFn: () =>
			gqlClient.request<any, LoadHostLmsCodesQueryVariables>(getHostLmsCodes, {
				query: "",
				pagesize: 1000,
			}),
		staleTime: 1000 * 60 * 5,
	});
	const hostLmsCodes: string[] = useMemo(
		() =>
			(hostLmsData?.hostLms?.content ?? [])
				.map((hostLms: { code: string }) => hostLms.code)
				.filter(Boolean),
		[hostLmsData],
	);

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			return gqlClient.request<any, LoadMappingsQueryVariables>(
				getMappings,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					baseQuery: "(fromContext: * AND NOT deleted:true)",
					defaultOrder: "lastImported",
					defaultPageSize: 20,
				}),
			);
		},
		placeholderData: (previousData) => previousData,
	});

	const actionsColumn: GridColDef[] = useMemo(
		() => [
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id) =>
					mappingMutation.requestDelete({
						id: id as string,
						name: t("mappings.ref_value_one"),
					}),
				canEdit: isAnAdmin,
			}),
		],
		[rowModesModel, isAnAdmin, t, setRowModesModel, mappingMutation],
	);

	const columns = useMemo(
		() => [...standardRefValueMappingColumns, ...actionsColumn],
		[actionsColumn],
	);

	return (
		<PageContainer title={t("nav.mappings.allReferenceValue")}>
			<Stack spacing={4} direction="row" sx={{ mb: 3 }}>
				<Button
					variant="outlined"
					onClick={() => setNewMapping(true)}
					disabled={!isAnAdmin}
				>
					{t("mappings.new.title")}
				</Button>
				<Tooltip title={isAnAdmin ? "" : t("mappings.import_disabled")}>
					<span>
						<Button
							variant="contained"
							onClick={() => setImport(true)}
							disabled={!isAnAdmin}
						>
							{t("mappings.import")}
						</Button>
					</span>
				</Tooltip>
			</Stack>

			<DataGrid
				identifier={gridId}
				type={"referenceValueMappings"}
				columns={columns}
				rows={gridData?.referenceValueMappings?.content ?? []}
				rowCount={gridData?.referenceValueMappings?.totalSize ?? 0}
				loading={gridLoading || (isFetching && !!gridData)}
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
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				processRowUpdate={mappingMutation.requestGridEdit}
				rowSelection
				exportConfig={{
					query: getMappings,
					coreType: "referenceValueMappings",
					baseQuery: "(fromContext: * AND NOT deleted:true)",
					wizard: true,
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("mappings.no_results")}
				searchText={t("ui.data_grid.search")}
			/>

			<EntityMutationDialogs {...mappingMutation.dialogProps} />
			{showNewMapping && (
				<NewMapping
					show={showNewMapping}
					onClose={() => {
						setNewMapping(false);
						queryClient.invalidateQueries({ queryKey: [gridId] });
					}}
					category=""
					hostLmsCode=""
					agencyCode=""
					libraryName=""
					hostLmsCodes={hostLmsCodes}
				/>
			)}
			{showImport && (
				<Import
					show={showImport}
					onClose={() => {
						setImport(false);
						queryClient.invalidateQueries({ queryKey: [gridId] });
					}}
					type="Reference value mappings"
				/>
			)}
		</PageContainer>
	);
}
