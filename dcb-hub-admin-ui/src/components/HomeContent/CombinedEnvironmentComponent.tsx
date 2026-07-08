import { useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import axios from "axios";
import {
	Typography,
	Box,
	Stack,
	List,
	ListItemText,
	ListItem,
} from "@mui/material";
import { GridColDef, GridRowModesModel } from "@mui/x-data-grid-premium";

import Link from "@components/Link/Link";
import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";

import { Environment } from "@models/Environment";
import { calculateDCBRAGStatus } from "@helpers/calculateDCBRAGStatus";
import { calculateKeycloakRAGStatus } from "@helpers/calculateKeycloakRAGStatus";

import {
	DCB_SERVICE_STATUS_LINKS,
	LOCAL_VERSION_LINKS,
	RELEASE_PAGE_LINKS,
} from "../../homeData/homeConfig";
import VersionInfo from "./VersionInfo";

interface TrackingConfigurationData {
	trackingIntervals: Record<string, string>;
	globalActiveRequestLimit: number;
	globalTrackingInterval: string;
}

export default function CombinedEnvironmentComponent() {
	const { t } = useTranslation();
	const auth = useAuth();

	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const { data, isLoading, isError } = useQuery({
		queryKey: ["environmentHealth"],
		queryFn: async () => {
			const headers = { Authorization: `Bearer ${auth.user?.access_token}` };

			// Helper to fetch DCB Health with timeout and liveness fallback
			const fetchDcbHealth = async () => {
				const healthTimeout = new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Timeout")), 10000),
				);
				try {
					const res = (await Promise.race([
						axios.get(LOCAL_VERSION_LINKS.SERVICE_HEALTH),
						healthTimeout,
					])) as any;
					return {
						status: calculateDCBRAGStatus(res.data),
						link: LOCAL_VERSION_LINKS.SERVICE_HEALTH,
					};
				} catch (err: any) {
					console.warn("Falling back to liveness endpoint:", err.message);
					try {
						const livenessEndpoint = LOCAL_VERSION_LINKS.SERVICE_HEALTH.replace(
							"/health",
							"/health/liveness",
						);
						const livenessRes = await axios.get(livenessEndpoint);
						if (livenessRes.status === 200) {
							return { status: "Up", link: livenessEndpoint };
						}
						return {
							status: calculateDCBRAGStatus(err.response?.data),
							link: LOCAL_VERSION_LINKS.SERVICE_HEALTH,
						};
					} catch {
						return {
							status: calculateDCBRAGStatus(err.response?.data),
							link: LOCAL_VERSION_LINKS.SERVICE_HEALTH,
						};
					}
				}
			};

			// Fetch all necessary data concurrently
			const [dcbInfoRes, dcbHealthRes, keycloakHealthRes, trackingConfigRes] =
				await Promise.allSettled([
					axios.get(LOCAL_VERSION_LINKS.SERVICE_INFO),
					fetchDcbHealth(),
					axios.get(LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH),
					axios.get(LOCAL_VERSION_LINKS.TRACKING, { headers }),
				]);

			const dcbEnvDescription =
				dcbInfoRes.status === "fulfilled"
					? dcbInfoRes.value.data?.env?.description
					: t("common.unknown");
			const dcbHealth =
				dcbHealthRes.status === "fulfilled"
					? dcbHealthRes.value
					: {
							status: t("common.unknown"),
							link: LOCAL_VERSION_LINKS.SERVICE_HEALTH,
						};
			const keycloakHealthData =
				keycloakHealthRes.status === "fulfilled"
					? keycloakHealthRes.value.data
					: (keycloakHealthRes as any).reason?.response?.data;

			const environments = [
				{
					id: 1,
					serviceName: "DCB Service",
					environment: dcbEnvDescription || t("common.loading"),
					address: LOCAL_VERSION_LINKS.SERVICE,
					healthStatus: dcbHealth.status,
					healthLink: dcbHealth.link,
					environmentType: Environment.DCB,
				},
				{
					id: 2,
					serviceName: "Keycloak",
					environment: t("common.na"),
					address: LOCAL_VERSION_LINKS.KEYCLOAK,
					healthStatus:
						calculateKeycloakRAGStatus(keycloakHealthData) ||
						t("common.unknown"),
					healthLink: LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH,
					environmentType: Environment.Keycloak,
				},
			];

			return {
				environments,
				trackingConfig:
					trackingConfigRes.status === "fulfilled"
						? (trackingConfigRes.value.data as TrackingConfigurationData)
						: null,
			};
		},
		enabled: !!auth.user?.access_token,
	});

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "serviceName",
				headerName: t("service.name"),
				flex: 0.3,
			},
			{
				field: "environment",
				headerName: t("service.environment"),
				flex: 0.7,
			},
			{
				field: "address",
				headerName: t("service.address"),
				flex: 0.5,
				renderCell: (params) => (
					<Link
						href={
							params.row.environmentType === Environment.DCB
								? LOCAL_VERSION_LINKS.SERVICE_INFO
								: import.meta.env.VITE_KEYCLOAK_URL
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
				renderCell: (params) => (
					<Link href={params.row.healthLink}>{params.value}</Link>
				),
			},
		],
		[t],
	);

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

	if (isError) {
		return (
			<ErrorComponent
				title={t("service.environment_health_error", {
					error: "Failed to load environment status",
				})}
				action={t("ui.actions.reload")}
				message={t("error.environment")} /** TODO ERROR */
				// onClick={refetch}
			/>
		);
	}

	return (
		<Box>
			<Typography variant="h2" sx={{ mb: 1, fontSize: 32 }}>
				{t("environment.your")}
			</Typography>
			<Typography variant="homePageText" sx={{ mb: 2 }}>
				{t("environment.configured_for")}
			</Typography>

			<DataGrid
				identifier="environmentInfo"
				type="environmentInfo"
				data-tid="environment-health-grid"
				columns={columns}
				rows={data?.environments ?? []}
				loading={false}
				paginationMode="client"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				paginationModel={{ page: 0, pageSize: 20 }}
				sortingMode="client"
				filterMode="client"
				checkboxSelection={false}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible={false}
				scrollbarVisible={false}
				pagination
				noResultsText={t("ui.data_grid.no_results")}
				searchText=""
			/>

			<Stack direction="column" spacing={1} sx={{ mt: 3 }}>
				<Typography variant="homePageText">
					<Trans
						i18nKey="environment.see_metrics_loggers"
						components={{
							loggersLink: <Link href={DCB_SERVICE_STATUS_LINKS.LOGGERS} />,
							metricsLink: <Link href={DCB_SERVICE_STATUS_LINKS.METRICS} />,
						}}
					/>
				</Typography>
				<Typography variant="h2" sx={{ mb: 1, fontSize: 32 }}>
					{t("environment.versions")}
				</Typography>
				<Typography variant="homePageText">
					{t("environment.compare_components")}
				</Typography>
			</Stack>

			<VersionInfo />

			<Typography variant="homePageText" sx={{ mb: 2 }}>
				<Trans
					i18nKey="environment.releases_link"
					components={{
						linkToReleases: <Link href={RELEASE_PAGE_LINKS.ALL_RELEASES} />,
					}}
				/>
			</Typography>

			{data?.trackingConfig && (
				<Stack direction="column" spacing={2} sx={{ mt: 4 }}>
					<Typography
						variant="h2"
						sx={{ borderBottom: 1, borderColor: "divider", pb: 1, mb: 2 }}
					>
						{t("requesting.configuration")}
					</Typography>

					<Box>
						<Typography variant="h3" sx={{ mb: 2 }}>
							{t("requesting.global")}
						</Typography>
						<List dense>
							<ListItem>
								<ListItemText
									primary={
										<Box
											component="span"
											sx={{ display: "flex", alignItems: "center" }}
										>
											<Typography
												component="span"
												sx={{ fontWeight: "bold", mr: 1 }}
											>
												{t("requesting.global_limit")}
											</Typography>
											{data.trackingConfig.globalActiveRequestLimit}
										</Box>
									}
								/>
							</ListItem>
							<ListItem>
								<ListItemText
									primary={
										<Box
											component="span"
											sx={{ display: "flex", alignItems: "center" }}
										>
											<Typography
												component="span"
												sx={{ fontWeight: "bold", mr: 1 }}
											>
												{t("requesting.global_tracking")}
											</Typography>
											{data.trackingConfig.globalTrackingInterval}
										</Box>
									}
								/>
							</ListItem>
						</List>
					</Box>

					<Box>
						<Typography variant="h3" sx={{ mb: 2 }}>
							{t("requesting.tracking_intervals")}
						</Typography>
						<List dense>
							{Object.entries(data.trackingConfig.trackingIntervals).map(
								([key, value]) => (
									<ListItem key={key}>
										<ListItemText
											primary={
												<Box
													component="span"
													sx={{ display: "flex", alignItems: "center" }}
												>
													<Typography
														component="span"
														sx={{ fontWeight: "bold", mr: 1 }}
													>
														{key}:
													</Typography>
													{value}
												</Box>
											}
										/>
									</ListItem>
								),
							)}
						</List>
					</Box>
				</Stack>
			)}
		</Box>
	);
}
