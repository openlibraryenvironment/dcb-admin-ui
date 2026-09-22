import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { FormProvider, useForm, Controller, useWatch } from "react-hook-form";
import { isEmpty } from "lodash";
import {
	Alert,
	AlertTitle,
	Button,
	Grid,
	Stack,
	Tab,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { Cancel, Edit, Save } from "@mui/icons-material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import PageContainer from "@layout/PageContainer/PageContainer";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Confirmation from "@components/Confirmation/Confirmation";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import HostLmsVerification from "@components/HostLmsVerification/HostLmsVerification";
import ClientConfigFields, {
	RecommendedConfigGaps,
} from "@forms/NewLibrary/steps/ClientConfigFields";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useUnsavedChangesWarning } from "@hooks/useUnsavedChangesWarning";
import { getHostLms } from "@queries/getHostLms";
import { getILS } from "@helpers/getILS";
import { handleEdit } from "@helpers/actions/editAndDeleteActions";
import {
	clientConfigToFields,
	getHostLmsProfile,
	hasSharedSystemConflict,
	mergeClientConfigEdit,
	missingRequiredClientConfig,
} from "@helpers/hostLmsClientConfig";
import type { HostLmsVerificationResult } from "@helpers/hostLmsVerification";
import { HostLMS } from "@models/HostLMS";
import FolioConfig from "@components/HostLmsConfig/FolioConfig";
import SierraConfig from "@components/HostLmsConfig/SierraConfig";
import AlmaConfig from "@components/HostLmsConfig/AlmaConfig";
import PolarisConfig from "@components/HostLmsConfig/PolarisConfig";
import KohaConfig from "@components/HostLmsConfig/KohaConfig";
import FoundationConfig from "@components/HostLmsConfig/FoundationConfig";
import OrsApplianceConfig from "@components/HostLmsConfig/OrsApplianceConfig";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { hostlmsParamsSchema } from "@schemas/routeParams/hostlmsParams";
import type { LoadHostLmsQueryVariables } from "@generated/graphql";

interface HostLmsFormFields {
	name: string;
	suppressionRulesetName: string;
	itemSuppressionRulesetName: string;
	/** Flat, dotted paths - the shape ClientConfigFields binds to. */
	clientConfigFields: Record<string, unknown>;
}

export const Route = createFileRoute("/__authenticated/hostlmss/$hostlmsId")({
	params: {
		parse: (raw) => hostlmsParamsSchema.parse(raw),
	},
	// Prefetches into the same query cache entry the component's useQuery
	// below reads (identical queryKey).
	loader: ({ context: { queryClient, cfg, auth }, params: { hostlmsId } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global
		// network/401 error handler in main.tsx before __authenticated.tsx's
		// own component-level auth-gate redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: ["hostLms", hostlmsId],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any, LoadHostLmsQueryVariables>(
					getHostLms,
					{
						query: `id:${hostlmsId}`,
					},
				),
		});
	},
	component: HostLMSDetails,
});

