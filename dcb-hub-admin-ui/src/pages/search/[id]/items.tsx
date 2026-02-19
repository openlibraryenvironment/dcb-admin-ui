import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import { useEffect, useState, useMemo } from "react";
import Error from "@components/Error/Error";
import { useRouter } from "next/router";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
} from "@mui/x-data-grid-premium";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";
import dayjs from "dayjs";
import { ClientDataGrid } from "@components/ClientDataGrid";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Grid,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { ExpandMore, InfoOutline } from "@mui/icons-material";
import { Item } from "@models/Item";
import { handleRecordTabChange } from "src/helpers/navigation/handleTabChange";
import { getClustersTitleOnly } from "src/queries/queries";
import { useQuery } from "@apollo/client";
const Items: NextPage = () => {
	const { publicRuntimeConfig } = getConfig();
	const { data: session } = useSession();
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const [availabilityResults, setAvailabilityResults] = useState<any>({});
	const [comparisonResults, setComparisonResults] = useState<any>({});
	const [tabIndex, setTabIndex] = useState(2);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [isItemsAccordionExpanded, setIsItemsAccordionExpanded] =
		useState(false);
	const {
		loading: clusterLoading,
		error: clusterError,
		data: clusterData,
	} = useQuery(getClustersTitleOnly, {
		variables: { query: `id: ${id}` },
		skip: !id,
		errorPolicy: "all",
	});
	useEffect(() => {
		const fetchRecords = async () => {
			if (!id || !session?.accessToken) return;
			setLoading(true);
			setError(false);
			try {
				const standardRequest = axios.get<any[]>(
					`${publicRuntimeConfig.DCB_API_BASE}/items/availability`,
					{
						headers: { Authorization: `Bearer ${session?.accessToken}` },
						params: { clusteredBibId: id },
					},
				);

				const noFilterRequest = axios.get<any[]>(
					`${publicRuntimeConfig.DCB_API_BASE}/items/availability`,
					{
						headers: { Authorization: `Bearer ${session?.accessToken}` },
						params: { clusteredBibId: id, filters: "none" },
					},
				);

				const [standardResponse, noFilterResponse] = await Promise.all([
					standardRequest,
					noFilterRequest,
				]);

				setAvailabilityResults(standardResponse.data);
				setComparisonResults(noFilterResponse.data);
			} catch (err) {
				console.error("Error fetching item data:", err);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		fetchRecords();
	}, [publicRuntimeConfig.DCB_API_BASE, id, session?.accessToken]);

	const itemsNotShown = useMemo(() => {
		if (!availabilityResults.itemList || !comparisonResults.itemList) {
			if (comparisonResults?.itemList) {
				return comparisonResults?.itemList;
			} else return [];
		}

		const availabilityItemIds = new Set(
			availabilityResults?.itemList.map((item: Item) => item.id),
		);

		return comparisonResults?.itemList.filter(
			(comparisonItem: Item) => !availabilityItemIds.has(comparisonItem.id),
		);
	}, [availabilityResults, comparisonResults]);

	const columns: GridColDef[] = useMemo(
		() => [
			{
				...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
				headerName: t("ui.data_grid.master_detail"),
				renderCell: (params) => (
					<DetailPanelToggle id={params.id} value={params.value} />
				),
				renderHeader: () => <DetailPanelHeader />,
			},
			{
				field: "agencyCode",
				headerName: t("details.agency_code"),
				flex: 0.3,
				valueGetter: (value, row) => row?.agency?.code ?? "-",
			},
			{
				field: "id",
				headerName: t("search.item_id"),
				minWidth: 50,
				flex: 0.3,
			},
			{
				field: "status",
				headerName: t("service.status"),
				minWidth: 100,
				flex: 0.4,
				valueGetter: (value, row) => row?.status?.code,
			},
			{
				field: "isRequestable",
				headerName: t("search.requestable"),
				minWidth: 50,
				type: "boolean",
				flex: 0.3,
			},
			{
				field: "isSuppressed",
				headerName: t("search.suppressed"),
				minWidth: 50,
				type: "boolean",
				flex: 0.3,
			},
			{
				field: "holdCount",
				headerName: t("search.hold_count"),
				minWidth: 50,
				type: "number",
				flex: 0.3,
			},
			{
				field: "dueDate",
				headerName: t("search.date_due"),
				minWidth: 100,
				flex: 0.4,
				valueGetter: (value: any, row: { dueDate: string }) => {
					const dateDue = row?.dueDate;
					return dateDue ? dayjs(dateDue).format("YYYY-MM-DD") : "-";
				},
			},
			{
				field: "availabilityDate",
				headerName: t("search.date_available"),
				minWidth: 100,
				flex: 0.4,
				valueGetter: (value: any, row: { availabilityDate: string }) => {
					const dateAvailable = row?.availabilityDate;
					return dateAvailable
						? dayjs(dateAvailable).format("YYYY-MM-DD")
						: "-";
				},
			},
			{
				field: "canonicalItemType",
				headerName: t("details.supplier_ctype"),
				minWidth: 100,
				flex: 0.5,
			},
		],
		[t],
	);

	const rows = availabilityResults?.itemList || [];

	return (
		<AdminLayout
			title={t("search.items_title", {
				cluster:
					clusterError || clusterLoading
						? id
						: clusterData?.instanceClusters?.content?.[0]?.title,
			})}
		>
			{error ? (
				<Error
					title={t("search.items_error_title")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.action.reload")}
					reload
				/>
			) : (
				<Grid
					container
					spacing={{ xs: 2, md: 3 }}
					columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				>
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<Tabs
							value={tabIndex}
							onChange={(event, value) => {
								handleRecordTabChange(
									event,
									value,
									router,
									setTabIndex,
									id as string,
								);
							}}
							aria-label="Group navigation"
						>
							<Tab label={t("nav.search.cluster")} />
							<Tab label={t("nav.search.cluster_explainer")} />
							<Tab label={t("nav.search.items")} />
							<Tab label={t("nav.search.identifiers")} />
							<Tab label={t("nav.search.requesting_history")} />
						</Tabs>
					</Grid>
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<ClientDataGrid
							data={rows ?? []}
							columns={columns}
							getDetailPanelContent={({ row }: any) => (
								<MasterDetail type="items" row={row} />
							)}
							loading={loading}
							disableAggregation={true}
							disableRowGrouping={true}
							type="Items"
							coreType="Items"
							operationDataType="Items"
							selectable={false}
						/>
					</Grid>
					{itemsNotShown?.length > 0 && !loading && (
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Accordion
								expanded={isItemsAccordionExpanded}
								onChange={() =>
									setIsItemsAccordionExpanded(!isItemsAccordionExpanded)
								}
								sx={{ mt: 2 }}
							>
								<AccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="items-not-shown-content"
									id="not-shown-header"
								>
									<Typography variant="h6">
										{t("search.items_not_shown", {
											number: itemsNotShown.length,
										})}
									</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack spacing={1} direction="column">
										<Typography>
											{t("search.items_not_shown_resolution")}
										</Typography>
										<List dense>
											<ListItem>
												<ListItemIcon>
													<InfoOutline />
												</ListItemIcon>
												<ListItemText
													primary={t("search.items_not_shown_helper_item")}
												/>
											</ListItem>
											<ListItem>
												<ListItemIcon>
													<InfoOutline />
												</ListItemIcon>
												<ListItemText
													primary={t("search.items_not_shown_helper_location")}
												/>
											</ListItem>
										</List>
										<ClientDataGrid
											data={itemsNotShown ?? []}
											columns={columns}
											getDetailPanelContent={({ row }: any) => (
												<MasterDetail type="items" row={row} />
											)}
											loading={loading}
											disableAggregation={true}
											disableRowGrouping={true}
											type="ItemsNotShown"
											coreType="Items"
											operationDataType="Items"
											selectable={false}
										/>
									</Stack>
								</AccordionDetails>
							</Accordion>
						</Grid>
					)}
				</Grid>
			)}
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	const { locale } = context;

	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
};

export default Items;
