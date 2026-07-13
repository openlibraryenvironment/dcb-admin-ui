import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import {
	Grid,
	Stack,
	Typography,
	Divider,
	AccordionSummary,
	useTheme,
} from "@mui/material";
import { Delete, ExpandMore } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import PrivateData from "@components/PrivateData/PrivateData";
import FormatArrayAsList from "@components/FormatArrayAsList/FormatArrayAsList";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import {
	StyledAccordion,
	StyledAccordionDetails,
} from "@components/StyledAccordion/StyledAccordion";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getILS } from "@helpers/getILS";
import { handleDeleteEntity } from "@helpers/actions/editAndDeleteActions";

import { getLibraryServiceInfo } from "@queries/getLibraryServiceInfo";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/service",
)({
	component: Service,
});

function Service() {
	const { t } = useTranslation();
	const router = useRouter();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const [expandedAccordions, setExpandedAccordions] = useState({
		bib1: false,
		item1: false,
		bib2: false,
		item2: false,
	});
	const [bibSuppressionRuleset1, setBibSuppressionRuleset1] =
		useState<any>(null);
	const [itemSuppressionRuleset1, setItemSuppressionRuleset1] =
		useState<any>(null);
	const [itemSuppressionRuleset2, setItemSuppressionRuleset2] =
		useState<any>(null);

	const { data, isLoading, error } = useQuery({
		queryKey: ["library", "service", libraryId],
		queryFn: () =>
			gqlClient.request<any>(getLibraryServiceInfo, {
				query: `id:${libraryId}`,
			}),
		enabled: !!libraryId,
		refetchInterval: 120000,
	});

	const { mutateAsync: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryMutation, variables),
	});

	const library = data?.libraries?.content?.[0];
	const firstHostLms = library?.agency?.hostLms;
	const secondHostLms = library?.secondHostLms;
	const ils = getILS(firstHostLms?.lmsClientClass);

	const fetchRuleset = async (
		rulesetName: string,
		setter: React.Dispatch<React.SetStateAction<any>>,
	) => {
		if (!rulesetName || !auth.user?.access_token) return;
		try {
			const response = await fetch(
				`${import.meta.env.VITE_DCB_API_BASE}/object-rules/${rulesetName}`,
				{
					headers: { Authorization: `Bearer ${auth.user.access_token}` },
				},
			);
			if (!response.ok)
				throw new Error(`Error fetching ruleset ${response.status}`);
			setter(await response.json());
		} catch (fetchError) {
			console.error(`Error fetching ruleset ${rulesetName}:`, fetchError);
			setter({ error: `Failed to load details for ${rulesetName}.` });
		}
	};

	const handleAccordionChange =
		(
			accordionKey: keyof typeof expandedAccordions,
			rulesetName: string | undefined,
			rulesetData: any,
			setter: React.Dispatch<React.SetStateAction<any>>,
		) =>
		(event: React.SyntheticEvent, isExpanded: boolean) => {
			setExpandedAccordions((prev) => ({
				...prev,
				[accordionKey]: isExpanded,
			}));
			if (isExpanded && !rulesetData && rulesetName)
				fetchRuleset(rulesetName, setter);
		};

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("libraries.library"),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (error || !library)
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("ui.error.invalid_UUID")}
			/>
		);

	return (
		<PageContainer
			title={library.fullName}
			pageActions={[
				{
					key: "delete",
					onClick: () => setConfirmationDeletion(true),
					disabled: !isAnAdmin,
					label: t("ui.data_grid.delete_entity", {
						entity: t("libraries.library").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
			]}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={1} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("nav.libraries.service")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="accordionSummary"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("ui.info.general")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.service.systems.ils")}
						</Typography>
						<RenderAttribute attribute={ils} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.service.systems.discovery")}
						</Typography>
						<RenderAttribute attribute={library.discoverySystem} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.service.systems.patron_site")}
						</Typography>
						{library.patronWebsite ? (
							<RenderAttribute attribute={library.patronWebsite} type="url" />
						) : (
							<Typography variant="attributeText">-</Typography>
						)}
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("libraries.config.patronAuth.title")}
					</Typography>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.config.patronAuth.auth_profile")}
						</Typography>
						<RenderAttribute attribute={library.agency?.authProfile} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("hostlms.configuration")}
						</Typography>
						<RenderAttribute attribute={library.hostLmsConfiguration} />
					</Stack>
				</Grid>

				{firstHostLms && (
					<>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Divider aria-hidden="true" />
						</Grid>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Typography
								variant="h3"
								sx={{
									fontWeight: "bold",
								}}
							>
								{t("libraries.service.hostlms_title", {
									name: firstHostLms.name,
								})}
							</Typography>
						</Grid>

						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.name")}
								</Typography>
								<RenderAttribute attribute={firstHostLms.name} />
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.code")}
								</Typography>
								<RenderAttribute attribute={firstHostLms.code} />
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.roles")}
								</Typography>
								<FormatArrayAsList
									roles={firstHostLms.clientConfig?.["roles"]}
								/>
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.id")}
								</Typography>
								<RenderAttribute attribute={firstHostLms.id} />
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.ingest")}
								</Typography>
								<RenderAttribute
									attribute={String(firstHostLms.clientConfig?.ingest)}
								/>
							</Stack>
						</Grid>

						{firstHostLms.suppressionRulesetName && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction="column">
									<Typography variant="attributeTitle">
										{t("hostlms.bibSuppressionRulesetName")}
									</Typography>
									<RenderAttribute
										attribute={firstHostLms.suppressionRulesetName}
									/>
								</Stack>
							</Grid>
						)}
						{firstHostLms.itemSuppressionRulesetName && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction="column">
									<Typography variant="attributeTitle">
										{t("hostlms.itemSuppressionRulesetName")}
									</Typography>
									<RenderAttribute
										attribute={firstHostLms.itemSuppressionRulesetName}
									/>
								</Stack>
							</Grid>
						)}

						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("libraries.service.environments.api")}
								</Typography>
								<RenderAttribute
									attribute={firstHostLms.clientConfig?.["base-url"]}
									type="url"
								/>
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.context_hierarchy")}
								</Typography>
								<FormatArrayAsList
									roles={firstHostLms.clientConfig?.contextHierarchy}
								/>
							</Stack>
						</Grid>

						{firstHostLms.clientConfig?.apikey && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t("libraries.service.environments.api_key")}
									hiddenTextValue={firstHostLms.clientConfig.apikey}
									id="lib-prod-env-api-key-1"
								/>
							</Grid>
						)}
						{firstHostLms.clientConfig?.["access-key"] && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t("libraries.service.environments.api_key")}
									hiddenTextValue={firstHostLms.clientConfig["access-key"]}
									id="lib-prod-env-api-key-1"
								/>
							</Grid>
						)}
						{firstHostLms.clientConfig?.key && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t("libraries.service.environments.api_key")}
									hiddenTextValue={firstHostLms.clientConfig.key}
									id="lib-prod-env-api-key-1"
								/>
							</Grid>
						)}
						{firstHostLms.clientConfig?.secret && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<PrivateData
									clientConfigType={t(
										"libraries.service.environments.api_secret",
									)}
									hiddenTextValue={firstHostLms.clientConfig.secret}
									id="lib-prod-env-api-secret-1"
								/>
							</Grid>
						)}

						{firstHostLms.clientConfig?.defaultAgency && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction="column">
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.default_agency")}
									</Typography>
									<RenderAttribute
										attribute={firstHostLms.clientConfig.defaultAgency}
									/>
								</Stack>
							</Grid>
						)}
						{firstHostLms.clientConfig?.holdPolicy && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction="column">
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.hold_policy")}
									</Typography>
									<RenderAttribute
										attribute={firstHostLms.clientConfig.holdPolicy}
									/>
								</Stack>
							</Grid>
						)}
						{firstHostLms.clientConfig?.["page-size"] && (
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction="column">
									<Typography variant="attributeTitle">
										{t("hostlms.client_config.page_size")}
									</Typography>
									<RenderAttribute
										attribute={firstHostLms.clientConfig["page-size"]}
									/>
								</Stack>
							</Grid>
						)}

						{firstHostLms.itemSuppressionRulesetName && (
							<Grid size={{ xs: 4, sm: 8, md: 12 }}>
								<StyledAccordion
									expanded={expandedAccordions.item1}
									onChange={handleAccordionChange(
										"item1",
										firstHostLms.itemSuppressionRulesetName,
										itemSuppressionRuleset1,
										setItemSuppressionRuleset1,
									)}
								>
									<AccordionSummary expandIcon={<ExpandMore />}>
										<Typography
											variant="h3"
											sx={{
												fontWeight: "bold",
											}}
										>
											{t("libraries.suppression_ruleset_item", {
												lms: firstHostLms.name,
											})}
										</Typography>
									</AccordionSummary>
									<StyledAccordionDetails>
										{itemSuppressionRuleset1 ? (
											<pre>
												{JSON.stringify(itemSuppressionRuleset1, null, 2)}
											</pre>
										) : (
											<Typography>{t("libraries.ruleset_loading")}</Typography>
										)}
									</StyledAccordionDetails>
								</StyledAccordion>
							</Grid>
						)}

						{firstHostLms.suppressionRulesetName && (
							<Grid size={{ xs: 4, sm: 8, md: 12 }}>
								<StyledAccordion
									expanded={expandedAccordions.bib1}
									onChange={handleAccordionChange(
										"bib1",
										firstHostLms.suppressionRulesetName,
										bibSuppressionRuleset1,
										setBibSuppressionRuleset1,
									)}
								>
									<AccordionSummary expandIcon={<ExpandMore />}>
										<Typography
											variant="h3"
											sx={{
												fontWeight: "bold",
											}}
										>
											{t("libraries.suppression_ruleset_bib", {
												lms: firstHostLms.name,
											})}
										</Typography>
									</AccordionSummary>
									<StyledAccordionDetails>
										{bibSuppressionRuleset1 ? (
											<pre>
												{JSON.stringify(bibSuppressionRuleset1, null, 2)}
											</pre>
										) : (
											<Typography>{t("libraries.ruleset_loading")}</Typography>
										)}
									</StyledAccordionDetails>
								</StyledAccordion>
							</Grid>
						)}
					</>
				)}

				{secondHostLms && (
					<>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Divider aria-hidden="true" />
						</Grid>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Typography
								variant="h3"
								sx={{
									fontWeight: "bold",
								}}
							>
								{t("libraries.service.hostlms_title", {
									name: secondHostLms.name,
								})}
							</Typography>
						</Grid>
						{/* Repeat secondHostLms attributes natively here, identical to above logic */}
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.name")}
								</Typography>
								<RenderAttribute attribute={secondHostLms.name} />
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("hostlms.code")}
								</Typography>
								<RenderAttribute attribute={secondHostLms.code} />
							</Stack>
						</Grid>

						{secondHostLms.itemSuppressionRulesetName && (
							<Grid size={{ xs: 4, sm: 8, md: 12 }}>
								<StyledAccordion
									expanded={expandedAccordions.item2}
									onChange={handleAccordionChange(
										"item2",
										secondHostLms.itemSuppressionRulesetName,
										itemSuppressionRuleset2,
										setItemSuppressionRuleset2,
									)}
								>
									<AccordionSummary expandIcon={<ExpandMore />}>
										<Typography
											variant="h3"
											sx={{
												fontWeight: "bold",
											}}
										>
											{t("libraries.suppression_ruleset_item", {
												lms: secondHostLms.name,
											})}
										</Typography>
									</AccordionSummary>
									<StyledAccordionDetails>
										{itemSuppressionRuleset2 ? (
											<pre>
												{JSON.stringify(itemSuppressionRuleset2, null, 2)}
											</pre>
										) : (
											<Typography>{t("libraries.ruleset_loading")}</Typography>
										)}
									</StyledAccordionDetails>
								</StyledAccordion>
							</Grid>
						)}
					</>
				)}
			</Grid>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(r, c, u) => {
					handleDeleteEntity(
						library.id,
						r,
						c,
						u,
						setAlert,
						deleteLibrary,
						t,
						router,
						library.fullName,
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={library.fullName}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</PageContainer>
	);
}
