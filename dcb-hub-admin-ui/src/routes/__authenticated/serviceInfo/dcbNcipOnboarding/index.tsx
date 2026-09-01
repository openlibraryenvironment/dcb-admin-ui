import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	FormControlLabel,
	List,
	ListItem,
	ListItemText,
	Stack,
	Stepper,
	Step,
	StepLabel,
	TextField,
	Typography,
} from "@mui/material";
import { ContentCopy, ExpandMore, Refresh } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	canManageDcbNcipOnboarding,
	DcbInvitationPolicyError,
	DcbInvitationPolicyForm,
	DcbInvitationResponse,
	initialDcbInvitationPolicy,
	issueDcbNcipInvitation,
	loadDcbNcipReadiness,
	validateDcbInvitationPolicy,
} from "@helpers/dcbNcipOnboarding";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/dcbNcipOnboarding/",
)({
	component: DcbNcipOnboarding,
});

function DcbNcipOnboarding() {
	const { t } = useTranslation();
	const auth = useAuth();
	const client = useDcbRestClient();
	const roles = (auth.user?.profile?.roles as string[] | undefined) ?? [];
	const canManage = canManageDcbNcipOnboarding(roles);
	const [policy, setPolicy] = useState<DcbInvitationPolicyForm>(
		initialDcbInvitationPolicy,
	);
	const [readiness, setReadiness] = useState<Awaited<
		ReturnType<typeof loadDcbNcipReadiness>
	> | null>(null);
	const [loadingReadiness, setLoadingReadiness] = useState(true);
	const [stage, setStage] = useState(0);
	const [invitation, setInvitation] = useState<DcbInvitationResponse | null>(
		null,
	);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<"base" | "token" | null>(null);
	const [now, setNow] = useState(0);

	const loadReadiness = useCallback(async () => {
		setLoadingReadiness(true);
		setError(null);
		try {
			setReadiness(await loadDcbNcipReadiness(client));
		} catch (requestError) {
			setReadiness(null);
			setError(
				problemDetail(requestError, t("dcb_ncip_onboarding.errors.readiness")),
			);
		} finally {
			setLoadingReadiness(false);
		}
	}, [client, t]);

	useEffect(() => {
		if (!canManage) return;
		const timeout = window.setTimeout(() => void loadReadiness(), 0);
		return () => window.clearTimeout(timeout);
	}, [canManage, loadReadiness]);

	// The redirect to /serviceInfo that used to live here is gone. canManageDcbNcipOnboarding
	// is adminOrConsortiumAdmin - exactly the set the application-wide bar admits - so it
	// could only ever fire for somebody the __authenticated layout has already sent to
	// /unauthorised.
	//
	// Two effects racing to redirect the same user to two different places is not merely
	// redundant: the e2e suite caught it failing intermittently under parallel load,
	// landing on whichever guard happened to schedule first. One rule, one destination.

	useEffect(() => {
		if (!invitation) return;
		const interval = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(interval);
	}, [invitation]);

	const policyErrors = useMemo(
		() => validateDcbInvitationPolicy(policy),
		[policy],
	);
	const remainingSeconds = invitation
		? Math.max(0, Math.floor((Date.parse(invitation.expiresAt) - now) / 1000))
		: 0;

	const updatePolicy = <K extends keyof DcbInvitationPolicyForm>(
		key: K,
		value: DcbInvitationPolicyForm[K],
	) => setPolicy((current) => ({ ...current, [key]: value }));

	const review = () => {
		setError(null);
		if (policyErrors.length === 0) setStage(1);
	};

	const issue = async () => {
		setSubmitting(true);
		setError(null);
		try {
			const response = await issueDcbNcipInvitation(client, policy);
			setInvitation(response);
			setNow(Date.now());
			setStage(2);
		} catch (requestError) {
			setError(
				problemDetail(requestError, t("dcb_ncip_onboarding.errors.issue")),
			);
		} finally {
			setSubmitting(false);
		}
	};

	const copy = async (kind: "base" | "token", value: string) => {
		await navigator.clipboard.writeText(value);
		setCopied(kind);
	};

	const startAgain = () => {
		setInvitation(null);
		setPolicy(initialDcbInvitationPolicy());
		setCopied(null);
		setError(null);
		setStage(0);
		void loadReadiness();
	};

	if (!canManage) return null;

	return (
		<PageContainer title={t("nav.serviceInfo.dcbNcipOnboarding")}>
			<Stack spacing={3} sx={{ maxWidth: 900 }}>
				<Typography>{t("dcb_ncip_onboarding.introduction")}</Typography>

				{error && <Alert severity="error">{error}</Alert>}

				{loadingReadiness ? (
					<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
						<CircularProgress size={24} />
						<Typography>
							{t("dcb_ncip_onboarding.readiness.loading")}
						</Typography>
					</Stack>
				) : readiness ? (
					<ReadinessPanel
						readiness={readiness}
						onRefresh={() => void loadReadiness()}
					/>
				) : (
					<Button
						variant="outlined"
						startIcon={<Refresh />}
						onClick={() => void loadReadiness()}
					>
						{t("dcb_ncip_onboarding.actions.retry")}
					</Button>
				)}

				{readiness?.ready && (
					<>
						<Stepper activeStep={stage} alternativeLabel>
							{[
								t("dcb_ncip_onboarding.steps.policy"),
								t("dcb_ncip_onboarding.steps.review"),
								t("dcb_ncip_onboarding.steps.invitation"),
							].map((label) => (
								<Step key={label}>
									<StepLabel>{label}</StepLabel>
								</Step>
							))}
						</Stepper>

						{stage === 0 && (
							<PolicyForm
								policy={policy}
								errors={policyErrors}
								onChange={updatePolicy}
								onReview={review}
							/>
						)}

						{stage === 1 && (
							<ReviewPolicy
								policy={policy}
								submitting={submitting}
								onBack={() => setStage(0)}
								onIssue={() => void issue()}
							/>
						)}

						{stage === 2 && invitation && readiness.dcbBaseUrl && (
							<InvitationResult
								invitation={invitation}
								dcbBaseUrl={readiness.dcbBaseUrl}
								remainingSeconds={remainingSeconds}
								copied={copied}
								onCopy={copy}
								onStartAgain={startAgain}
							/>
						)}
					</>
				)}
			</Stack>
		</PageContainer>
	);
}

