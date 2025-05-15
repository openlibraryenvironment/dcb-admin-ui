import { Grid, Stack, Tab, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { HostLMS } from "@models/HostLMS";
import { useState } from "react";
import { ExpandMore } from "@mui/icons-material";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import PrivateData from "@components/PrivateData/PrivateData";
import { getHostLmsById } from "src/queries/queries";
import { useQuery } from "@apollo/client";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import {
	SubAccordion,
	SubAccordionDetails,
	SubAccordionSummary,
} from "@components/StyledAccordion/StyledAccordion";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { getILS } from "src/helpers/getILS";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
import TabContext from "@mui/lab/TabContext";

type HostLMSDetails = {
	hostlmsId: any;
};

export default function HostLMSDetails({ hostlmsId }: HostLMSDetails) {
	const { t } = useTranslation();
	// pollInterval is in ms - set to 2 mins
	const { loading, data, error } = useQuery(getHostLmsById, {
		variables: {
			query: "id:" + hostlmsId,
		},
		pollInterval: 120000,
	});
	const hostlms: HostLMS = data?.hostLms?.content?.[0];
	const [activeTab, setActiveTab] = useState(0);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	const [expandedAccordions, setExpandedAccordions] = useState([
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		false,
		false,
	]);
	// Functions to handle expanding both individual accordions and all accordions
	const handleAccordionChange = (index: number) => () => {
		setExpandedAccordions((prevExpanded) => {
			const newExpanded = [...prevExpanded];
			newExpanded[index] = !newExpanded[index];
			return newExpanded;
		});
	};

	// Works for closing + expanding as it sets values to their opposite

	if (loading || status == "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("hostlms.hostlms_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || hostlms == null || hostlms == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/hostlmss"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/hostlmss"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={hostlms?.name}>
			<TabContext value={activeTab}>
				<TabList onChange={handleTabChange} variant="scrollable">
					<Tab label={t("details.general")} />
					<Tab label={t("hostlms.client_config.title")} />
				</TabList>

				<TabPanel value={0}>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
							<Typography variant="accordionSummary">
								{t("details.general")}
							</Typography>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.code")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={hostlms?.code} />
								</Typography>
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.name")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={hostlms?.name} />
								</Typography>
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.id")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={hostlms?.id} />
								</Typography>
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.lms_client")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute
										attribute={hostlms?.lmsClientClass}
										title={getILS(hostlms?.lmsClientClass)}
									/>
								</Typography>
							</Stack>
						</Grid>
					</Grid>
				</TabPanel>
				<TabPanel value={1}>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
							<Typography variant="accordionSummary">
								{t("hostlms.client_config.title")}
							</Typography>
						</Grid>
						{/* START: meta config properties */}
						{hostlms?.clientConfig?.["base-url-application-services"] !=
							null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.base_application")}
									</Typography>
									<RenderAttribute
										attribute={
											hostlms?.clientConfig?.["base-url-application-services"]
										}
										type="url"
										title={
											hostlms?.clientConfig?.["base-url-application-services"]
										}
									/>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.["base-url"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.base")}
									</Typography>
									<RenderAttribute
										attribute={hostlms?.clientConfig?.["base-url"]}
										type="url"
										title={hostlms?.clientConfig?.["base-url"]}
									/>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.roles != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.roles")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={String(hostlms?.clientConfig?.roles)}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.["contextHierarchy"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.context_hierarchy")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={String(
												hostlms?.clientConfig?.["contextHierarchy"],
											)}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.["default-agency-code"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.default_agency_code")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["default-agency-code"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* END: meta. START: credentials */}
						{/* apikey: FOLIO tenant api key */}
						{hostlms?.clientConfig?.apikey != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.api")}
									hiddenTextValue={hostlms?.clientConfig?.apikey}
									id="apiKey"
								/>
							</Grid>
						)}
						{/* access-id: Polaris api principal credential */}
						{hostlms?.clientConfig?.["access-id"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.access_id")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["access-id"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* access-key: Polaris api key */}
						{hostlms?.clientConfig?.["access-key"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.access_key")}
									hiddenTextValue={hostlms?.clientConfig?.["access-key"]}
									id={"access-key"}
								/>
							</Grid>
						)}
						{/* domain-id: Polaris staff account domain */}
						{hostlms?.clientConfig?.["domain-id"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.domain_id")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["domain-id"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* domain-id: Polaris staff account principal credential */}
						{hostlms?.clientConfig?.["staff-username"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.staff_username")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["staff-username"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* domain-id: Polaris staff account secret credential */}
						{hostlms?.clientConfig?.["staff-password"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								{
									<PrivateData
										clientConfigType={t("hostlms.client_config.staff_password")}
										hiddenTextValue={hostlms?.clientConfig?.["staff-password"]}
										id={"staff-password"}
									/>
								}
							</Grid>
						)}
						{/* logon-branch-id: Polaris only */}
						{hostlms?.clientConfig?.["logon-branch-id"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.logon_branch_id")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["logon-branch-id"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* logon-user-id: Polaris only */}
						{hostlms?.clientConfig?.["logon-user-id"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.logon_user_id")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["logon-user-id"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* key: Sierra api key */}
						{hostlms?.clientConfig?.key != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.key")}
									hiddenTextValue={hostlms?.clientConfig?.key}
									id={"key"}
								/>
							</Grid>
						)}
						{/* key: Sierra api secret */}
						{hostlms?.clientConfig?.secret != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.secret")}
									hiddenTextValue={hostlms?.clientConfig?.secret}
									id={"secret"}
								/>
							</Grid>
						)}
						{/* END: credentials. START: ingest. */}
						{hostlms?.clientConfig?.ingest != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.ingest")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={String(hostlms?.clientConfig?.ingest)}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* Suppression rulesets */}
						{hostlms?.suppressionRulesetName != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.bibSuppressionRulesetName")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.suppressionRulesetName}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{hostlms?.itemSuppressionRulesetName != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.itemSuppressionRulesetName")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.itemSuppressionRulesetName}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* record-syntax: FOLIO only */}
						{hostlms?.clientConfig?.["record-syntax"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.record_syntax")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["record-syntax"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* metadata-prefix: FOLIO only */}
						{hostlms?.clientConfig?.["metadata-prefix"] != null && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.metadata")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["metadata-prefix"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{/* END: ingest properties */}
					</Grid>
					{/* // For the 'item' object on some HostLMS. Conditionally rendered so it only shows up on Host LMS with this config.  */}
					{hostlms?.clientConfig?.item != null ? (
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[2]}
							onChange={handleAccordionChange(2)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="hostlms-client-config-details-item"
								id="hostlms_details_client_config_item"
								expandIcon={<ExpandMore fontSize="large" />}
							>
								<Typography variant="h3" sx={{ fontWeight: "bold" }}>
									{t("hostlms.client_config.item")}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<Grid
									container
									spacing={{ xs: 2, md: 3 }}
									columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
								>
									{hostlms?.clientConfig?.item?.["barcode-prefix"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.barcode_prefix")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.item?.["barcode-prefix"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.item?.["ill-location-id"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.ill_location_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.item?.["ill-location-id"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.item?.["fine-code-id"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.fine")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.item?.["fine-code-id"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.item?.["renewal-limit"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.renewal_limit")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.item?.["renewal-limit"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.item?.["history-action-id"] !=
										null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.history_action_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.item?.["history-action-id"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.item?.["shelving-scheme-id"] !=
										null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.shelving_scheme_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.item?.[
																"shelving-scheme-id"
															]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.item?.["loan-period-code-id"] !=
										null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.loan_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.item?.[
																"loan-period-code-id"
															]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
								</Grid>
							</SubAccordionDetails>
						</SubAccordion>
					) : null}
					{/* For Host LMS with the 'PAPI' config. Conditionally rendered so it only shows up on Host LMS with this config. */}
					{hostlms?.clientConfig?.papi != null ? (
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[3]}
							onChange={handleAccordionChange(3)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="hostlms-client-config-details-papi"
								id="hostlms_details_client_config_papi"
								expandIcon={<ExpandMore fontSize="large" />}
							>
								<Typography variant="h3" sx={{ fontWeight: "bold" }}>
									{t("hostlms.client_config.papi")}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<Grid
									container
									spacing={{ xs: 2, md: 3 }}
									columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
								>
									{hostlms?.clientConfig?.papi?.["app-id"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.papi_app_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={hostlms?.clientConfig?.papi?.["app-id"]}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.papi?.["org-id"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.papi_org_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={hostlms?.clientConfig?.papi?.["org-id"]}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.papi?.["lang-id"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.papi_lang_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={hostlms?.clientConfig?.papi?.["lang-id"]}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
									{hostlms?.clientConfig?.papi?.["papi-version"] != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.papi_version")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.papi?.["papi-version"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
								</Grid>
							</SubAccordionDetails>
						</SubAccordion>
					) : null}
					{/* For HostLMS services config. Conditionally rendered so it only shows up on Host LMS with this config. */}
					{hostlms?.clientConfig?.services != null ? (
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[4]}
							onChange={handleAccordionChange(4)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="hostlms-client-config-details-services"
								id="hostlms_details_client_config_services"
								expandIcon={<ExpandMore fontSize="large" />}
							>
								<Typography variant="h3" sx={{ fontWeight: "bold" }}>
									{t("hostlms.client_config.services")}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<Grid
									container
									spacing={{ xs: 2, md: 3 }}
									columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
								>
									{hostlms?.clientConfig?.services?.["organisation-id"] !=
									null ? (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.services_organisation_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.[
																"organisation-id"
															]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									) : null}
									{hostlms?.clientConfig?.services?.["site-domain"] != null ? (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.services_site_domain")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.["site-domain"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									) : null}
									{hostlms?.clientConfig?.services?.["patron-barcode-prefix"] !=
									null ? (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t(
														"hostlms.client_config.services_patron_barcode_prefix",
													)}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.[
																"patron-barcode-prefix"
															]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									) : null}
									{hostlms?.clientConfig?.services?.["product-id"] != null ? (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.services_product_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.["product-id"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									) : null}
									{hostlms?.clientConfig?.services?.["workstation-id"] !=
									null ? (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.services_workstation_id")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.[
																"workstation-id"
															]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									) : null}
									{hostlms?.clientConfig?.services?.["services-version"] !=
									null ? (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.services_version")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.[
																"services-version"
															]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									) : null}
									{hostlms?.clientConfig?.services?.language != null && (
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.services_language")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.language
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
								</Grid>
							</SubAccordionDetails>
						</SubAccordion>
					) : null}
				</TabPanel>
			</TabContext>
		</AdminLayout>
	);
}

export async function getServerSideProps(ctx: any) {
	const { locale } = ctx;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	const hostlmsId = ctx.params.hostlmsId;
	return {
		props: {
			hostlmsId,
			...translations,
		},
	};
}
