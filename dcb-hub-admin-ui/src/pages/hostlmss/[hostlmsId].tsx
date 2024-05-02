import { Button, Stack, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { HostLMS } from "@models/HostLMS";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import PrivateData from "@components/PrivateData/PrivateData";
import { getHostLmsById } from "src/queries/queries";
import { useQuery } from "@apollo/client";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import {
	StyledAccordion,
	StyledAccordionSummary,
	StyledAccordionDetails,
} from "@components/StyledAccordion/StyledAccordion";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

type HostLMSDetails = {
	hostlmsId: any;
};

export default function HostLMSDetails({ hostlmsId }: HostLMSDetails) {
	const { t } = useTranslation();
	const theme = useTheme();

	// pollInterval is in ms - set to 2 mins
	const { loading, data, error } = useQuery(getHostLmsById, {
		variables: {
			query: "id:" + hostlmsId,
		},
		pollInterval: 120000,
	});
	const hostlms: HostLMS = data?.hostLms?.content?.[0];

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// If user is not authenticated, push them to unauthorised page
			// At present, they will likely be kicked to the logout page first
			// However this is important for when we introduce RBAC.
			router.push("/unauthorised");
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
	const expandAll = () => {
		setExpandedAccordions((prevExpanded) =>
			prevExpanded.map(() => !prevExpanded[0]),
		);
	};
	if (loading || status == "loading") {
		return (
			<AdminLayout>
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
					action={t("ui.info.go_back")}
					goBack="/hostlmss"
				/>
			) : (
				<Error
					title={t("ui.error.record_not_found")}
					message={t("ui.info.record_unavailable")}
					description={t("ui.action.check_url")}
					action={t("ui.info.go_back")}
					goBack="/hostlmss"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={hostlms?.name}>
			<Stack direction="row" justifyContent="end">
				<Button onClick={expandAll}>
					{expandedAccordions[0] ? t("details.collapse") : t("details.expand")}
				</Button>
			</Stack>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
				disableGutters
			>
				<StyledAccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="hostlms-general-details"
					id="hostlms_details_general"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("details.general")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.id")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={hostlms?.id} />
								</Typography>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.code")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={hostlms?.code} />
								</Typography>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.name")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={hostlms?.name} />
								</Typography>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.lms_client")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={hostlms?.lmsClientClass} />
								</Typography>
							</Stack>
						</Grid>
					</Grid>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[1]}
				onChange={handleAccordionChange(1)}
				disableGutters
			>
				<StyledAccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="hostlms-client-config-details"
					id="hostlms_details_client_config"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("hostlms.client_config.title")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						{hostlms?.clientConfig?.apikey != null && (
							<Grid xs={2} sm={4} md={4}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.api")}
									hiddenTextValue={hostlms?.clientConfig?.apikey}
									id="apiKey"
								/>
							</Grid>
						)}
						{hostlms?.clientConfig?.ingest != null && (
							<Grid xs={2} sm={4} md={4}>
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
						{hostlms?.clientConfig?.["shelving-locations"] != null && (
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.shelving")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["shelving-locations"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.["num-records-to-generate"] != null && (
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.records")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={
												hostlms?.clientConfig?.["num-records-to-generate"]
											}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.["record-syntax"] != null && (
							<Grid xs={2} sm={4} md={4}>
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
						{hostlms?.clientConfig?.["metadata-prefix"] != null && (
							<Grid xs={2} sm={4} md={4}>
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
						{hostlms?.clientConfig?.["base-url"] != null && (
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.base")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["base-url"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.["access-id"] != null && (
							<Grid xs={2} sm={4} md={4}>
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
						{hostlms?.clientConfig?.["domain-id"] != null && (
							<Grid xs={2} sm={4} md={4}>
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
						{hostlms?.clientConfig?.["page-size"] != null && (
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.page_size")}
									</Typography>
									<Typography variant="attributeText">
										<RenderAttribute
											attribute={hostlms?.clientConfig?.["page-size"]}
										/>
									</Typography>
								</Stack>
							</Grid>
						)}
						{hostlms?.clientConfig?.["access-key"] != null && (
							<Grid xs={2} sm={4} md={4}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.access_key")}
									hiddenTextValue={hostlms?.clientConfig?.["access-key"]}
									id={"access-key"}
								/>
							</Grid>
						)}
						{hostlms?.clientConfig?.["staff-username"] != null && (
							<Grid xs={2} sm={4} md={4}>
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
						{hostlms?.clientConfig?.["staff-password"] != null && (
							<Grid xs={2} sm={4} md={4}>
								{
									<PrivateData
										clientConfigType={t("hostlms.client_config.staff_password")}
										hiddenTextValue={hostlms?.clientConfig?.["staff-password"]}
										id={"staff-password"}
									/>
								}
							</Grid>
						)}
						{hostlms?.clientConfig?.secret != null && (
							<Grid xs={2} sm={4} md={4}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.secret")}
									hiddenTextValue={hostlms?.clientConfig?.secret}
									id={"secret"}
								/>
							</Grid>
						)}
						{hostlms?.clientConfig?.key != null && (
							<Grid xs={2} sm={4} md={4}>
								<PrivateData
									clientConfigType={t("hostlms.client_config.key")}
									hiddenTextValue={hostlms?.clientConfig?.key}
									id={"key"}
								/>
							</Grid>
						)}
					</Grid>
					{/* // For the 'item' object on some HostLMS. Conditionally rendered so it only shows up on Host LMS with this config.  */}
					{hostlms?.clientConfig?.item != null ? (
						<StyledAccordion
							variant="outlined"
							expanded={expandedAccordions[2]}
							onChange={handleAccordionChange(2)}
							disableGutters
						>
							<StyledAccordionSummary
								aria-controls="hostlms-client-config-details-item"
								id="hostlms_details_client_config_item"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" sx={{ fontWeight: "bold" }}>
									{t("hostlms.client_config.item")}
								</Typography>
							</StyledAccordionSummary>
							<StyledAccordionDetails>
								<Grid
									container
									spacing={{ xs: 2, md: 3 }}
									columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
								>
									{hostlms?.clientConfig?.item?.["fine-code-id"] != null && (
										<Grid xs={2} sm={4} md={4}>
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
										<Grid xs={2} sm={4} md={4}>
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
									{hostlms?.clientConfig?.item?.["barcode-prefix"] != null && (
										<Grid xs={2} sm={4} md={4}>
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
									{hostlms?.clientConfig?.item?.["history-action-id"] !=
										null && (
										<Grid xs={2} sm={4} md={4}>
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
										<Grid xs={2} sm={4} md={4}>
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
										<Grid xs={2} sm={4} md={4}>
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
							</StyledAccordionDetails>
						</StyledAccordion>
					) : null}
					{/* For Host LMS with the 'PAPI' config. Conditionally rendered so it only shows up on Host LMS with this config. */}
					{hostlms?.clientConfig?.papi != null ? (
						<StyledAccordion
							variant="outlined"
							sx={{ border: "0" }}
							expanded={expandedAccordions[3]}
							onChange={handleAccordionChange(3)}
							disableGutters
						>
							<StyledAccordionSummary
								aria-controls="hostlms-client-config-details-papi"
								id="hostlms_details_client_config_papi"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" sx={{ fontWeight: "bold" }}>
									{t("hostlms.client_config.papi")}
								</Typography>
							</StyledAccordionSummary>
							<StyledAccordionDetails>
								<Grid
									container
									spacing={{ xs: 2, md: 3 }}
									columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
								>
									{hostlms?.clientConfig?.papi?.["app-id"] != null && (
										<Grid xs={2} sm={4} md={4}>
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
										<Grid xs={2} sm={4} md={4}>
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
										<Grid xs={2} sm={4} md={4}>
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
										<Grid xs={2} sm={4} md={4}>
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
							</StyledAccordionDetails>
						</StyledAccordion>
					) : null}
					{/* For HostLMS services config. Conditionally rendered so it only shows up on Host LMS with this config. */}
					{hostlms?.clientConfig?.services != null ? (
						<StyledAccordion
							variant="outlined"
							expanded={expandedAccordions[4]}
							onChange={handleAccordionChange(4)}
							disableGutters
						>
							<StyledAccordionSummary
								aria-controls="hostlms-client-config-details-services"
								id="hostlms_details_client_config_services"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" sx={{ fontWeight: "bold" }}>
									{t("hostlms.client_config.services")}
								</Typography>
							</StyledAccordionSummary>
							<StyledAccordionDetails>
								<Grid
									container
									spacing={{ xs: 2, md: 3 }}
									columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
								>
									{hostlms?.clientConfig?.services?.["product-id"] != null ? (
										<Grid xs={2} sm={4} md={4}>
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
									{hostlms?.clientConfig?.services?.["site-domain"] != null ? (
										<Grid xs={2} sm={4} md={4}>
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
									{hostlms?.clientConfig?.services?.["workstation-id"] !=
									null ? (
										<Grid xs={2} sm={4} md={4}>
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
									{hostlms?.clientConfig?.services?.["organisation-id"] !=
									null ? (
										<Grid xs={2} sm={4} md={4}>
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
									{hostlms?.clientConfig?.services?.["services-version"] !=
									null ? (
										<Grid xs={2} sm={4} md={4}>
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
										<Grid xs={2} sm={4} md={4}>
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
									{hostlms?.clientConfig?.services?.["product-id"] != null && (
										<Grid xs={2} sm={4} md={4}>
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
									)}
									{hostlms?.clientConfig?.services?.["site-domain"] != null && (
										<Grid xs={2} sm={4} md={4}>
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
									)}
									{hostlms?.clientConfig?.services?.["workstation-id"] !=
										null && (
										<Grid xs={2} sm={4} md={4}>
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
									)}
									{hostlms?.clientConfig?.services?.["organisation-id"] !=
										null && (
										<Grid xs={2} sm={4} md={4}>
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
									)}
									{hostlms?.clientConfig?.services?.["services-version"] !=
										null && (
										<Grid xs={2} sm={4} md={4}>
											<Stack direction={"column"}>
												<Typography variant="attributeTitle">
													{t("hostlms.client_config.services_version")}
												</Typography>
												<Typography variant="attributeText">
													<RenderAttribute
														attribute={
															hostlms?.clientConfig?.services?.["version"]
														}
													/>
												</Typography>
											</Stack>
										</Grid>
									)}
								</Grid>
							</StyledAccordionDetails>
						</StyledAccordion>
					) : null}
				</StyledAccordionDetails>
			</StyledAccordion>
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
