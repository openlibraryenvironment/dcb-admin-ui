import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Alert, AlertTitle, Skeleton, Stack, Typography } from "@mui/material";

import {
	classifyVerificationStatus,
	isIngestTimeout,
	type HostLmsVerificationResult,
	type VerificationSeverity,
} from "@helpers/hostLmsVerification";

type TestOperation = {
	key: string;
	label: string;
	severity: VerificationSeverity;
	detail: string;
	/** Extra guidance where the failure has a known, non-obvious meaning. */
	advice?: string;
};

// Normalises the verification payload into a flat list of test operations.
// Adding a future check (auth probe, holdings lookup, ...) is a single entry
// here - the render loop and styling below stay untouched.
const deriveTestOperations = (
	result: HostLmsVerificationResult,
	t: TFunction,
): TestOperation[] => [
	{
		key: "ping",
		label: t("hostlms.verification.ping"),
		severity: classifyVerificationStatus(result.pingStatus),
		detail: result.pingStatus ?? t("hostlms.verification.no_result"),
	},
	{
		key: "ingest",
		label: t("hostlms.verification.ingest"),
		severity: classifyVerificationStatus(result.ingestStatus),
		detail: result.ingestStatus ?? t("hostlms.verification.no_result"),
		advice: isIngestTimeout(result.ingestStatus)
			? t("hostlms.verification.ingest_timeout_advice")
			: undefined,
	},
];

type HostLmsResultStepProps = {
	result: HostLmsVerificationResult | null;
	/** The checks take up to 20 seconds, so the wait gets a shape of its own. */
	isVerifying?: boolean;
};

export default function HostLmsResultStep({
	result,
	isVerifying = false,
}: HostLmsResultStepProps) {
	const { t } = useTranslation();

	if (isVerifying)
		return (
			<Stack spacing={2} sx={{ mt: 1 }} aria-busy="true">
				<Typography>{t("hostlms.verification.in_progress")}</Typography>
				{/* Sized to the two result alerts that replace them, so the dialog
				    does not resize under the user when the checks return. */}
				<Skeleton variant="rounded" height={72} />
				<Skeleton variant="rounded" height={72} />
			</Stack>
		);

	if (!result) {
		return (
			<Alert severity="info" sx={{ mt: 1 }}>
				{t("hostlms.verification.empty")}
			</Alert>
		);
	}

	const operations = deriveTestOperations(result, t);
	const warnings = (result.warnings ?? []).filter(
		(warning): warning is string => !!warning,
	);

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			<Typography>
				{t("hostlms.verification.subtitle", {
					code: result.hostLms?.code ?? "",
				})}
			</Typography>

			{operations.map((operation) => (
				<Alert key={operation.key} severity={operation.severity}>
					<AlertTitle>{operation.label}</AlertTitle>
					{operation.detail}
					{operation.advice && (
						<Typography variant="body2" sx={{ mt: 1 }}>
							{operation.advice}
						</Typography>
					)}
				</Alert>
			))}

			{warnings.length > 0 && (
				<Alert severity="warning">
					<AlertTitle>{t("hostlms.verification.warnings_title")}</AlertTitle>
					<Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
						{warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</Stack>
				</Alert>
			)}

			{/* The Host LMS exists at this point regardless of what the probes said,
			    so the wizard can carry on - say so, or a red alert reads as a dead
			    end. */}
			<Alert severity="info">
				{t("hostlms.verification.continue_explanation")}
			</Alert>
		</Stack>
	);
}
