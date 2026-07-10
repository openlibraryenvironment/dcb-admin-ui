import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import axios from "axios";
import {
	Grid,
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Stack,
	Alert,
} from "@mui/material";
import { Bolt, ExpandMore } from "@mui/icons-material";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import CombinedRequestingModal from "@forms/CombinedRequestingModal/CombinedRequestingModal";

import { useGridStore } from "@/hooks/useDataGridStore";
import { itemColumns } from "@columns/itemColumns";
import { Item } from "@models/Item";
import {
	GridActionsCellItem,
	GridColDef,
	GridPaginationModel,
	GridRowModesModel,
	GridRowParams,
} from "@mui/x-data-grid-premium";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/items",
)({
	component: ItemsPageComponent,
});

function ItemsPageComponent() {
	const { clusterId } = Route.useParams();
	const { t } = useTranslation();
	const auth = useAuth();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// Quick walk-up launched directly against an available item row. The scanned
	// barcode is pre-filled; the walk-up flow resolves the cluster server-side.
	const [showWalkUp, setShowWalkUp] = useState(false);
	const [walkUpBarcode, setWalkUpBarcode] = useState("");

	const [isItemsAccordionExpanded, setIsItemsAccordionExpanded] =
		useState(false);

	const itemsGridId = "ClusterRecordItems";
	const itemsNotShownGridId = "ClusterRecordItemsNotShown";

	const { paginationModel, setPaginationModel, sortModel, setSortModel } =
		useGridStore();

	const { data, isLoading } = useQuery({
		queryKey: ["clusterItems", clusterId],
		queryFn: async () => {
			const headers = { Authorization: `Bearer ${auth.user?.access_token}` };
			const baseUrl = `${import.meta.env.VITE_DCB_API_BASE}/items/availability`;

			// Fetch Standard and No-Filter concurrently
			const [standardRes, noFilterRes] = await Promise.all([
				axios.get<any>(baseUrl, {
					headers,
					params: { clusteredBibId: clusterId },
				}),
				axios.get<any>(baseUrl, {
					headers,
					params: { clusteredBibId: clusterId, filters: "none" },
				}),
			]);

			return {
				standard: standardRes.data?.itemList || [],
				noFilter: noFilterRes.data?.itemList || [],
				errors: standardRes.data?.errors || [], // Assuming backend attaches diagnostic errors here
			};
		},
		enabled: !!clusterId,
	});

	const items = data?.standard || [];

	// Base item columns + a row action that skips straight to a pre-filled Quick
	// walk-up, but only for items that can actually be walked up (available,
	// requestable, not suppressed).
	const itemColumnsWithWalkUp: GridColDef[] = useMemo(
		() => [
			...itemColumns,
			{
				field: "walkUpAction",
				type: "actions",
				headerName: t("ui.data_grid.actions"),
				width: 120,
				getActions: (params: GridRowParams<Item>) => {
					const item = params.row;
					const canWalkUp =
						!!item?.barcode &&
						item.isRequestable &&
						!item.isSuppressed &&
						item.status?.code === "AVAILABLE";
					if (!canWalkUp) return [];
					return [
						<GridActionsCellItem
							key="quickWalkUp"
							icon={<Bolt />}
							label={t("requesting.quick_walk_up.actions.place")}
							onClick={() => {
								setWalkUpBarcode(item.barcode);
								setShowWalkUp(true);
							}}
						/>,
					];
				},
			},
		],
		[t],
	);

	const itemsNotShown = useMemo(() => {
		if (!data) return [];
		const standardIds = new Set(data.standard.map((i: Item) => i.id));
		return data.noFilter.filter(
			(comparisonItem: Item) => !standardIds.has(comparisonItem.id),
		);
	}, [data]);

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("requesting.items"),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);

	return (
		<Grid
			container
			spacing={{ xs: 2, md: 3 }}
			columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
		>
			{showWalkUp && (
				<CombinedRequestingModal
					show={showWalkUp}
					onClose={() => setShowWalkUp(false)}
					initialRequestType="quickWalkUp"
					initialItemBarcode={walkUpBarcode}
				/>
			)}
			<Grid size={{ xs: 4, sm: 8, md: 12 }}>
				{data?.errors?.length > 0 && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{t("ui.error.something_wrong")}
					</Alert>
				)}
				{items.length === 0 && (
					<Alert severity="info" sx={{ mb: 2 }}>
						{t("requesting.live_availability_no_items")}
					</Alert>
				)}

				<Stack direction="column" sx={{ mb: 2 }}>
					{items.length > 0 && (
						<Typography variant="h4">
							{t("requesting.shared_index.items_for_cluster", {
								number: items.length,
							})}
						</Typography>
					)}
					{itemsNotShown.length > 0 && (
						<Typography variant="h4">
							{t("requesting.shared_index.items_not_shown_long", {
								number: itemsNotShown.length,
								id: clusterId,
							})}
						</Typography>
					)}
				</Stack>

				<DataGrid
					identifier={itemsGridId}
					type="Items"
					columns={itemColumnsWithWalkUp}
					rows={items}
					loading={isLoading}
					paginationMode="client"
					sortingMode="client"
					filterMode="client"
					checkboxSelection={false}
					pagination
					paginationModel={
						paginationModel[itemsGridId] ?? { page: 0, pageSize: 25 }
					}
					onPaginationModelChange={(model: GridPaginationModel) =>
						setPaginationModel(itemsGridId, model)
					}
					sortModel={
						sortModel[itemsGridId] ?? [
							{ field: "availabilityDate", sort: "desc" },
						]
					}
					onSortModelChange={(model) => setSortModel(itemsGridId, model)}
					getDetailPanelContent={({ row }: any) => (
						<MasterDetail type="items" row={row} />
					)}
					disableAggregation
					disableRowGrouping
					disableHoverInteractions={false}
					listViewEnabled={false}
					pivotingEnabled={false}
					disablePivoting
					toolbarVisible
					scrollbarVisible={false}
					noResultsText={t("requesting.items_not_found")}
					searchText={t("requesting.items_search")}
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Grid>

			{itemsNotShown.length > 0 && (
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Accordion
						expanded={isItemsAccordionExpanded}
						onChange={() =>
							setIsItemsAccordionExpanded(!isItemsAccordionExpanded)
						}
					>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Typography variant="h6">
								{t("requesting.shared_index.items_not_shown", {
									number: itemsNotShown.length,
								})}
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Typography sx={{ mb: 2 }}>
								{t("requesting.shared_index.items_not_shown_resolution")}
							</Typography>
							<DataGrid
								identifier={itemsNotShownGridId}
								type="Items"
								columns={itemColumns}
								rows={itemsNotShown}
								loading={isLoading}
								checkboxSelection={false}
								disablePivoting
								paginationMode="client"
								sortingMode="client"
								filterMode="client"
								pagination
								paginationModel={
									paginationModel[itemsNotShownGridId] ?? {
										page: 0,
										pageSize: 25,
									}
								}
								onPaginationModelChange={(model: GridPaginationModel) =>
									setPaginationModel(itemsNotShownGridId, model)
								}
								sortModel={
									sortModel[itemsNotShownGridId] ?? [
										{ field: "availabilityDate", sort: "desc" },
									]
								}
								onSortModelChange={(model) =>
									setSortModel(itemsNotShownGridId, model)
								}
								getDetailPanelContent={({ row }: any) => (
									<MasterDetail type="items" row={row} />
								)}
								disableAggregation
								disableRowGrouping
								disableHoverInteractions={false}
								listViewEnabled={false}
								pivotingEnabled={false}
								toolbarVisible={false}
								scrollbarVisible={false}
								noResultsText={t("requesting.items_not_found")}
								searchText={t("requesting.items_search")}
								rowModesModel={rowModesModel}
								onRowModesModelChange={setRowModesModel}
							/>
						</AccordionDetails>
					</Accordion>
				</Grid>
			)}
		</Grid>
	);
}
