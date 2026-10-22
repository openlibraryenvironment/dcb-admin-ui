import { useTranslation } from "react-i18next";
import {
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import { serviceConfigurationFrom } from "@helpers/serviceConfiguration";

/** Settings dcb-service's /info reports, for support to read rather than ask the host for. */
export default function ServiceConfiguration({
	serviceInfo,
}: {
	serviceInfo: unknown;
}) {
	const { t } = useTranslation();
	const config = serviceConfigurationFrom(serviceInfo);

	if (!config) return null;

	const onOff = (value: boolean | null) =>
		value == null
			? t("common.unknown")
			: t(
					value
						? "environment.configuration.on"
						: "environment.configuration.off",
				);

	const settings: { key: string; label: string; value: string }[] = [];
	if (config.searchBackend) {
		settings.push({
			key: "search-backend",
			label: t("environment.configuration.search_backend"),
			value: [config.searchBackend.distribution, config.searchBackend.version]
				.filter(Boolean)
				.join(" "),
		});
	}
	if (config.placementCheckTimeoutSeconds != null) {
		settings.push({
			key: "placement-check-timeout",
			label: t("environment.configuration.placement_check_timeout"),
			value: t("environment.configuration.seconds", {
				count: config.placementCheckTimeoutSeconds,
			}),
		});
	}
	if (config.staffClientIds) {
		settings.push({
			key: "staff-client-ids",
			label: t("environment.configuration.staff_client_ids"),
			value: config.staffClientIds.join(", "),
		});
	}
	if (config.duplicateRequestCheck != null) {
		settings.push({
			key: "duplicate-request-check",
			label: t("environment.configuration.duplicate_request_check"),
			value: onOff(config.duplicateRequestCheck),
		});
	}
	if (config.brandAssetStore) {
		settings.push({
			key: "brand-asset-store",
			label: t("environment.configuration.brand_asset_store"),
			value: config.brandAssetStore,
		});
	}

	if (settings.length === 0 && config.ingestSources.length === 0) return null;

	return (
		<Stack spacing={1} sx={{ mb: 3 }}>
			<Typography variant="h2" sx={{ mb: 1 }}>
				{t("environment.configuration.title")}
			</Typography>
			{settings.length > 0 && (
				<TableContainer>
					<Table size="small">
						<caption>{t("environment.configuration.settings_caption")}</caption>
						<TableHead>
							<TableRow>
								<TableCell>{t("environment.configuration.setting")}</TableCell>
								<TableCell>{t("environment.configuration.value")}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{settings.map((setting) => (
								<TableRow key={setting.key}>
									<TableCell component="th" scope="row">
										{setting.label}
									</TableCell>
									<TableCell>{setting.value}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
			{config.ingestSources.length > 0 && (
				<TableContainer>
					<Table size="small">
						<caption>{t("environment.configuration.ingest_caption")}</caption>
						<TableHead>
							<TableRow>
								<TableCell>
									{t("environment.configuration.ingest_source")}
								</TableCell>
								<TableCell>
									{t("environment.configuration.ingest_enabled")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{config.ingestSources.map((source) => (
								<TableRow key={source.key}>
									<TableCell component="th" scope="row">
										{source.key}
									</TableCell>
									<TableCell>{onOff(source.enabled)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Stack>
	);
}
