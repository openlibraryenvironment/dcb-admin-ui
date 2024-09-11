import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import axios from "axios";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import MasterDetail from "@components/MasterDetail/MasterDetail";
const Items: NextPage = () => {
	const { publicRuntimeConfig } = getConfig();
	const { data: sess } = useSession();
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const [availabilityResults, setAvailabilityResults] = useState<any>({});

	useEffect(() => {
		const fetchRecords = async () => {
			try {
				const response = await axios.get<any[]>(
					`${publicRuntimeConfig.DCB_API_BASE}/items/availability`,
					{
						headers: { Authorization: `Bearer ${sess?.accessToken}` },
						params: {
							clusteredBibId: id,
							filters: "none",
						},
					},
				);
				setAvailabilityResults(response.data);
			} catch (error) {
				console.error("Error:", error);
			}
		};

		if (id && sess?.accessToken) {
			fetchRecords();
		}
	}, [sess, publicRuntimeConfig.DCB_API_BASE, id]);

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "id",
				headerName: "ID",
				minWidth: 50,
				flex: 0.3,
				filterable: false,
				sortable: false,
			},
			{
				field: "status",
				headerName: t("service.status"),
				minWidth: 100,
				filterable: false,
				sortable: false,
				flex: 0.5,
				valueGetter: (value, row) => row?.status?.code,
			},
			{
				field: "locationCode",
				headerName: t("details.location_code"),
				minWidth: 100,
				filterable: false,
				sortable: false,
				flex: 0.3,
				valueGetter: (value, row) => row?.location?.code,
			},
			{
				field: "isRequestable",
				headerName: t("search.requestable"),
				minWidth: 50,
				type: "boolean",
				filterable: false,
				sortable: false,
				flex: 0.3,
			},
			{
				field: "isSuppressed",
				headerName: t("search.suppressed"),
				minWidth: 50,
				type: "boolean",
				filterable: false,
				sortable: false,
				flex: 0.3,
			},
			{
				field: "holdCount",
				headerName: t("search.hold_count"),
				minWidth: 50,
				type: "number",
				filterable: false,
				sortable: false,
				flex: 0.3,
			},
			{
				field: "canonicalItemType",
				headerName: t("details.supplier_ctype"),
				minWidth: 150,
				filterable: false,
				sortable: false,
				flex: 0.5,
			},
			{
				field: "agencyCode",
				headerName: t("details.agency_code"),
				flex: 0.3,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) => row?.agency?.code,
			},
		],
		[t],
	);

	const rows = availabilityResults?.itemList || [];

	return (
		<AdminLayout title={`Items available for cluster ${id}`}>
			<DataGridPro
				rows={rows ?? []}
				columns={columns}
				getDetailPanelContent={({ row }) => (
					<MasterDetail type="items" row={row} />
				)}
				getDetailPanelHeight={() => "auto"}
				autoHeight
				sx={{
					"& .MuiDataGrid-detailPanel": {
						overflow: "hidden", // Prevent scrollbars in the detail panel
						height: "auto", // Adjust height automatically
					},
				}}
			/>
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
