import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Typography, Alert } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getClusters } from "@queries/getClusters";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/identifiers",
)({
	component: Identifiers,
});

function Identifiers() {
	const { t } = useTranslation();
	const { clusterId } = Route.useParams();
	const gqlClient = useGraphQLClient();

	const gridId = "ClusterIdentifiers";
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
		pagination: { page: 0, pageSize: 25 },
		sort: [{ field: "title", sort: "asc" }],
	});

	const { data, isLoading, error } = useQuery({
		queryKey: ["cluster", "full", clusterId],
		queryFn: () =>
			gqlClient.request<any>(getClusters, { query: `id: ${clusterId}` }),
		enabled: !!clusterId,
	});

	const { rows, namespaces } = useMemo(() => {
		const cluster = data?.instanceClusters?.content?.[0];
		if (!cluster?.members) return { rows: [], namespaces: new Set<string>() };

		const namespacesSet = new Set<string>();
		const processedRows = cluster.members.map((member: any, index: number) => {
			const baseRow: Record<string, any> = {
				id: `${member.id}-${index}`,
				title: member.title || "",
				author: member.author || "",
				sourceRecordId: member.sourceRecordId || "",
				sourceSystemId: member.sourceSystemId || "",
			};

			const identifiers = member.canonicalMetadata?.identifiers || [];
			const groupedIdentifiers = identifiers.reduce(
				(acc: Record<string, string[]>, identifier: any) => {
					if (!acc[identifier.namespace]) acc[identifier.namespace] = [];
					acc[identifier.namespace].push(identifier.value);
					return acc;
				},
				{},
			);

			Object.entries(groupedIdentifiers).forEach(([namespace, values]) => {
				namespacesSet.add(namespace);
				baseRow[namespace] = (values as string[]).join("\n");
			});

			return baseRow;
		});

		return { rows: processedRows, namespaces: namespacesSet };
	}, [data]);

	const columns: GridColDef[] = useMemo(() => {
		const baseColumns: GridColDef[] = [
			{
				field: "title",
				headerName: t("ui.data_grid.title"),
				flex: 0.5,
				minWidth: 150,
			},
			{
				field: "author",
				headerName: t("search.author"),
				flex: 0.5,
				minWidth: 150,
			},
			{
				field: "sourceSystemId",
				headerName: t("bibRecords.source_system_uuid"),
				flex: 0.4,
				minWidth: 150,
			},
			{
				field: "sourceRecordId",
				headerName: t("bibRecords.source_record_id"),
				flex: 0.4,
				minWidth: 150,
			},
		];

		const namespaceColumns: GridColDef[] = Array.from(namespaces).map(
			(namespace) => ({
				field: namespace,
				headerName: namespace,
				flex: 1,
				minWidth: 150,
				type: "string",
			}),
		);

		return [...baseColumns, ...namespaceColumns];
	}, [namespaces, t]);

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.search.identifiers").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (error && !(error as any).message?.includes("Source emitted")) {
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.reload")}
				reload
				message={t("eerror")} /** TODO */
			/>
		);
	}

	return (
		<Grid
			container
			spacing={{ xs: 2, md: 3 }}
			columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
		>
			{(error as any)?.message?.includes("Source emitted") && (
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Alert severity="info" sx={{ mb: 2 }}>
						<Typography variant="attributeText">
							{t("search.cluster_bib_multiple_records")}
						</Typography>
					</Alert>
				</Grid>
			)}
			<Grid size={{ xs: 4, sm: 8, md: 12 }}>
				<DataGrid
					identifier={gridId}
					disablePivoting
					type="Identifiers"
					columns={columns}
					rows={rows}
					loading={isLoading}
					paginationMode="client"
					sortingMode="client"
					filterMode="client"
					pagination
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationChange}
					sortModel={sortModel}
					onSortModelChange={handleSortChange}
					filterModel={filterModel}
					onFilterModelChange={handleFilterChange}
					columnVisibilityModel={columnVisibilityModel}
					onColumnVisibilityModelChange={handleColumnVisibilityChange}
					checkboxSelection={false}
					disableAggregation
					disableRowGrouping
					disableHoverInteractions={false}
					listViewEnabled={false}
					pivotingEnabled={false}
					toolbarVisible
					scrollbarVisible={false}
					noResultsText={t("common.no_results")}
					searchText={t("general.search")}
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Grid>
		</Grid>
	);
}
