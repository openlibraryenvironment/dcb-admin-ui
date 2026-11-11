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
	AlertTitle,
	List,
	ListItem,
	Tooltip,
} from "@mui/material";
import { Bolt, ExpandMore, ManageSearch } from "@mui/icons-material";
import { useAuth } from "react-oidc-context";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import CombinedRequestingModal from "@forms/CombinedRequestingModal/CombinedRequestingModal";
import LiveItemDialog from "@components/LiveItemDialog/LiveItemDialog";
import { canLookUpLive } from "@/queryOptions/liveItem";

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
import { clusterItemsQuery } from "@/queryOptions/clusterItems";
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

/** A consortium has tens of Host LMS: more lines than this is one failure repeated. */
const MAX_ERRORS_SHOWN = 10;

function ItemsPageComponent() {
	const { clusterId } = Route.useParams();
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// Quick walk-up launched directly against an available item row. The scanned
	// barcode is pre-filled; the walk-up flow resolves the cluster server-side.
	const [showWalkUp, setShowWalkUp] = useState(false);
	const [walkUpBarcode, setWalkUpBarcode] = useState("");

	const isAdmin = useAuth()?.user?.profile?.roles?.includes("ADMIN") ?? false;
	const [liveItem, setLiveItem] = useState<{
		hostLmsCode: string;
		barcode: string;
	} | null>(null);

	const [isItemsAccordionExpanded, setIsItemsAccordionExpanded] =
		useState(false);

	const itemsGridId = clusterItemsView.id;
	const itemsNotShownGridId = clusterItemsNotShownView.id;
	const search = useSearch({
		from: "/__authenticated/search/$clusterId/items",
	});

	const offered = useQuery({
		...clusterItemsQuery(client, clusterId, "offered"),
		enabled: !!clusterId,
	});
	// The second fan-out, to every member library again, only once someone asks what is missing
	const unfiltered = useQuery({
		...clusterItemsQuery(client, clusterId, "unfiltered"),
		enabled: !!clusterId && isItemsAccordionExpanded,
	});
	const isLoading = offered.isLoading;

	const items = offered.data?.itemList ?? [];
	// One line per distinct failure: a Host LMS that is down reports it for every item
	const availabilityErrors = useMemo(
		() =>
			[
				...new Set(
					(offered.data?.errors ?? []).map(
						(error) => error.message || t("ui.error.something_wrong"),
					),
				),
			].slice(0, MAX_ERRORS_SHOWN),
		[offered.data, t],
	);

	// Base item columns + a row action that skips straight to a pre-filled Quick
	// walk-up, but only for items that can actually be walked up (available,
	// requestable, not suppressed).
	const itemColumns = useMemo(() => getItemColumns(t), [t]);
	// ADMIN only: one click is two to four calls into a member library's system
	const lookUpAction = useMemo(
		() => (item: Item) =>
			isAdmin && canLookUpLive(item)
				? [
						<Fragment key="liveLookup">
							<Tooltip
								title={t("items.live_lookup.action", {
									barcode: item.barcode,
								})}
							>
								<GridActionsCellItem
									icon={<ManageSearch />}
									label={t("items.live_lookup.action", {
										barcode: item.barcode,
									})}
									onClick={() =>
										setLiveItem({
											hostLmsCode: item.hostLmsCode,
											barcode: item.barcode,
										})
									}
								/>
							</Tooltip>
						</Fragment>,
					]
				: [],
		[isAdmin, t],
	);
	const itemColumnsWithLookUp: GridColDef[] = useMemo(
		() =>
			isAdmin
				? [
						...itemColumns,
						{
							field: "lookUpAction",
							type: "actions",
							headerName: t("ui.data_grid.actions"),
							width: 80,
							getActions: (params: GridRowParams<Item>) =>
								lookUpAction(params.row),
						},
					]
				: itemColumns,
		[isAdmin, itemColumns, lookUpAction, t],
	);
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
					if (!canWalkUp) return lookUpAction(item);
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
						...lookUpAction(item),
					];
				},
			},
		],
		[itemColumns, lookUpAction, t],
	);
	const itemsView = useGridView(
		clusterItemsView,
		itemColumnsWithWalkUp,
		search,
	);
	const notShownView = useGridView(
		clusterItemsNotShownView,
		itemColumnsWithLookUp,
		search,
	);

	const itemsNotShown = useMemo(() => {
		if (!offered.data || !unfiltered.data) return [];
		const offeredIds = new Set(offered.data.itemList.map((i: Item) => i.id));
		return unfiltered.data.itemList.filter(
			(comparisonItem: Item) => !offeredIds.has(comparisonItem.id),
		);
	}, [offered.data, unfiltered.data]);

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
			{liveItem && (
				<LiveItemDialog
					hostLmsCode={liveItem.hostLmsCode}
					barcode={liveItem.barcode}
					onClose={() => setLiveItem(null)}
				/>
			)}
			{showWalkUp && (
				<CombinedRequestingModal
					show={showWalkUp}
					onClose={() => setShowWalkUp(false)}
					initialRequestType="quickWalkUp"
					initialItemBarcode={walkUpBarcode}
				/>
			)}
			<Grid size={{ xs: 4, sm: 8, md: 12 }}>
				{availabilityErrors.length > 0 && (
					<Alert severity="error" sx={{ mb: 2 }}>
						<AlertTitle>
							{t("requesting.shared_index.availability_errors")}
						</AlertTitle>
						<List dense disablePadding>
							{availabilityErrors.map((message) => (
								<ListItem key={message} disableGutters>
									{message}
								</ListItem>
							))}
						</List>
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
					disableHoverInteractions={false}
					listViewEnabled={false}
					toolbarVisible
					scrollbarVisible={false}
					noResultsText={t("requesting.items_not_found")}
					searchText={t("requesting.items_search")}
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Grid>

			{offered.data && (
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Accordion
						expanded={isItemsAccordionExpanded}
						onChange={() =>
							setIsItemsAccordionExpanded(!isItemsAccordionExpanded)
						}
					>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Typography variant="h6">
								{unfiltered.data
									? t("requesting.shared_index.items_not_shown", {
											number: itemsNotShown.length,
										})
									: t("requesting.shared_index.items_not_shown_check")}
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<div role="status" aria-live="polite">
								{unfiltered.isPending && (
									<Typography>
										{t("requesting.shared_index.items_not_shown_loading")}
									</Typography>
								)}
								{unfiltered.isError && (
									<Alert severity="error">
										{t("requesting.shared_index.items_not_shown_failed")}
									</Alert>
								)}
								{unfiltered.data && itemsNotShown.length === 0 && (
									<Typography>
										{t("requesting.shared_index.items_not_shown_none")}
									</Typography>
								)}
							</div>
							{itemsNotShown.length > 0 && (
								<>
									<Typography sx={{ mb: 2 }}>
										{t("requesting.shared_index.items_not_shown_resolution")}
									</Typography>
									<DataGrid
										identifier={itemsNotShownGridId}
										type="Items"
										columns={itemColumnsWithLookUp}
										rows={itemsNotShown}
										loading={isLoading}
										paginationMode="client"
										sortingMode="client"
										filterMode="client"
										pagination
										paginationModel={notShownView.paginationModel}
										onPaginationModelChange={
											notShownView.onPaginationModelChange
										}
										sortModel={notShownView.sortModel}
										onSortModelChange={notShownView.onSortModelChange}
										getDetailPanelContent={({ row }: any) => (
											<MasterDetail type="items" row={row} />
										)}
										disableHoverInteractions={false}
										listViewEnabled={false}
										toolbarVisible={false}
										scrollbarVisible={false}
										noResultsText={t("requesting.items_not_found")}
										searchText={t("requesting.items_search")}
										rowModesModel={rowModesModel}
										onRowModesModelChange={setRowModesModel}
									/>
								</>
							)}
						</AccordionDetails>
					</Accordion>
				</Grid>
			)}
		</Grid>
	);
}