function ReadinessPanel({
	readiness,
	onRefresh,
}: {
	readiness: Awaited<ReturnType<typeof loadDcbNcipReadiness>>;
	onRefresh: () => void;
}) {
	const { t } = useTranslation();
	return (
		<Box>
			<Alert
				severity={readiness.ready ? "success" : "warning"}
				action={
					<Button color="inherit" size="small" onClick={onRefresh}>
						{t("dcb_ncip_onboarding.actions.refresh")}
					</Button>
				}
			>
				{t(
					readiness.ready
						? "dcb_ncip_onboarding.readiness.ready"
						: "dcb_ncip_onboarding.readiness.not_ready",
				)}
			</Alert>
			<List aria-label={String(t("dcb_ncip_onboarding.readiness.checks"))}>
				{readiness.checks.map((check) => (
					<ListItem key={check.code} divider alignItems="flex-start">
						<Chip
							label={check.status}
							color={check.status === "PASS" ? "success" : "warning"}
							size="small"
							sx={{ mr: 2, mt: 0.5 }}
						/>
						<ListItemText
							primary={check.code}
							secondary={check.remediation || check.message}
						/>
					</ListItem>
				))}
			</List>
		</Box>
	);
}

function PolicyForm({
	policy,
	errors,
	onChange,
	onReview,
}: {
	policy: DcbInvitationPolicyForm;
	errors: DcbInvitationPolicyError[];
	onChange: <K extends keyof DcbInvitationPolicyForm>(
		key: K,
		value: DcbInvitationPolicyForm[K],
	) => void;
	onReview: () => void;
}) {
	const { t } = useTranslation();
	const errorText = (codes: DcbInvitationPolicyError[]) => {
		const code = codes.find((candidate) => errors.includes(candidate));
		return code ? t(`dcb_ncip_onboarding.validation.${code}`) : undefined;
	};
	return (
		<Stack spacing={2}>
			<Typography variant="h2">
				{t("dcb_ncip_onboarding.policy.title")}
			</Typography>
			<TextField
				label={t("dcb_ncip_onboarding.policy.host_lms_code")}
				value={policy.hostLmsCode}
				onChange={(event) => onChange("hostLmsCode", event.target.value)}
				error={errors.some((code) => code.startsWith("HOST_LMS_CODE"))}
				helperText={errorText([
					"HOST_LMS_CODE_REQUIRED",
					"HOST_LMS_CODE_TOO_LONG",
				])}
			/>
			<TextField
				label={t("dcb_ncip_onboarding.policy.agency_code")}
				value={policy.agencyCode}
				onChange={(event) => onChange("agencyCode", event.target.value)}
				error={errors.some((code) => code.startsWith("AGENCY_CODE"))}
				helperText={errorText(["AGENCY_CODE_REQUIRED", "AGENCY_CODE_TOO_LONG"])}
			/>
			<TextField
				label={t("dcb_ncip_onboarding.policy.expected_symbol")}
				value={policy.expectedSymbol}
				onChange={(event) => onChange("expectedSymbol", event.target.value)}
				error={errors.includes("EXPECTED_SYMBOL_REQUIRED")}
				helperText={errorText(["EXPECTED_SYMBOL_REQUIRED"])}
			/>
			<Stack>
				<FormControlLabel
					control={
						<Checkbox
							checked={policy.borrowingAllowed}
							onChange={(event) =>
								onChange("borrowingAllowed", event.target.checked)
							}
						/>
					}
					label={t("dcb_ncip_onboarding.policy.borrowing")}
				/>
				<FormControlLabel
					control={
						<Checkbox
							checked={policy.supplyingAllowed}
							onChange={(event) => {
								onChange("supplyingAllowed", event.target.checked);
								if (!event.target.checked) onChange("ingestAllowed", false);
							}}
						/>
					}
					label={t("dcb_ncip_onboarding.policy.supplying")}
				/>
				<FormControlLabel
					control={
						<Checkbox
							checked={policy.ingestAllowed}
							disabled={!policy.supplyingAllowed}
							onChange={(event) =>
								onChange("ingestAllowed", event.target.checked)
							}
						/>
					}
					label={t("dcb_ncip_onboarding.policy.ingest")}
				/>
			</Stack>
			{errors.includes("PARTICIPATION_ROLE_REQUIRED") && (
				<Alert severity="error">
					{t("dcb_ncip_onboarding.validation.PARTICIPATION_ROLE_REQUIRED")}
				</Alert>
			)}
			<Accordion>
				<AccordionSummary expandIcon={<ExpandMore />}>
					<Typography>{t("dcb_ncip_onboarding.policy.advanced")}</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Stack spacing={2}>
						<TextField
							label={t("dcb_ncip_onboarding.policy.auth_profile")}
							value={policy.authProfile}
							onChange={(event) => onChange("authProfile", event.target.value)}
							error={errors.some(
								(code) =>
									code === "AUTH_PROFILE_REQUIRED" ||
									code === "AUTH_PROFILE_TOO_LONG" ||
									code === "AUTH_PROFILE_DEFAULT_NOT_ALLOWED",
							)}
							helperText={errorText([
								"AUTH_PROFILE_REQUIRED",
								"AUTH_PROFILE_TOO_LONG",
								"AUTH_PROFILE_DEFAULT_NOT_ALLOWED",
							])}
						/>
						<TextField
							label={t("dcb_ncip_onboarding.policy.allowed_auth_profiles")}
							value={policy.allowedAuthProfiles}
							onChange={(event) =>
								onChange("allowedAuthProfiles", event.target.value)
							}
							multiline
							minRows={2}
							error={errors.some(
								(code) =>
									code === "ALLOWED_AUTH_PROFILE_TOO_LONG" ||
									code === "ALLOWED_AUTH_PROFILE_DUPLICATE",
							)}
							helperText={
								errorText([
									"ALLOWED_AUTH_PROFILE_TOO_LONG",
									"ALLOWED_AUTH_PROFILE_DUPLICATE",
								]) ?? t("dcb_ncip_onboarding.policy.allowed_auth_profiles_help")
							}
						/>
						<TextField
							label={t("dcb_ncip_onboarding.policy.max_loans")}
							value={policy.maxConsortialLoans}
							onChange={(event) =>
								onChange("maxConsortialLoans", event.target.value)
							}
							error={errors.includes("MAX_LOANS_INVALID")}
							helperText={errorText(["MAX_LOANS_INVALID"])}
							inputMode="numeric"
						/>
						<TextField
							label={t("dcb_ncip_onboarding.policy.suppression_ruleset")}
							value={policy.suppressionRulesetName}
							onChange={(event) =>
								onChange("suppressionRulesetName", event.target.value)
							}
						/>
						<TextField
							label={t("dcb_ncip_onboarding.policy.item_suppression_ruleset")}
							value={policy.itemSuppressionRulesetName}
							onChange={(event) =>
								onChange("itemSuppressionRulesetName", event.target.value)
							}
						/>
					</Stack>
				</AccordionDetails>
			</Accordion>
			<Box>
				<Button
					variant="contained"
					onClick={onReview}
					disabled={errors.length > 0}
				>
					{t("dcb_ncip_onboarding.actions.review")}
				</Button>
			</Box>
		</Stack>
	);
}

