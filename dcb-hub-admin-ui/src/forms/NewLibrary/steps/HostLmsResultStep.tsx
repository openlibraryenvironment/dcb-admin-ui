import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Alert, AlertTitle, Stack, Typography } from "@mui/material";

// Mirror of CreateHostLmsDataFetcher.CreateHostLmsResult (dcb-service). The
// status fields are human-readable diagnostic strings the backend builds, e.g.
// "Status: OK", "Ping Failed: ...", "Success: Retrieved chunk with N records.",
// "Skipped: ...", "Ingest Check Failed: ...".
export type HostLmsVerificationResult = {
	hostLms?: { code?: string | null; name?: string | null } | null;
	pingStatus?: string | null;
	ingestStatus?: string | null;
	warnings?: (string | null)[] | null;
};

type OperationSeverity = "success" | "error" | "info";

type TestOperation = {
	key: string;
	label: string;
	severity: OperationSeverity;
	detail: string;
};

// The backend prefixes every diagnostic string with an outcome token, so we can
// classify severity without the LMS-specific detail leaking into this layer.
const classifyStatus = (status?: string | null): OperationSeverity => {
	if (!status) return "info";
	const lower = status.toLowerCase();
	if (lower.includes("failed")) return "error";
	if (lower.startsWith("skipped")) return "info";
	return "success";
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
		severity: classifyStatus(result.pingStatus),
		detail: result.pingStatus ?? t("hostlms.verification.no_result"),
	},
	{
		key: "ingest",
		label: t("hostlms.verification.ingest"),
		severity: classifyStatus(result.ingestStatus),
		detail: result.ingestStatus ?? t("hostlms.verification.no_result"),
	},
];

type HostLmsResultStepProps = {
	result: HostLmsVerificationResult | null;
};

export default function HostLmsResultStep({ result }: HostLmsResultStepProps) {
	const { t } = useTranslation();

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
		</Stack>
	);
}
