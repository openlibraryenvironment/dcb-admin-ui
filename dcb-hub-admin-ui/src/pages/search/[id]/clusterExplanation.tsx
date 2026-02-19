import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import axios from "axios";
import { useTranslation } from "next-i18next";
import { Chip, Grid, Tab, Tabs } from "@mui/material";
import Error from "@components/Error/Error";
import { CheckCircle, Warning, Info } from "@mui/icons-material";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
} from "@mui/x-data-grid-premium";
import { parseClusteringAuditLog } from "src/helpers/parseClusteringAuditLog";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { AdminLayout } from "@layout";
import { handleRecordTabChange } from "src/helpers/navigation/handleTabChange";
import { useRouter } from "next/router";
import { GetServerSideProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getClustersTitleOnly } from "src/queries/queries";
import { useQuery } from "@apollo/client";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";
import { defaultClusterExplanationVisibility } from "src/helpers/DataGrid/columns";

const ExplainClustering: NextPage = () => {
	const [tabIndex, setTabIndex] = useState(1);

	const { data: session } = useSession();
	const { publicRuntimeConfig } = getConfig();
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;

	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<any>(null);
	const [error, setError] = useState<boolean>(false);
	const {
		loading: clusterLoading,
		error: clusterError,
		data: clusterData,
	} = useQuery(getClustersTitleOnly, {
		variables: { query: `id: ${id}` },
		skip: !id,
		errorPolicy: "all",
	});

	const fetchAuditLog = useCallback(async () => {
		// Don't run if we don't have what we need
		if (!id || !session?.accessToken) return;

		setLoading(true);
		setError(false);
		try {
			const response = await axios.get(
				`${publicRuntimeConfig.DCB_API_BASE}/clusters/${id}/audit-log`,
				{
					headers: { Authorization: `Bearer ${session.accessToken}` },
				},
			);
			setData(response.data);
		} catch (err) {
			console.error(err);
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [id, session?.accessToken, publicRuntimeConfig.DCB_API_BASE]);

	useEffect(() => {
		if (id) {
			fetchAuditLog();
		}
	}, [id, fetchAuditLog]);

	const rows = useMemo(() => parseClusteringAuditLog(data), [data]);

	// fix weird stuff with the toggles
	const columns: GridColDef[] = [
		{
			...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
			headerName: t("ui.data_grid.master_detail"),
			renderCell: (params) => (
				<DetailPanelToggle id={params.id} value={params.value} />
			),
			renderHeader: () => <DetailPanelHeader />,
		},
		{
			field: "subjectId",
			headerName: t("search.bib_record_id_and_number"),
			minWidth: 200,
			flex: 1,
		},
		{
			field: "eventType",
			headerName: t("search.event_type"),
			minWidth: 200,
			flex: 0.75,
			renderCell: (params) => {
				let color: "success" | "warning" | "info" | "default" = "default";
				let icon = <Info fontSize="small" />;
				// Add other use cases - high confidence, low confidence

				if (params.value === "Match - high confidence") {
					color = "success";
					icon = <CheckCircle fontSize="small" />;
				} else if (params.value === "Warning") {
					color = "warning";
					icon = <Warning fontSize="small" />;
				} else if (params.value === "low confidence matches") {
					color = "success";
					icon = <CheckCircle fontSize="small" />;
				} else if (params.value === "Existing Cluster") {
					color = "info";
					icon = <Info fontSize="small" />;
				}

				return (
					<Chip
						label={params.value}
						color={color}
						icon={icon}
						size="small"
						variant="outlined"
					/>
				);
			},
		},
		{
			field: "matchCriteria",
			headerName: t("search.identifier"),
			minWidth: 150,
			flex: 0.5,
		},
		{
			field: "matchValue",
			headerName: t("ui.data_grid.value"),
			minWidth: 200,
			flex: 0.75,
		},
		{
			field: "formattedTimestamp",
			headerName: t("search.formatted_timestamp"),
			minWidth: 150,
		},
		{
			field: "matchedBibId",
			headerName: t("search.bib_matched_against"),
			width: 100,
		},
		{
			field: "message",
			headerName: t("ui.data_grid.message"),
			minWidth: 200,
		},
	];

	return (
		<AdminLayout
			title={t("search.cluster_explainer_title", {
				record:
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
							data={rows}
							columns={columns}
							getDetailPanelContent={({ row }: any) => (
								<MasterDetail row={row} type="ClusterExplainer" />
							)}
							type="ClusterExplainer"
							coreType="ClusterExplainer"
							operationDataType="ClusterExplainer"
							selectable={false}
							disableAggregation={false} // We want to group by default, and put in a master detail with more event information
							disableRowGrouping={false}
							loading={loading}
							toolbarVisible="default"
							noDataMessage={t("ui.info.no_results")}
							columnVisibilityModel={defaultClusterExplanationVisibility}
							sortModel={[{ field: "formattedTimestamp", sort: "desc" }]}
						/>
					</Grid>
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

export default ExplainClustering;
