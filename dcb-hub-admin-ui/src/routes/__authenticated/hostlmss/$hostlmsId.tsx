import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Stack, Tab, Typography } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { ExpandMore } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import PrivateData from "@components/PrivateData/PrivateData";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import {
	SubAccordion,
	SubAccordionDetails,
	SubAccordionSummary,
} from "@components/StyledAccordion/StyledAccordion";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getHostLms } from "@queries/getHostLms";
import { getILS } from "@helpers/getILS";
import { HostLMS } from "@models/HostLMS";
import FolioConfig from "@components/HostLmsConfig/FolioConfig";
import SierraConfig from "@components/HostLmsConfig/SierraConfig";
import AlmaConfig from "@components/HostLmsConfig/AlmaConfig";
import PolarisConfig from "@components/HostLmsConfig/PolarisConfig";

export const Route = createFileRoute("/__authenticated/hostlmss/$hostlmsId")({
	component: HostLMSDetails,
});

function HostLMSDetails() {
	const { t } = useTranslation();
	const { hostlmsId } = Route.useParams();
	const gqlClient = useGraphQLClient();

	const [activeTab, setActiveTab] = useState("0");

	const { data, isLoading, error } = useQuery({
		queryKey: ["hostLms", hostlmsId],
		queryFn: () =>
			gqlClient.request<any>(getHostLms, { query: `id:${hostlmsId}` }),
		enabled: !!hostlmsId,
		refetchInterval: 120000,
	});

	const hostlms: HostLMS = data?.hostLms?.content?.[0];

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("hostlms.hostlms_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (error || !hostlms) {
		return (
			<PageContainer hideBreadcrumbs>
				<Error
					title={
						error
							? t("ui.error.cannot_retrieve_record")
							: t("ui.error.cannot_find_record")
					}
					message={
						error ? t("ui.info.connection_issue") : t("ui.error.invalid_UUID")
					}
					description={
						error ? t("ui.info.try_later") : t("ui.info.check_address")
					}
					action={t("ui.action.go_back")}
					goBack="/hostlmss"
				/>
			</PageContainer>
		);
	}

	const ilsType = getILS(hostlms.lmsClientClass);

	return (
		<PageContainer title={hostlms.name}>
			<TabContext value={activeTab}>
				<TabList
					onChange={(_, val) => setActiveTab(val)}
					variant="scrollable"
					sx={{ mb: 3 }}
				>
					<Tab label={t("details.general")} value="0" />
					<Tab label={t("hostlms.client_config.title")} value="1" />
				</TabList>

				<TabPanel value="0" sx={{ p: 0 }}>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Typography variant="accordionSummary">
								{t("details.general")}
							</Typography>
						</Grid>
						<ConfigItem title={t("hostlms.code")} value={hostlms.code} />
						<ConfigItem title={t("hostlms.name")} value={hostlms.name} />
						<ConfigItem title={t("hostlms.id")} value={hostlms.id} />
						<ConfigItem
							title={t("hostlms.lms_client")}
							value={hostlms.lmsClientClass}
							tooltip={ilsType}
						/>
						<ConfigItem
							title={t("hostlms.bibSuppressionRulesetName")}
							value={hostlms.suppressionRulesetName}
						/>
						<ConfigItem
							title={t("hostlms.itemSuppressionRulesetName")}
							value={hostlms.itemSuppressionRulesetName}
						/>
					</Grid>
				</TabPanel>

				<TabPanel value="1" sx={{ p: 0 }}>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Typography variant="accordionSummary">
								{t("hostlms.client_config.title")}
							</Typography>
						</Grid>

						{/* Universal Client Configs */}
						<ConfigItem
							title={t("hostlms.client_config.ingest")}
							value={String(hostlms.clientConfig?.ingest)}
						/>
						<ConfigItem
							title={t("hostlms.client_config.default_agency_code")}
							value={hostlms.clientConfig?.["default-agency-code"]}
						/>

						{/* ILS Specific config Rendering */}
						{ilsType === "Polaris" && (
							<PolarisConfig config={hostlms.clientConfig} />
						)}
						{ilsType === "Alma" && <AlmaConfig config={hostlms.clientConfig} />}
						{ilsType === "Sierra" && (
							<SierraConfig config={hostlms.clientConfig} />
						)}
						{ilsType === "FOLIO" && (
							<FolioConfig config={hostlms.clientConfig} />
						)}
					</Grid>
				</TabPanel>
			</TabContext>
		</PageContainer>
	);
}

function ConfigItem({
	title,
	value,
	tooltip,
	type,
}: {
	title: string;
	value: any;
	tooltip?: string;
	type?: string;
}) {
	if (value == null || value === "undefined") return null;
	return (
		<Grid size={{ xs: 2, sm: 4, md: 4 }}>
			<Stack direction="column">
				<Typography variant="attributeTitle">{title}</Typography>
				<Typography variant="attributeText">
					<RenderAttribute
						attribute={value}
						title={tooltip || value}
						type={type}
					/>
				</Typography>
			</Stack>
		</Grid>
	);
}