function ReviewPolicy({
	policy,
	submitting,
	onBack,
	onIssue,
}: {
	policy: DcbInvitationPolicyForm;
	submitting: boolean;
	onBack: () => void;
	onIssue: () => void;
}) {
	const { t } = useTranslation();
	const values = [
		[t("dcb_ncip_onboarding.policy.host_lms_code"), policy.hostLmsCode],
		[t("dcb_ncip_onboarding.policy.agency_code"), policy.agencyCode],
		[t("dcb_ncip_onboarding.policy.expected_symbol"), policy.expectedSymbol],
		[t("dcb_ncip_onboarding.policy.auth_profile"), policy.authProfile],
		[
			t("dcb_ncip_onboarding.policy.allowed_auth_profiles"),
			policy.allowedAuthProfiles || policy.authProfile,
		],
		[
			t("dcb_ncip_onboarding.policy.permissions"),
			[
				policy.borrowingAllowed && t("dcb_ncip_onboarding.policy.borrowing"),
				policy.supplyingAllowed && t("dcb_ncip_onboarding.policy.supplying"),
				policy.ingestAllowed && t("dcb_ncip_onboarding.policy.ingest"),
			]
				.filter(Boolean)
				.join(", "),
		],
	];
	return (
		<Stack spacing={2}>
			<Alert severity="warning">
				{t("dcb_ncip_onboarding.review.warning")}
			</Alert>
			<List>
				{values.map(([label, value]) => (
					<ListItem key={label} divider>
						<ListItemText primary={label} secondary={value} />
					</ListItem>
				))}
			</List>
			<Stack direction="row" spacing={2}>
				<Button variant="outlined" onClick={onBack} disabled={submitting}>
					{t("dcb_ncip_onboarding.actions.back")}
				</Button>
				<Button variant="contained" onClick={onIssue} disabled={submitting}>
					{submitting
						? t("dcb_ncip_onboarding.actions.issuing")
						: t("dcb_ncip_onboarding.actions.issue")}
				</Button>
			</Stack>
		</Stack>
	);
}

