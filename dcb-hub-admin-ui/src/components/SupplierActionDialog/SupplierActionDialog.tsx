import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Stack,
} from "@mui/material";

import RequestReference from "@components/RequestReference/RequestReference";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { invalidatePatronRequestQueries } from "@helpers/invalidatePatronRequestQueries";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import {
	type SupplierAction,
	type SupplierActionOutcome,
	runSupplierAction,
} from "@helpers/supplierRequestActions";
import {
	consortiumFunctionalSettingsQuery,
	isFunctionalSettingEnabled,
} from "@/queryOptions/consortiumFunctionalSettings";

interface SupplierActionDialogProps {
	action: SupplierAction;
	supplier: { id: string; localAgency?: string | null };
	isManuallySelectedItem?: boolean | null;
	onClose: () => void;
}

/** What skip will do: ResolveNextSupplierTransition cancels the request instead of re-resolving. */
const skipWarningKey = (
	reResolution: boolean | undefined,
	manuallySelected: boolean,
): string => {
	if (manuallySelected)
		return "patron_request.supplier_actions.skip_warning_manual";
	if (reResolution === false)
		return "patron_request.supplier_actions.skip_warning_no_re_resolution";
	if (reResolution === true)
		return "patron_request.supplier_actions.skip_warning_re_resolves";
	return "patron_request.supplier_actions.skip_warning_unknown";
};

const outcomeAlert = (
	outcome: SupplierActionOutcome,
): {
	severity: "success" | "warning" | "error";
	key: string;
	status?: string;
} => {
	switch (outcome.kind) {
		case "skipped":
			return { severity: "success", key: "skipped" };
		case "cancelled":
			if (outcome.paused) return { severity: "success", key: "cancelled" };
			return outcome.supplierStatus
				? {
						severity: "warning",
						key: "cancel_not_confirmed_status",
						status: outcome.supplierStatus,
					}
				: { severity: "warning", key: "cancel_not_confirmed" };
		case "reactivated":
			return outcome.activeNow
				? { severity: "success", key: "reactivated" }
				: { severity: "warning", key: "reactivate_not_applied" };
		case "forbidden":
			return { severity: "error", key: "forbidden" };
		case "notFound":
			return { severity: "error", key: "not_found" };
		default:
			return { severity: "error", key: "failed" };
	}
};

/**
 * Confirms and runs one supplier fix-up, then says what happened in place: the server's
 * own message for skip claims re-resolution whatever the outcome, so the dialog reports
 * the outcome kind and the refetched request shows the rest.
 */
export default function SupplierActionDialog({
	action,
	supplier,
	isManuallySelectedItem,
	onClose,
}: SupplierActionDialogProps) {
	const { t } = useTranslation();
	const restClient = useDcbRestClient();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const agency = supplier.localAgency ?? "";

	const settings = useQuery({
		...consortiumFunctionalSettingsQuery(gqlClient),
		...nonCriticalQuery,
		enabled: action === "skip",
	});

	const mutation = useMutation({
		mutationFn: () => runSupplierAction(restClient, action, supplier.id),
		onSuccess: (outcome) => {
			if (outcome.kind !== "failed" && outcome.kind !== "forbidden")
				return invalidatePatronRequestQueries(queryClient);
		},
	});

	const titleId = `supplier-action-${action}-title`;
	const outcome = mutation.data;
	const alert = outcome && outcomeAlert(outcome);
	// Escape or the backdrop mid-flight would hide the outcome and re-offer the action, and on
	// 8.71.0 a second skip acts on whichever supplier is active by then
	const close = () => {
		if (!mutation.isPending) onClose();
	};
	// Confirming before the setting loads would skip on the "unknown" warning; an errored
	// query is no longer pending, so the button comes back with that warning in place
	const awaitingWarning = action === "skip" && settings.isPending;

	return (
		<Dialog open onClose={close} aria-labelledby={titleId}>
			<DialogTitle id={titleId}>
				{t(`patron_request.supplier_actions.${action}_title`)}
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2}>
					<DialogContentText>
						{t(`patron_request.supplier_actions.${action}_body`, { agency })}
					</DialogContentText>
					{action === "skip" && (
						<Alert severity="warning">
							{t(
								skipWarningKey(
									isFunctionalSettingEnabled(settings.data, "RE_RESOLUTION"),
									isManuallySelectedItem === true,
								),
							)}
						</Alert>
					)}
					<div role="status" aria-live="polite">
						{alert && (
							<Alert severity={alert.severity}>
								{t(`patron_request.supplier_actions.outcome.${alert.key}`, {
									agency,
									status: alert.status,
									message:
										outcome?.kind === "failed" ? (outcome.message ?? "") : "",
								})}
								{outcome?.kind === "failed" && outcome.reference && (
									<RequestReference reference={outcome.reference} />
								)}
							</Alert>
						)}
					</div>
				</Stack>
			</DialogContent>
			<DialogActions>
				{outcome ? (
					<Button
						onClick={onClose}
						variant="contained"
						// eslint-disable-next-line jsx-a11y/no-autofocus -- the focused confirm button has just unmounted, so focus would fall to the dialog container (WCAG 2.4.3)
						autoFocus
					>
						{t("ui.actions.close")}
					</Button>
				) : (
					<>
						<Button onClick={onClose} disabled={mutation.isPending}>
							{t("ui.actions.cancel")}
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							variant="contained"
							color={action === "reactivate" ? "primary" : "error"}
							disabled={mutation.isPending || awaitingWarning}
							startIcon={
								mutation.isPending ? (
									<CircularProgress size="1rem" aria-hidden />
								) : undefined
							}
						>
							{t(`patron_request.supplier_actions.${action}`)}
						</Button>
					</>
				)}
			</DialogActions>
		</Dialog>
	);
}
