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
const Items: NextPage = () => {
	const { publicRuntimeConfig } = getConfig();
	const { data: session } = useSession();
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const [availabilityResults, setAvailabilityResults] = useState<any>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		const fetchRecords = async () => {
			setLoading(true);
			try {
				const response = await axios.get<any[]>(
					`${publicRuntimeConfig.DCB_API_BASE}/items/availability`,
					{
						headers: { Authorization: `Bearer ${session?.accessToken}` },
						params: {
							clusteredBibId: id,
						},
					},
				);
				setLoading(false);
				setAvailabilityResults(response.data);
			} catch (error) {
				console.error("Error:", error);
				setLoading(false);
				setError(true);
			}
		};

		if (id && session?.accessToken) {
			fetchRecords();
		}
	}, [session?.accessToken, publicRuntimeConfig.DCB_API_BASE, id]);

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