function InvitationResult({
	invitation,
	dcbBaseUrl,
	remainingSeconds,
	copied,
	onCopy,
	onStartAgain,
}: {
	invitation: DcbInvitationResponse;
	dcbBaseUrl: string;
	remainingSeconds: number;
	copied: "base" | "token" | null;
	onCopy: (kind: "base" | "token", value: string) => Promise<void>;
	onStartAgain: () => void;
}) {
	const { t } = useTranslation();
	const expired = remainingSeconds === 0;
	return (
		<Stack spacing={2}>
			<Alert severity={expired ? "warning" : "success"}>
				{expired
					? t("dcb_ncip_onboarding.result.expired")
					: t("dcb_ncip_onboarding.result.created", {
							minutes: Math.floor(remainingSeconds / 60),
							seconds: String(remainingSeconds % 60).padStart(2, "0"),
						})}
			</Alert>
			<Typography>{t("dcb_ncip_onboarding.result.instructions")}</Typography>
			<TextField
				label={t("dcb_ncip_onboarding.result.base_url")}
				value={dcbBaseUrl}
				fullWidth
				slotProps={{ input: { readOnly: true } }}
			/>
			<Button
				variant="outlined"
				startIcon={<ContentCopy />}
				onClick={() => void onCopy("base", dcbBaseUrl)}
			>
				{copied === "base"
					? t("dcb_ncip_onboarding.actions.copied")
					: t("dcb_ncip_onboarding.actions.copy_base")}
			</Button>
			<TextField
				label={t("dcb_ncip_onboarding.result.token")}
				value={invitation.invitation}
				fullWidth
				multiline
				slotProps={{ input: { readOnly: true } }}
			/>
			<Button
				variant="contained"
				startIcon={<ContentCopy />}
				disabled={expired}
				onClick={() => void onCopy("token", invitation.invitation)}
			>
				{copied === "token"
					? t("dcb_ncip_onboarding.actions.copied")
					: t("dcb_ncip_onboarding.actions.copy_token")}
			</Button>
			<Typography variant="caption">
				{t("dcb_ncip_onboarding.result.not_recoverable")}
			</Typography>
			<Box>
				<Button variant="outlined" onClick={onStartAgain}>
					{t("dcb_ncip_onboarding.actions.new_invitation")}
				</Button>
			</Box>
		</Stack>
	);
}

function problemDetail(error: unknown, fallback: string): string {
	if (
		axios.isAxiosError(error) &&
		typeof error.response?.data?.detail === "string"
	) {
		return error.response.data.detail;
	}
	return fallback;
}
