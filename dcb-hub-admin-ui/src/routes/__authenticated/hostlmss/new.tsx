import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { FormProvider, useForm, Controller, useWatch } from "react-hook-form";
import {
	Alert,
	AlertTitle,
	Autocomplete,
	Button,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import ErrorComponent from "@components/Error/Error";
import HostLmsVerification from "@components/HostLmsVerification/HostLmsVerification";
import ClientConfigFields, {
	RecommendedConfigGaps,
} from "@forms/NewLibrary/steps/ClientConfigFields";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import { createHostLmsMutation } from "@mutations/createHostLms";
import {
	HOST_LMS_PROFILES,
	buildClientConfig,
	hasSharedSystemConflict,
	missingRequiredClientConfig,
} from "@helpers/hostLmsClientConfig";
import type { HostLmsVerificationResult } from "@helpers/hostLmsVerification";
import {
	libraryOptionsQuery,
	type LibraryAutocompleteOption,
} from "@/queryOptions/libraries";
import type {
	CreateHostLmsInput,
	CreateHostLmsMutation,
	CreateHostLmsMutationVariables,
} from "@generated/graphql";

interface NewHostLmsFormFields {
	library: LibraryAutocompleteOption | null;
	code: string;
	name: string;
	lmsClientClass: string;
	suppressionRulesetName: string;
	itemSuppressionRulesetName: string;
	clientConfigFields: Record<string, unknown>;
}

interface CreatedHostLms {
	id: string;
	code: string;
	verification: HostLmsVerificationResult;
}

export const Route = createFileRoute("/__authenticated/hostlmss/new")({
	beforeLoad: ({ context: { auth } }) => {
		// MUST come first. react-oidc-context restores the stored session
		// asynchronously, so on a cold load beforeLoad runs before the roles exist and
		// would redirect an administrator who is merely not resolved yet. The render
		// guard below is the half that catches the cold path - see useIsConsortiumAdmin.
		if (!auth?.isAuthenticated) return;

		// A Host LMS holds the credentials DCB authenticates to a member system with.
		// Hiding the button is UX; this is the warm-path guard.
		const roles = (auth.user?.profile?.roles as string[]) ?? [];
		if (!roles.includes("ADMIN") && !roles.includes("CONSORTIUM_ADMIN")) {
			throw redirect({ to: "/unauthorised" });
		}
	},
	component: NewHostLms,
});

function NewHostLms() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();
	const navigate = useNavigate();

	const isAdmin = useIsConsortiumAdmin();

	const [created, setCreated] = useState<CreatedHostLms | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const { data: libraryOptions = [], isLoading: librariesLoading } = useQuery({
		...libraryOptionsQuery(gqlClient),
		enabled: !!auth?.isAuthenticated && isAdmin,
	});

	const methods = useForm<NewHostLmsFormFields>({
		mode: "onChange",
		defaultValues: {
			library: null,
			code: "",
			name: "",
			lmsClientClass: "",
			suppressionRulesetName: "",
			itemSuppressionRulesetName: "",
			clientConfigFields: {},
		},
	});

	const {
		control,
		handleSubmit,
		setValue,
		getValues,
		formState: { errors },
	} = methods;

	const [library, code, lmsClientClass, configValues] = useWatch({
		control,
		name: ["library", "code", "lmsClientClass", "clientConfigFields"],
	});

	const requiredGaps = missingRequiredClientConfig(
		lmsClientClass,
		configValues ?? {},
	);
	const sharedSystemConflict = hasSharedSystemConflict(
		lmsClientClass,
		configValues ?? {},
	);

	const { mutateAsync: create, isPending } = useMutation({
		mutationFn: (input: CreateHostLmsInput) =>
			gqlClient.request<CreateHostLmsMutation, CreateHostLmsMutationVariables>(
				createHostLmsMutation,
				{ input },
			),
	});

	/**
	 * Picking the library fills in what the library already decides: the agency the
	 * new system answers for, and a starting point for the code. Both stay editable -
	 * a shared system serves several libraries and gets neither.
	 */
	const onLibraryChange = (option: LibraryAutocompleteOption | null) => {
		setValue("library", option, { shouldDirty: true });
		if (!option) return;

		if (!getValues("code")) {
			setValue("code", option.value ?? "", { shouldDirty: true });
		}
		if (!getValues("clientConfigFields.default-agency-code")) {
			setValue("clientConfigFields.default-agency-code", option.value ?? "", {
				shouldDirty: true,
			});
		}
	};

	const onSubmit = async (formData: NewHostLmsFormFields) => {
		setSubmitError(null);
		try {
			const result = await create({
				code: formData.code.trim(),
				name: formData.name.trim() || formData.code.trim(),
				lmsClientClass: formData.lmsClientClass,
				// ingestSourceClass is deliberately absent: CreateHostLmsDataFetcher
				// derives it from lmsClientClass, and nothing in this app has ever sent it.
				clientConfig: buildClientConfig(
					formData.lmsClientClass,
					formData.clientConfigFields ?? {},
				),
				suppressionRulesetName: formData.suppressionRulesetName.trim() || null,
				itemSuppressionRulesetName:
					formData.itemSuppressionRulesetName.trim() || null,
				reason: t("hostlms.new_host_lms.audit_reason", {
					library: formData.library?.label,
				}),
				changeCategory: "New feature",
			});

			const payload = result?.createHostLms;
			// `hostLms` is nullable on CreateHostLmsResult, and a result with no record
			// is a failed create however cheerful the envelope looks. Reported rather
			// than rendered as a success page with a dead link.
			if (!payload?.hostLms?.id) {
				setSubmitError(t("hostlms.error.no_data_returned"));
				return;
			}
			setCreated({
				id: payload.hostLms.id,
				code: payload.hostLms.code ?? formData.code.trim(),
				verification: {
					pingStatus: payload?.pingStatus,
					ingestStatus: payload?.ingestStatus,
					warnings: payload?.warnings ?? [],
				},
			});
		} catch (error: any) {
			// Named, not swallowed: the validator returns a 400 listing exactly which
			// keys it refused, and that message is the only thing that says which.
			setSubmitError(
				error?.response?.errors?.[0]?.message ??
					error?.message ??
					t("hostlms.error.no_data_returned"),
			);
		}
	};

	const blocked =
		!library ||
		!code.trim() ||
		!lmsClientClass ||
		requiredGaps.length > 0 ||
		sharedSystemConflict ||
		isPending;

	// The second half of the guard, for the cold path beforeLoad cannot see. The form
	// is never rendered.
	if (!isAdmin) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<ErrorComponent
					title={t("ui.error.401.name")}
					message={t("ui.error.401.summary")}
					description={t("ui.error.401.description")}
					action={t("ui.error.401.action")}
					goBack="/hostlmss"
				/>
			</PageContainer>
		);
	}

	if (created) {
		return (
			<PageContainer title={t("hostlms.new_host_lms.created_title")}>
				<Stack spacing={3} sx={{ maxWidth: 900 }}>
					<Alert severity="success">
						{t("hostlms.new_host_lms.created_body", { code: created.code })}
					</Alert>

					<Alert severity="warning">
						<AlertTitle>
							{t("hostlms.new_host_lms.not_attached_title")}
						</AlertTitle>
						{t("hostlms.new_host_lms.not_attached_body")}
					</Alert>

					<Stack spacing={2} role="status" aria-live="polite">
						<Typography variant="accordionSummary">
							{t("hostlms.verification.step")}
						</Typography>
						<HostLmsVerification result={created.verification} />
					</Stack>

					<Stack direction="row" spacing={2}>
						<Button
							variant="contained"
							onClick={() =>
								navigate({
									to: "/hostlmss/$hostlmsId",
									params: { hostlmsId: created.id },
								})
							}
						>
							{t("hostlms.new_host_lms.go_to_record")}
						</Button>
						<Button onClick={() => navigate({ to: "/hostlmss" })}>
							{t("hostlms.new_host_lms.back_to_list")}
						</Button>
					</Stack>
				</Stack>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={t("hostlms.new_host_lms.title")}>
			<FormProvider {...methods}>
				<Stack
					spacing={3}
					sx={{ maxWidth: 900 }}
					component="form"
					onSubmit={handleSubmit(onSubmit)}
				>
					<Alert severity="info">
						{t("hostlms.new_host_lms.explanation")}
					</Alert>

					<Controller
						name="library"
						control={control}
						render={({ field }) => (
							<Autocomplete
								options={libraryOptions}
								loading={librariesLoading}
								value={field.value}
								onChange={(_, option) => onLibraryChange(option)}
								isOptionEqualToValue={(option, value) =>
									option.id === value?.id
								}
								renderInput={(params) => (
									<TextField
										{...params}
										required
										label={t("hostlms.new_host_lms.library")}
										helperText={t("hostlms.new_host_lms.library_help")}
									/>
								)}
							/>
						)}
					/>

					<Controller
						name="code"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								required
								label={t("hostlms.code")}
								error={!!errors.code}
								helperText={errors.code?.message ?? t("hostlms.code_helper")}
							/>
						)}
					/>

					<Controller
						name="name"
						control={control}
						render={({ field }) => (
							<TextField {...field} label={t("hostlms.name")} />
						)}
					/>

					<Controller
						name="lmsClientClass"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								select
								required
								label={t("hostlms.client_class")}
								helperText={t("hostlms.new_host_lms.client_class_help")}
							>
								{HOST_LMS_PROFILES.map((profile) => (
									<MenuItem
										key={profile.lmsClientClass}
										value={profile.lmsClientClass}
									>
										{t(profile.labelKey)}
									</MenuItem>
								))}
							</TextField>
						)}
					/>

					{lmsClientClass ? (
						<>
							<Typography variant="accordionSummary">
								{t("hostlms.client_config.title")}
							</Typography>
							{sharedSystemConflict && (
								<Alert severity="error">
									{t("hostlms.config_fields.shared_system_conflict")}
								</Alert>
							)}
							<RecommendedConfigGaps lmsClientClass={lmsClientClass} />
							<ClientConfigFields lmsClientClass={lmsClientClass} />
						</>
					) : (
						<Alert severity="info">{t("hostlms.select_type_first")}</Alert>
					)}

					<Controller
						name="suppressionRulesetName"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label={t("hostlms.bibSuppressionRulesetName")}
							/>
						)}
					/>
					<Controller
						name="itemSuppressionRulesetName"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label={t("hostlms.itemSuppressionRulesetName")}
							/>
						)}
					/>

					{requiredGaps.length > 0 && lmsClientClass && (
						<Alert severity="error">
							{t("hostlms.config_fields.missing_required", {
								fields: requiredGaps.map((gap) => t(gap.labelKey)).join(", "),
							})}
						</Alert>
					)}

					{submitError && (
						<Alert severity="error" role="alert">
							{submitError}
						</Alert>
					)}

					<Stack direction="row" spacing={2}>
						<Button type="submit" variant="contained" disabled={blocked}>
							{isPending
								? t("hostlms.busy_creating")
								: t("hostlms.new_host_lms.submit")}
						</Button>
						<Button onClick={() => navigate({ to: "/hostlmss" })}>
							{t("ui.data_grid.cancel")}
						</Button>
					</Stack>
				</Stack>
			</FormProvider>
		</PageContainer>
	);
}