function HostLMSDetails() {
	const { t } = useTranslation();
	const { hostlmsId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [activeTab, setActiveTab] = useState("0");
	const [editMode, setEditMode] = useState(false);
	const [verification, setVerification] =
		useState<HostLmsVerificationResult | null>(null);
	const firstEditableFieldRef = useRef<HTMLInputElement | null>(null);

	const hostLmsMutation = useEntityMutation("hostLms");

	const { data, isLoading, error } = useQuery({
		queryKey: ["hostLms", hostlmsId],
		queryFn: () =>
			gqlClient.request<any, LoadHostLmsQueryVariables>(getHostLms, {
				query: `id:${hostlmsId}`,
			}),
		enabled: !!hostlmsId,
		// Paused in edit mode: a background refetch feeding `values` would
		// overwrite half-typed credentials with what is still stored.
		refetchInterval: editMode ? false : 120000,
	});

	const hostlms: HostLMS = data?.hostLms?.content?.[0];
	const ilsType = getILS(hostlms?.lmsClientClass);
	const profile = getHostLmsProfile(hostlms?.lmsClientClass);

	/**
	 * The guided form's starting values, and the keys it has no field for.
	 *
	 * The unmapped keys are not editable here, and are NOT lost: mergeClientConfigEdit
	 * carries them through. They are listed so an administrator can see that the guided
	 * form is not the whole config.
	 */
	const { values: initialConfigFields, unmappedKeys } = useMemo(
		() =>
			clientConfigToFields(hostlms?.lmsClientClass, hostlms?.clientConfig ?? {}),
		[hostlms?.lmsClientClass, hostlms?.clientConfig],
	);

	const methods = useForm<HostLmsFormFields>({
		mode: "onChange",
		values: {
			name: hostlms?.name ?? "",
			suppressionRulesetName: hostlms?.suppressionRulesetName ?? "",
			itemSuppressionRulesetName: hostlms?.itemSuppressionRulesetName ?? "",
			clientConfigFields: initialConfigFields,
		},
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = methods;

	const configValues = useWatch({ control, name: "clientConfigFields" });

	const requiredGaps = missingRequiredClientConfig(
		hostlms?.lmsClientClass,
		configValues ?? {},
	);
	const sharedSystemConflict = hasSharedSystemConflict(
		hostlms?.lmsClientClass,
		configValues ?? {},
	);
	const configBlocked = requiredGaps.length > 0 || sharedSystemConflict;

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning(isDirty);

	const onSubmit = (formData: HostLmsFormFields) => {
		const changedFields: Record<string, unknown> = {};

		if (formData.name !== (hostlms.name ?? ""))
			changedFields.name = formData.name;
		if (
			formData.suppressionRulesetName !== (hostlms.suppressionRulesetName ?? "")
		)
			changedFields.suppressionRulesetName = formData.suppressionRulesetName;
		if (
			formData.itemSuppressionRulesetName !==
			(hostlms.itemSuppressionRulesetName ?? "")
		)
			changedFields.itemSuppressionRulesetName =
				formData.itemSuppressionRulesetName;

		const nextConfig = mergeClientConfigEdit(
			hostlms.clientConfig,
			hostlms.lmsClientClass,
			formData.clientConfigFields ?? {},
		);
		// Compared as JSON because the config is a free-form object: there is no
		// field list to walk, and sending it unchanged would re-run the ping and
		// ingest probes against the LMS for nothing.
		if (JSON.stringify(nextConfig) !== JSON.stringify(hostlms.clientConfig ?? {}))
			changedFields.clientConfig = nextConfig;

		if (Object.keys(changedFields).length === 0) {
			setEditMode(false);
			return;
		}

		hostLmsMutation.requestFormEdit({
			id: hostlms.id,
			name: hostlms.name ?? hostlms.code,
			changedFields,
			// NOT formatChangedFields: that renders old -> new for every key, and for
			// clientConfig both sides are an object holding this system's credentials.
			// The dialog names what changed; the values stay out of it.
			changeSummary: Object.keys(changedFields)
				.map((key) => t(`hostlms.edit.changed.${key}`, { defaultValue: key }))
				.join(", "),
			onSuccess: (result) => {
				setEditMode(false);
				// The update re-probes the system, so a credential change that broke the
				// connection is reported here rather than at the next ingest run.
				setVerification({
					pingStatus: result?.pingStatus,
					ingestStatus: result?.ingestStatus,
					warnings: result?.warnings ?? [],
				});
				reset(undefined, { keepValues: false });
			},
		});
	};

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
					action={t("ui.actions.go_back")}
					goBack="/hostlmss"
				/>
			</PageContainer>
		);
	}

	const viewModeActions = [
		{
			key: "edit",
			// eslint-disable-next-line react-hooks/refs -- handleEdit only reads the ref inside the returned click handler (via requestAnimationFrame), never during render
			onClick: handleEdit(setEditMode, firstEditableFieldRef),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.edit"),
			startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
		},
	];

	const editModeActions = [
		<Button
			key="save"
			startIcon={<Save />}
			onClick={handleSubmit(onSubmit)}
			disabled={!isEmpty(errors) || !isDirty || configBlocked}
		>
			{t("ui.data_grid.save")}
		</Button>,
		<Button
			key="cancel"
			startIcon={<Cancel />}
			onClick={() => {
				setEditMode(false);
				reset();
			}}
		>
			{t("ui.data_grid.cancel")}
		</Button>,
	];

	const editableText = (
		name: "name" | "suppressionRulesetName" | "itemSuppressionRulesetName",
		label: string,
		value: string | undefined,
		isFirst = false,
	) => (
		<Grid size={{ xs: 2, sm: 4, md: 4 }}>
			<Stack direction="column">
				<Typography
					variant="attributeTitle"
					color={errors[name] ? "error" : "primary.attributeTitle"}
					id={`label-hostlms-${name}`}
				>
					{label}
				</Typography>
				<Controller
					name={name}
					control={control}
					render={({ field }) =>
						editMode ? (
							<TextField
								{...field}
								inputRef={isFirst ? firstEditableFieldRef : undefined}
								fullWidth
								error={!!errors[name]}
								// The visible label is the sibling Typography, not a bound
								// <label>, so without this the input has no accessible name.
								// Pointing at the element rather than repeating the string
								// keeps the two from diverging.
								slotProps={{
									htmlInput: {
										"aria-labelledby": `label-hostlms-${name}`,
									},
								}}
								helperText={errors[name]?.message}
							/>
						) : (
							<RenderAttribute attribute={value} />
						)
					}
				/>
			</Stack>
		</Grid>
	);

	return (
		<PageContainer
			title={hostlms.name}
			pageActions={editMode ? editModeActions : viewModeActions}
			mode={editMode ? "edit" : "view"}
		>
			<FormProvider {...methods}>
				<TabContext value={activeTab}>
					<TabList
						onChange={(_, val) => setActiveTab(val)}
						variant="scrollable"
						sx={{ mb: 3 }}
					>
						<Tab label={t("ui.info.general")} value="0" />
						<Tab label={t("hostlms.client_config.title")} value="1" />
					</TabList>

					<TabPanel value="0" sx={{ p: 0 }}>
						<Grid
							container
							spacing={{ xs: 2, md: 3 }}
							columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							component="form"
							onSubmit={handleSubmit(onSubmit)}
						>
							<Grid size={{ xs: 4, sm: 8, md: 12 }}>
								<Typography variant="accordionSummary">
									{t("ui.info.general")}
								</Typography>
							</Grid>

							<ConfigItem title={t("hostlms.code")} value={hostlms.code} />
							{editableText(
								"name",
								t("hostlms.name"),
								hostlms.name,
								true,
							)}
							<ConfigItem title={t("hostlms.id")} value={hostlms.id} />
							<ConfigItem
								title={t("hostlms.lms_client")}
								value={hostlms.lmsClientClass}
								tooltip={ilsType}
							/>
							{editableText(
								"suppressionRulesetName",
								t("hostlms.bibSuppressionRulesetName"),
								hostlms.suppressionRulesetName,
							)}
							{editableText(
								"itemSuppressionRulesetName",
								t("hostlms.itemSuppressionRulesetName"),
								hostlms.itemSuppressionRulesetName,
							)}

							{editMode && (
								<Grid size={{ xs: 4, sm: 8, md: 12 }}>
									<Alert severity="info">
										{t("hostlms.edit.immutable_note")}
									</Alert>
								</Grid>
							)}
						</Grid>
					</TabPanel>

					<TabPanel value="1" sx={{ p: 0 }}>
						{editMode ? (
							<Stack spacing={3}>
								{!profile && (
									<Alert severity="warning">
										{t("hostlms.edit.no_profile")}
									</Alert>
								)}
								{unmappedKeys.length > 0 && (
									<Alert severity="info">
										<AlertTitle>
											{t("hostlms.edit.config_preserved_title")}
										</AlertTitle>
										{t("hostlms.edit.config_preserved_body", {
											keys: unmappedKeys.join(", "),
										})}
									</Alert>
								)}
								{requiredGaps.length > 0 && (
									<Alert severity="error">
										{t("hostlms.config_fields.missing_required", {
											fields: requiredGaps
												.map((gap) => t(gap.labelKey))
												.join(", "),
										})}
									</Alert>
								)}
								{sharedSystemConflict && (
									<Alert severity="error">
										{t("hostlms.config_fields.shared_system_conflict")}
									</Alert>
								)}
								<RecommendedConfigGaps
									lmsClientClass={hostlms.lmsClientClass}
								/>
								<ClientConfigFields lmsClientClass={hostlms.lmsClientClass} />
							</Stack>
						) : (
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
								{/* Identifies a shared system: important for troubleshooters*/}
								<ConfigItem
									title={t("hostlms.client_config.shared_system")}
									value={String(
										hostlms.clientConfig?.["shared-system"] === true ||
											hostlms.clientConfig?.["shared-system"] === "true",
									)}
								/>

								{/* ILS Specific config Rendering */}
								{ilsType === "Polaris" && (
									<PolarisConfig config={hostlms.clientConfig} />
								)}
								{ilsType === "Alma" && (
									<AlmaConfig config={hostlms.clientConfig} />
								)}
								{ilsType === "Sierra" && (
									<SierraConfig config={hostlms.clientConfig} />
								)}
								{ilsType === "FOLIO" && (
									<FolioConfig config={hostlms.clientConfig} />
								)}
								{ilsType === "Koha" && (
									<KohaConfig config={hostlms.clientConfig} />
								)}
								{ilsType === "Foundation" && (
									<FoundationConfig config={hostlms.clientConfig} />
								)}
								{ilsType === "OpenRS appliance" && (
									<OrsApplianceConfig config={hostlms.clientConfig} />
								)}
							</Grid>
						)}
					</TabPanel>
				</TabContext>
			</FormProvider>

			{verification && (
				// Announced: the probes finish after the save dialog has closed, so a
				// screen-reader user gets no other signal that the connection broke.
				<Stack spacing={2} sx={{ mt: 4 }} role="status" aria-live="polite">
					<Typography variant="accordionSummary">
						{t("hostlms.verification.step")}
					</Typography>
					<HostLmsVerification result={verification} />
				</Stack>
			)}

			<EntityMutationDialogs {...hostLmsMutation.dialogProps} />
			{/* Not an entity mutation: this one guards navigation, not data. */}
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				action="unsaved"
				entityName={hostlms.name ?? hostlms.code}
			/>
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
