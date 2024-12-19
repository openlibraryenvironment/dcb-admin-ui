import PrivateData from "@components/PrivateData/PrivateData";
import { Library } from "@models/Library";
import { Divider, Stack, Tab, Tabs, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import FormatArrayAsList from "@components/FormatArrayAsList/FormatArrayAsList";
import { HostLMS } from "@models/HostLMS";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { deleteLibraryQuery, getLibraryServiceInfo } from "src/queries/queries";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AdminLayout } from "@layout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useState } from "react";
import { getILS } from "src/helpers/getILS";
import { Delete } from "@mui/icons-material";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";

type LibraryDetails = {
	libraryId: any;
};

export default function Service({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	const [tabIndex, setTabIndex] = useState(1);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const { data, loading, error } = useQuery(getLibraryServiceInfo, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000,
	});
	const [deleteLibrary] = useMutation(deleteLibraryQuery);

	const theme = useTheme();
	const client = useApolloClient();
	const router = useRouter();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
	// Will change when the query changes
	const library: Library = data?.libraries?.content?.[0];
	const firstHostLms: HostLMS = library?.agency?.hostLms;
	const secondHostLms: HostLMS = library?.secondHostLms;
	const ils: string = getILS(library?.agency?.hostLms?.lmsClientClass);

	// Add actions menu if relevant. No edit - only delete.

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("libraries.library").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	const pageActions = [
		{
			key: "delete",
			onClick: () => setConfirmationDeletion(true),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.delete_entity", {
				entity: t("libraries.library").toLowerCase(),
			}),
			startIcon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
		},
	];

	return error || library == null || library == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout
			title={t("libraries.service.title", { name: library?.fullName })}
			pageActions={pageActions}
			mode={"view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid xs={4} sm={8} md={12}>
					<Tabs
						value={tabIndex}
						onChange={(event, value) => {
							handleTabChange(event, value, router, setTabIndex, libraryId);
						}}
						aria-label="Library navigation"
					>
						<Tab label={t("nav.libraries.profile")} />
						<Tab label={t("nav.libraries.service")} />
						<Tab label={t("nav.libraries.settings")} />
						<Tab label={t("nav.libraries.configuration")} />
						<Tab label={t("nav.libraries.patronRequests.name")} />
						<Tab label={t("nav.libraries.contacts")} />
					</Tabs>
				</Grid>
				<Grid xs={4} sm={8} md={12} lg={16}>
					<Typography variant="accordionSummary">
						{t("nav.libraries.service")}
					</Typography>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.service.systems.ils")}
						</Typography>
						<RenderAttribute attribute={ils} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.service.systems.discovery")}
						</Typography>
						<RenderAttribute attribute={library?.discoverySystem} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.service.systems.patron_site")}
						</Typography>
						{library?.patronWebsite ? (
							<RenderAttribute
								attribute={library?.patronWebsite}
								title="Link to patron website"
								type="url"
							>
								{library?.patronWebsite}
							</RenderAttribute>
						) : (
							<Typography variant="attributeText">-</Typography>
						)}
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.config.patronAuth.title")}
					</Typography>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.config.patronAuth.auth_profile")}
						</Typography>
						<RenderAttribute attribute={library?.agency?.authProfile} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("hostlms.configuration")}
						</Typography>
						<RenderAttribute attribute={library?.hostLmsConfiguration} />
					</Stack>
				</Grid>
				{firstHostLms ? (
					<Grid xs={4} sm={8} md={12} lg={16}>
						<Divider aria-hidden="true"></Divider>
					</Grid>
				) : null}
				{firstHostLms ? (
					<Grid xs={4} sm={8} md={12} lg={16}>
						<Typography variant="h3" fontWeight={"bold"}>
							{t("libraries.service.hostlms_title", {
								name: firstHostLms?.name,
							})}
						</Typography>
					</Grid>
				) : null}
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("hostlms.name")}
						</Typography>
						<RenderAttribute attribute={firstHostLms?.name} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("hostlms.code")}
						</Typography>
						<RenderAttribute attribute={firstHostLms?.code} />
					</Stack>
				</Grid>
				{/* Handle multi-roles and separate them */}
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("hostlms.roles")}
						</Typography>
						{
							<FormatArrayAsList
								roles={firstHostLms?.clientConfig?.["roles"]}
							/>
						}
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">{t("hostlms.id")}</Typography>
						<RenderAttribute attribute={firstHostLms?.id} />
					</Stack>
				</Grid>

				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("hostlms.client_config.ingest")}
						</Typography>
						<RenderAttribute
							attribute={String(firstHostLms?.clientConfig?.ingest)}
						/>
					</Stack>
				</Grid>

				{/* Suppression rulesets */}
				{firstHostLms?.suppressionRulesetName != null && (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.bibSuppressionRulesetName")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute
									attribute={firstHostLms?.suppressionRulesetName}
								/>
							</Typography>
						</Stack>
					</Grid>
				)}
				{firstHostLms?.itemSuppressionRulesetName != null && (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.itemSuppressionRulesetName")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute
									attribute={firstHostLms?.itemSuppressionRulesetName}
								/>
							</Typography>
						</Stack>
					</Grid>
				)}

				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.service.environments.api")}
						</Typography>
						<RenderAttribute
							attribute={firstHostLms?.clientConfig?.["base-url"]}
							title={firstHostLms?.clientConfig?.["base-url"]}
							type="url"
						/>
					</Stack>
				</Grid>

				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("hostlms.client_config.context_hierarchy")}
						</Typography>
						<FormatArrayAsList
							roles={firstHostLms?.clientConfig?.contextHierarchy}
						/>
					</Stack>
				</Grid>

				{/* 'API Key' has many different guises on clientConfig: for FOLIO libraries it's simple*/}
				{firstHostLms?.clientConfig?.apikey ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_key")}
							hiddenTextValue={firstHostLms?.clientConfig?.apikey}
							id="lib-prod-env-api-key-1"
						/>
					</Grid>
				) : null}

				{/* For Polaris libraries it's the 'access key' attribute*/}
				{firstHostLms?.clientConfig?.["access-key"] ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_key")}
							hiddenTextValue={firstHostLms?.clientConfig?.["access-key"]}
							id="lib-prod-env-api-key-1"
						/>
					</Grid>
				) : null}

				{/* And for Sierra libraries it is the 'key' attribute*/}
				{firstHostLms?.clientConfig?.key ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_key")}
							hiddenTextValue={firstHostLms?.clientConfig?.key}
							id="lib-prod-env-api-key-1"
						/>
					</Grid>
				) : null}

				{firstHostLms?.clientConfig?.secret ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_secret")}
							hiddenTextValue={firstHostLms?.clientConfig?.secret}
							id="lib-prod-env-api-secret-1"
						/>
					</Grid>
				) : null}

				{firstHostLms?.clientConfig?.defaultAgency ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.default_agency")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.defaultAgency}
							/>
						</Stack>
					</Grid>
				) : null}

				{/* Sierra specific values*/}

				{firstHostLms?.clientConfig?.holdPolicy ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.hold_policy")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.holdPolicy}
							/>
						</Stack>
					</Grid>
				) : null}

				{firstHostLms?.clientConfig?.["page-size"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.page_size")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.["page-size"]}
							/>
						</Stack>
					</Grid>
				) : null}

				{/* Polaris-specific values*/}

				{firstHostLms?.clientConfig?.["domain-id"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.service.environments.polaris_domain")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.["domain-id"]}
							/>
						</Stack>
					</Grid>
				) : null}
				{firstHostLms?.clientConfig?.["domain-id"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.service.environments.polaris_username")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.["staff-username"]}
							/>
						</Stack>
					</Grid>
				) : null}
				{firstHostLms?.clientConfig?.["staff-password"] ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t(
								"libraries.service.environments.polaris_password",
							)}
							hiddenTextValue={firstHostLms?.clientConfig?.["staff-password"]}
							id="lib-prod-env-api-polaris-password"
						/>
					</Grid>
				) : null}
				{firstHostLms?.clientConfig?.services?.["organisation-id"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.service.environments.polaris_org_id")}
							</Typography>
							<RenderAttribute
								attribute={
									firstHostLms?.clientConfig?.services?.["organisation-id"]
								}
							/>
						</Stack>
					</Grid>
				) : null}

				{/* FOLIO Specific values: folio-tenant, metadata-prefix, record_syntax, user-base-url*/}

				{firstHostLms?.clientConfig?.["folio-tenant"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.folio_tenant")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.["folio-tenant"]}
							/>
						</Stack>
					</Grid>
				) : null}

				{firstHostLms?.clientConfig?.["metadata-prefix"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.metadata")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.["metadata-prefix"]}
							/>
						</Stack>
					</Grid>
				) : null}

				{firstHostLms?.clientConfig?.["record-syntax"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.record_syntax")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.["record-syntax"]}
							/>
						</Stack>
					</Grid>
				) : null}

				{firstHostLms?.clientConfig?.["user-base-url"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.user_base_url")}
							</Typography>
							<RenderAttribute
								attribute={firstHostLms?.clientConfig?.["user-base-url"]}
								title={firstHostLms?.clientConfig?.["user-base-url"]}
								type="url"
							/>
						</Stack>
					</Grid>
				) : null}

				{/* Second Host LMS section - if exists - conditionally render */}
				{secondHostLms ? (
					<Grid xs={4} sm={8} md={12} lg={16}>
						<Divider aria-hidden="true"></Divider>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={4} sm={8} md={12} lg={16}>
						<Typography variant="h3" fontWeight={"bold"}>
							{t("libraries.service.hostlms_title", {
								name: secondHostLms?.name,
							})}
						</Typography>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.name")}
							</Typography>
							<RenderAttribute attribute={secondHostLms?.name} />
						</Stack>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.code")}
							</Typography>
							<RenderAttribute attribute={secondHostLms?.code} />
						</Stack>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.roles")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["roles"]}
							/>
						</Stack>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.id")}
							</Typography>
							<RenderAttribute attribute={secondHostLms?.id} />
						</Stack>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.ingest")}
							</Typography>
							<RenderAttribute
								attribute={String(secondHostLms?.clientConfig?.ingest)}
							/>
						</Stack>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.service.environments.api")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["base-url"]}
								title={secondHostLms?.clientConfig?.["base-url"]}
								type="url"
							/>
						</Stack>
					</Grid>
				) : null}
				{secondHostLms ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.context_hierarchy")}
							</Typography>
							<FormatArrayAsList
								roles={secondHostLms?.clientConfig?.contextHierarchy}
							/>
						</Stack>
					</Grid>
				) : null}

				{/* 'API Key' has many different guises on clientConfig: for FOLIO libraries it's simple*/}
				{secondHostLms?.clientConfig?.apikey ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_key")}
							hiddenTextValue={secondHostLms?.clientConfig?.apikey}
							id="lib-prod-env-api-key-2"
						/>
					</Grid>
				) : null}

				{/* For Polaris libraries it's the 'access key' attribute*/}
				{secondHostLms?.clientConfig?.["access-key"] ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_key")}
							hiddenTextValue={secondHostLms?.clientConfig?.["access-key"]}
							id="lib-prod-env-api-key-2"
						/>
					</Grid>
				) : null}

				{/* And for Sierra libraries it is the 'key' attribute*/}
				{secondHostLms?.clientConfig?.key ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_key")}
							hiddenTextValue={secondHostLms?.clientConfig?.key}
							id="lib-prod-env-api-key-2"
						/>
					</Grid>
				) : null}
				{secondHostLms?.clientConfig?.secret ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t("libraries.service.environments.api_secret")}
							hiddenTextValue={secondHostLms?.clientConfig?.secret}
							id="lib-test-env-api-secret"
						/>
					</Grid>
				) : null}

				{/* Polaris specific values - Second Host LMS */}

				{secondHostLms?.clientConfig?.["domain-id"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.service.environments.polaris_domain")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["domain-id"]}
							/>
						</Stack>
					</Grid>
				) : null}
				{secondHostLms?.clientConfig?.["staff-username"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.service.environments.polaris_username")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["staff-username"]}
							/>
						</Stack>
					</Grid>
				) : null}
				{secondHostLms?.clientConfig?.["staff-password"] ? (
					<Grid xs={2} sm={4} md={4}>
						<PrivateData
							clientConfigType={t(
								"libraries.service.environments.polaris_password",
							)}
							hiddenTextValue={secondHostLms?.clientConfig?.["staff-password"]}
							id="lib-test-env-polaris-password"
						/>
					</Grid>
				) : null}
				{secondHostLms?.clientConfig?.services?.["organisation-id"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.service.environments.polaris_org_id")}
							</Typography>
							<RenderAttribute
								attribute={
									secondHostLms?.clientConfig?.services?.["organisation-id"]
								}
							/>
						</Stack>
					</Grid>
				) : null}
				{/* FOLIO Specific values (Second Host LMS): folio-tenant, metadata-prefix, record_syntax, user-base-url*/}

				{secondHostLms?.clientConfig?.["folio-tenant"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.folio_tenant")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["folio-tenant"]}
							/>
						</Stack>
					</Grid>
				) : null}

				{secondHostLms?.clientConfig?.["metadata-prefix"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.metadata")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["metadata-prefix"]}
							/>
						</Stack>
					</Grid>
				) : null}

				{secondHostLms?.clientConfig?.["record-syntax"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.record_syntax")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["record-syntax"]}
							/>
						</Stack>
					</Grid>
				) : null}

				{secondHostLms?.clientConfig?.["user-base-url"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.user_base_url")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["user-base-url"]}
								title={secondHostLms?.clientConfig?.["user-base-url"]}
								type="url"
							/>
						</Stack>
					</Grid>
				) : null}
				{/* Sierra specific values*/}

				{secondHostLms?.clientConfig?.holdPolicy ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.hold_policy")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.holdPolicy}
							/>
						</Stack>
					</Grid>
				) : null}

				{secondHostLms?.clientConfig?.["page-size"] ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.client_config.page_size")}
							</Typography>
							<RenderAttribute
								attribute={secondHostLms?.clientConfig?.["page-size"]}
							/>
						</Stack>
					</Grid>
				) : null}
			</Grid>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title}
			/>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() =>
					closeConfirmation(setConfirmationDeletion, client, "LoadLibrary")
				}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					handleDeleteEntity(
						library.id,
						reason,
						changeCategory,
						changeReferenceUrl,
						setAlert,
						deleteLibrary,
						t,
						router,
						library?.fullName ?? "",
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				type={"deletelibraries"}
				entityName={library?.fullName}
				entity={t("libraries.library")}
				gridEdit={false}
			/>
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
	const libraryId = ctx.params.libraryId;
	return {
		props: {
			libraryId,
			...translations,
		},
	};
}
