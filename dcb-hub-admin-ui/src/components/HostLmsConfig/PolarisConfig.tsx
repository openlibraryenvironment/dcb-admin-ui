import { useTranslation } from "react-i18next";
import { Grid, Typography } from "@mui/material";

import { ExpandMore } from "@mui/icons-material";
import PrivateData from "@components/PrivateData/PrivateData";
import {
	SubAccordion,
	SubAccordionDetails,
	SubAccordionSummary,
} from "@components/StyledAccordion/StyledAccordion";

import ConfigItem from "./ConfigItem";

export default function PolarisConfig({ config }: { config: any }) {
	const { t } = useTranslation();

	return (
		<>
			<ConfigItem
				title={t("hostlms.client_config.base_application")}
				value={config?.["base-url-application-services"]}
				type="url"
			/>
			<ConfigItem
				title={t("hostlms.client_config.base")}
				value={config?.["base-url"]}
				type="url"
			/>
			<ConfigItem
				title={t("hostlms.client_config.roles")}
				value={String(config?.roles)}
			/>
			<ConfigItem
				title={t("hostlms.client_config.context_hierarchy")}
				value={String(config?.contextHierarchy)}
			/>
			<ConfigItem
				title={t("hostlms.client_config.domain_id")}
				value={config?.["domain-id"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.access_id")}
				value={config?.["access-id"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.staff_username")}
				value={config?.["staff-username"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.logon_branch_id")}
				value={config?.["logon-branch-id"]}
			/>
			<ConfigItem
				title={t("hostlms.client_config.logon_user_id")}
				value={config?.["logon-user-id"]}
			/>

			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.client_config.staff_password")}
					hiddenTextValue={config?.["staff-password"]}
					id="staff-password"
				/>
			</Grid>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<PrivateData
					clientConfigType={t("hostlms.client_config.access_key")}
					hiddenTextValue={config?.["access-key"]}
					id="access-key"
				/>
			</Grid>

			{config?.item && (
				<SubAccordion variant="outlined" disableGutters>
					<SubAccordionSummary expandIcon={<ExpandMore />}>
						<Typography variant="h3" fontWeight="bold">
							{t("hostlms.client_config.item")}
						</Typography>
					</SubAccordionSummary>
					<SubAccordionDetails>
						<Grid
							container
							spacing={{ xs: 2, md: 3 }}
							columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
						>
							<ConfigItem
								title={t("hostlms.client_config.barcode_prefix")}
								value={config.item?.["barcode-prefix"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.ill_location_id")}
								value={config.item?.["ill-location-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.fine")}
								value={config.item?.["fine-code-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.renewal_limit")}
								value={config.item?.["renewal-limit"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.history_action_id")}
								value={config.item?.["history-action-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.shelving_scheme_id")}
								value={config.item?.["shelving-scheme-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.loan_id")}
								value={config.item?.["loan-period-code-id"]}
							/>
						</Grid>
					</SubAccordionDetails>
				</SubAccordion>
			)}

			{config?.papi && (
				<SubAccordion variant="outlined" disableGutters>
					<SubAccordionSummary expandIcon={<ExpandMore />}>
						<Typography variant="h3" fontWeight="bold">
							{t("hostlms.client_config.papi")}
						</Typography>
					</SubAccordionSummary>
					<SubAccordionDetails>
						<Grid
							container
							spacing={{ xs: 2, md: 3 }}
							columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
						>
							<ConfigItem
								title={t("hostlms.client_config.papi_app_id")}
								value={config.papi?.["app-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.papi_org_id")}
								value={config.papi?.["org-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.papi_lang_id")}
								value={config.papi?.["lang-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.papi_version")}
								value={config.papi?.["papi-version"]}
							/>
						</Grid>
					</SubAccordionDetails>
				</SubAccordion>
			)}

			{config?.services && (
				<SubAccordion variant="outlined" disableGutters>
					<SubAccordionSummary expandIcon={<ExpandMore />}>
						<Typography variant="h3" fontWeight="bold">
							{t("hostlms.client_config.services")}
						</Typography>
					</SubAccordionSummary>
					<SubAccordionDetails>
						<Grid
							container
							spacing={{ xs: 2, md: 3 }}
							columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
						>
							<ConfigItem
								title={t("hostlms.client_config.services_organisation_id")}
								value={config.services?.["organisation-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.services_site_domain")}
								value={config.services?.["site-domain"]}
							/>
							<ConfigItem
								title={t(
									"hostlms.client_config.services_patron_barcode_prefix",
								)}
								value={config.services?.["patron-barcode-prefix"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.services_product_id")}
								value={config.services?.["product-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.services_workstation_id")}
								value={config.services?.["workstation-id"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.services_version")}
								value={config.services?.["services-version"]}
							/>
							<ConfigItem
								title={t("hostlms.client_config.services_language")}
								value={config.services?.language}
							/>
						</Grid>
					</SubAccordionDetails>
				</SubAccordion>
			)}
		</>
	);
}
