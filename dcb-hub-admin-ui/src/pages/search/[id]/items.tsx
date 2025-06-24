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
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import { ExpandMore, InfoOutline } from "@mui/icons-material";
import { Item } from "@models/Item";
const Items: NextPage = () => {
	const { publicRuntimeConfig } = getConfig();
	const { data: session } = useSession();
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const [availabilityResults, setAvailabilityResults] = useState<any>({});
	const [comparisonResults, setComparisonResults] = useState<any>({});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [isItemsAccordionExpanded, setIsItemsAccordionExpanded] =
		useState(false);

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
		<AdminLayout title={t("search.items_title", { cluster: id })}>
			{error ? (
				<Error
					title={t("search.items_error_title")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.action.reload")}
					reload
				/>
			) : (
				<>
					<Stack direction="row"></Stack>
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
					{itemsNotShown?.length > 0 && !loading && (
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
					)}
				</>
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
