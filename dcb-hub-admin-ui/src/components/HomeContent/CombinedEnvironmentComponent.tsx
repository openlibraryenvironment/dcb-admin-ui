import { useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
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

import {
	DCB_SERVICE_STATUS_LINKS,
	LOCAL_VERSION_LINKS,
	RELEASE_PAGE_LINKS,
} from "../../homeData/homeConfig";
import VersionInfo from "./VersionInfo";
import ScheduledWork from "./ScheduledWork";
import { environmentHealthQuery } from "@/queryOptions/environmentHealth";

// A bare inline link is 17px tall and overflows a narrow cell into its neighbour's target.
// Filling the cell with vertical padding keeps it at least 24px tall (WCAG 2.5.8).
const CELL_LINK_SX = { display: "block", py: 0.5 } as const;

export default function CombinedEnvironmentComponent() {
	const { t } = useTranslation();
	const auth = useAuth();

	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const { data, isLoading, isError } = useQuery(
		environmentHealthQuery(auth.user?.access_token),
	);

	// Built here rather than in the query, so the labels follow a change of language
	const environments = useMemo(() => {
		if (!data) return [];
		const description = data.serviceInfoReached
			? (data.serviceInfo as { env?: { description?: string } } | null)?.env
					?.description
			: t("common.unknown");
		return [
			{
				id: 1,
				serviceName: "DCB Service",
				environment: description || t("common.loading"),
				address: LOCAL_VERSION_LINKS.SERVICE,
				healthStatus: data.dcbHealth.status,
				healthLink: data.dcbHealth.link,
				environmentType: Environment.DCB,
			},
			{
				id: 2,
				serviceName: "Keycloak",
				environment: t("common.na"),
				address: LOCAL_VERSION_LINKS.KEYCLOAK,
				healthStatus: data.keycloakStatus,
				healthLink: LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH,
				environmentType: Environment.Keycloak,
			},
		];
	}, [data, t]);

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
						noWrap
						sx={CELL_LINK_SX}
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
					<Link href={params.row.healthLink} noWrap sx={CELL_LINK_SX}>
						{params.value}
					</Link>
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
				message={t("ui.error.something_wrong")}
				onAction={() => location.reload()}
			/>
		);
	}

	return (
		<Box>
			<Typography variant="h2" sx={{ mb: 1 }}>
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
				rows={environments}
				loading={false}
				paginationMode="client"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				paginationModel={{ page: 0, pageSize: 20 }}
				sortingMode="client"
				filterMode="client"
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
				<Typography variant="h2" sx={{ mb: 1 }}>
					{t("environment.versions")}
				</Typography>
				<Typography variant="homePageText">
					{t("environment.compare_components")}
				</Typography>
			</Stack>

			<VersionInfo serviceInfo={data?.serviceInfo ?? null} />
			<ScheduledWork serviceInfo={data?.serviceInfo ?? null} />

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
												sx={{ fontWeight: "bold", marginInlineEnd: 1 }}
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
												sx={{ fontWeight: "bold", marginInlineEnd: 1 }}
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
														sx={{ fontWeight: "bold", marginInlineEnd: 1 }}
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
