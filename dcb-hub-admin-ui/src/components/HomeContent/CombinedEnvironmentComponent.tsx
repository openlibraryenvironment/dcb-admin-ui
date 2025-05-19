import { useState, useEffect } from "react";
import axios from "axios";
import getConfig from "next/config";
import { useTranslation, Trans } from "next-i18next";
import { Typography, Box, Stack } from "@mui/material";
import Link from "@components/Link/Link";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
} from "@mui/x-data-grid-premium";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Loading from "@components/Loading/Loading";
import { Environment } from "@models/Environment";
import { calculateDCBRAGStatus } from "src/helpers/calculateDCBRAGStatus";
import { calculateKeycloakRAGStatus } from "src/helpers/calculateKeycloakRAGStatus";
import {
	DCB_SERVICE_STATUS_LINKS,
	LOCAL_VERSION_LINKS,
	RELEASE_PAGE_LINKS,
} from "../../../homeData/homeConfig";
import VersionInfo from "./VersionInfo";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";

// Interface for environment data
interface EnvironmentData {
	id: number;
	serviceName: string;
	environment: string;
	address: string;
	healthStatus: string;
	healthLink: string;
	environmentType: Environment;
}

export default function CombinedEnvironmentComponent() {
	const [environmentData, setEnvironmentData] = useState<EnvironmentData[]>([]);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { publicRuntimeConfig } = getConfig();
	const { t } = useTranslation();

	// Function to calculate RAG status

	// Fetch environment data
	useEffect(() => {
		const calculateRAGStatus = (healthData: any, environment: Environment) => {
			if (!healthData) return t("common.unknown");

			switch (environment) {
				case Environment.DCB:
					return calculateDCBRAGStatus(healthData);
				case Environment.Keycloak:
					return calculateKeycloakRAGStatus(healthData);
				default:
					return t("common.unknown");
			}
		};
		const fetchEnvironmentData = async () => {
			try {
				setIsLoading(true);

				// Fetch DCB service description
				const responseDCBDescription = await axios.get(
					LOCAL_VERSION_LINKS.SERVICE_INFO,
				);

				// Fetch DCB health status with liveness fallback and timeout
				let dcbHealthData;
				let dcbHealthStatus;
				let dcbHealthLink = LOCAL_VERSION_LINKS.SERVICE_HEALTH;

				// Set up a timeout promise that rejects after 10 seconds
				const healthTimeout = new Promise((_, reject) => {
					setTimeout(
						() => reject(new Error("Health endpoint timeout after 10 seconds")),
						10000,
					);
				});

				try {
					// Race the health request against the timeout
					const dcbHealthResponse = (await Promise.race([
						axios.get(LOCAL_VERSION_LINKS.SERVICE_HEALTH),
						healthTimeout,
					])) as any;

					// If the health request completed successfully before the timeout
					dcbHealthData = dcbHealthResponse.data;
					dcbHealthStatus = calculateRAGStatus(dcbHealthData, Environment.DCB);
				} catch (err: any) {
					// If there was an error (timeout or API error), try the liveness endpoint
					console.log("Falling back to liveness endpoint due to:", err.message);

					try {
						// Assuming liveness endpoint is at this path - adjust if needed
						const livenessEndpoint = LOCAL_VERSION_LINKS.SERVICE_HEALTH.replace(
							"/health",
							"/health/liveness",
						);
						const livenessResponse = await axios.get(livenessEndpoint);

						// If we get a 200 status code, mark as "Up"
						if (livenessResponse.status === 200) {
							dcbHealthStatus = "Up";
							dcbHealthLink = livenessEndpoint;
						} else {
							// If liveness check doesn't return 200, fallback to original error data
							dcbHealthData = err.response?.data || null;
							dcbHealthStatus = calculateRAGStatus(
								dcbHealthData,
								Environment.DCB,
							);
						}
					} catch (livenessErr) {
						console.log(livenessErr);
						// If liveness check also fails, use original error data
						dcbHealthData = err.response?.data || null;
						dcbHealthStatus = calculateRAGStatus(
							dcbHealthData,
							Environment.DCB,
						);
					}
				}

				// Fetch Keycloak health status
				let keycloakHealthData;
				try {
					const keycloakHealthResponse = await axios.get(
						LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH,
					);
					keycloakHealthData = keycloakHealthResponse.data;
				} catch (err: any) {
					keycloakHealthData = err.response?.data || null;
				}

				// Create environment data array
				const environments: EnvironmentData[] = [
					{
						id: 1,
						serviceName: "DCB Service",
						environment:
							responseDCBDescription.data?.env?.description ||
							t("common.loading"),
						address: LOCAL_VERSION_LINKS.SERVICE,
						healthStatus: dcbHealthStatus,
						healthLink: dcbHealthLink,
						environmentType: Environment.DCB,
					},
					{
						id: 2,
						serviceName: "Keycloak",
						environment: t("common.na"),
						address: LOCAL_VERSION_LINKS.KEYCLOAK,
						healthStatus: calculateRAGStatus(
							keycloakHealthData,
							Environment.Keycloak,
						),
						healthLink: LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH,
						environmentType: Environment.Keycloak,
					},
				];

				setEnvironmentData(environments);
				setError(null);
			} catch (error: any) {
				setError(error.message || "Failed to fetch environment data");
				console.error("Error fetching environment data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchEnvironmentData();
	}, [t]);

	// Environment DataGrid column definitions
	const environmentColumns: GridColDef[] = [
		{
			...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
			headerName: t("ui.data_grid.master_detail"),
			renderCell: (params) => (
				<DetailPanelToggle id={params.id} value={params.value} />
			),
			renderHeader: () => <DetailPanelHeader />,
		},
		{
			field: "serviceName",
			headerName: t("service.name"),
			flex: 0.3,
			sortable: false,
			filterable: false,
			editable: false,
		},
		{
			field: "environment",
			headerName: t("service.environment"),
			flex: 0.7,
			sortable: false,
			filterable: false,
			editable: false,
		},
		{
			field: "address",
			headerName: t("service.address"),
			flex: 0.5,
			sortable: false,
			filterable: false,
			editable: false,
			renderCell: (params) => (
				<Link
					href={
						params.row.environmentType === Environment.DCB
							? LOCAL_VERSION_LINKS.SERVICE_INFO
							: publicRuntimeConfig.KEYCLOAK_URL
					}
				>
					{params.value}
				</Link>
			),
		},
		{
			field: "healthStatus",
			headerName: t("service.status"),
			flex: 0.3,
			sortable: false,
			filterable: false,
			editable: false,
			renderCell: (params) => (
				<Link href={params.row.healthLink}>{params.value}</Link>
			),
		},
	];

	if (isLoading) {
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("service.environment_health").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	}

	if (error) {
		return (
			<Typography>
				{t("service.environment_health_error", { error: error })}
			</Typography>
		);
	}

	return (
		<Box>
			<Typography variant="h2" sx={{ marginBottom: 1, fontSize: 32 }}>
				{t("environment.your")}
			</Typography>
			<Typography variant="homePageText">
				{t("environment.configured_for")}
			</Typography>

			{/* Environment DataGrid */}
			<ClientDataGrid
				data={environmentData}
				columns={environmentColumns}
				loading={isLoading}
				selectable={false}
				type="environmentInfo"
				coreType="environmentInfo"
				operationDataType="environmentInfo"
				disableAggregation
				disableRowGrouping
				toolbarVisible="not-visible"
			/>

			<Stack direction="column" spacing={1}>
				<Typography variant="homePageText">
					<Trans
						i18nKey="environment.see_metrics_loggers"
						components={{
							loggersLink: <Link href={DCB_SERVICE_STATUS_LINKS.LOGGERS} />,
							metricsLink: <Link href={DCB_SERVICE_STATUS_LINKS.METRICS} />,
						}}
					></Trans>
				</Typography>
				<Typography variant="h2" sx={{ marginBottom: 1, fontSize: 32 }}>
					{t("environment.versions")}
				</Typography>
				<Typography variant="homePageText">
					{t("environment.compare_components")}
				</Typography>
			</Stack>

			{/* Version DataGrid */}
			<VersionInfo />

			<Typography variant="homePageText">
				<Trans
					i18nKey="environment.releases_link"
					components={{
						linkToReleases: <Link href={RELEASE_PAGE_LINKS.ALL_RELEASES} />,
					}}
				></Trans>
			</Typography>
		</Box>
	);
}
