import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import {
	Grid,
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Stack,
	Alert,
	Tooltip,
} from "@mui/material";
import { Bolt, ExpandMore } from "@mui/icons-material";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import CombinedRequestingModal from "@forms/CombinedRequestingModal/CombinedRequestingModal";

import { useGridView } from "@hooks/useGridView";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import { rememberedViewsRedirect } from "@helpers/viewState/viewRoute";
import {
	clusterItemsNotShownView,
	clusterItemsView,
	NOT_SHOWN_NAMESPACE,
} from "@constants/dataGrid/gridViews";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { getItemColumns } from "@columns/itemColumns";
import { Item } from "@models/Item";
import { lmsFanOutQuery } from "@helpers/queryPolicy";
import {
	GridActionsCellItem,
	GridColDef,
	GridRowModesModel,
	GridRowParams,
} from "@mui/x-data-grid-premium";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/items",
)({
	validateSearch: (search: Record<string, unknown>) =>
		validateGridSearch(search, [NOT_SHOWN_NAMESPACE]),
	beforeLoad: ({ search, location, params }) => {
		const restore = rememberedViewsRedirect(
			[clusterItemsView, clusterItemsNotShownView],
			search,
			location.state,
		);
		if (restore)
			throw redirect({ to: "/search/$clusterId/items", params, ...restore });
	},
	component: ItemsPageComponent,
});

function ItemsPageComponent() {
	const { clusterId } = Route.useParams();
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// Quick walk-up launched directly against an available item row. The scanned
	// barcode is pre-filled; the walk-up flow resolves the cluster server-side.
	const [showWalkUp, setShowWalkUp] = useState(false);
	const [walkUpBarcode, setWalkUpBarcode] = useState("");

	const [isItemsAccordionExpanded, setIsItemsAccordionExpanded] =
		useState(false);

	const itemsGridId = clusterItemsView.id;
	const itemsNotShownGridId = clusterItemsNotShownView.id;
	const search = useSearch({
		from: "/__authenticated/search/$clusterId/items",
	});

	const { data, isLoading } = useQuery({
		...lmsFanOutQuery,
		queryKey: ["clusterItems", clusterId],
		queryFn: async ({ signal }) => {
			// Fetch Standard and No-Filter concurrently.
			//
			// `signal` on both: dcb-service turns ONE of these into one request per Host
			// LMS to systems we do not own, and this fires two. Leaving a cluster before
			// they land otherwise leaves both fan-outs running to completion against
			// every member library, which is the amplification doctrine treats as a
			// security bug rather than a performance one.
			const [standardRes, noFilterRes] = await Promise.all([
				client.get<any>("/items/availability", {
					params: { clusteredBibId: clusterId },
					signal,
				}),
				client.get<any>("/items/availability", {
					params: { clusteredBibId: clusterId, filters: "none" },
					signal,
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
	const itemColumns = useMemo(() => getItemColumns(t), [t]);
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
					// Tooltip explains the action to sighted users (the icon alone is
					// ambiguous); the GridActionsCellItem `label` remains the button's
					// accessible name (aria-label). MUI Tooltip shows on hover AND focus
					// and is Esc-dismissable, satisfying WCAG 2.2 AA 1.4.13. The Fragment
					// wrapper is required because GridActionsCell only accepts
					// GridActionsCellItem or Fragment children - a bare Tooltip child is
					// dropped - but it unwraps Fragments without a type check.
					return [
						<Fragment key="quickWalkUp">
							<Tooltip title={t("requesting.quick_walk_up.actions.tooltip")}>
								<GridActionsCellItem
									icon={<Bolt />}
									label={t("requesting.quick_walk_up.actions.place")}
									onClick={() => {
										setWalkUpBarcode(item.barcode);
										setShowWalkUp(true);
									}}
								/>
							</Tooltip>
						</Fragment>,
					];
				},
			},
		],
		[itemColumns, t],
	);
	const itemsView = useGridView(
		clusterItemsView,
		itemColumnsWithWalkUp,
		search,
	);
	const notShownView = useGridView(
		clusterItemsNotShownView,
		itemColumns,
		search,
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
					filterModel={itemsView.filterModel}
					onFilterModelChange={itemsView.onFilterModelChange}
					columnVisibilityModel={itemsView.columnVisibilityModel}
					onColumnVisibilityModelChange={
						itemsView.onColumnVisibilityModelChange
					}
					columnLayout={itemsView.columnLayout}
					viewNotice={<GridViewNotice view={itemsView} />}
					rows={items}
					loading={isLoading}
					paginationMode="client"
					sortingMode="client"
					filterMode="client"
					pagination
					paginationModel={itemsView.paginationModel}
					onPaginationModelChange={itemsView.onPaginationModelChange}
					sortModel={itemsView.sortModel}
					onSortModelChange={itemsView.onSortModelChange}
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
								disablePivoting
								paginationMode="client"
								sortingMode="client"
								filterMode="client"
								pagination
								paginationModel={notShownView.paginationModel}
								onPaginationModelChange={notShownView.onPaginationModelChange}
								sortModel={notShownView.sortModel}
								onSortModelChange={notShownView.onSortModelChange}
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
