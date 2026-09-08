import { RefObject, useState } from "react";
import axios from "axios";
import { useAuth } from "react-oidc-context";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
	GridApiPremium,
	gridRowSelectionIdsSelector,
} from "@mui/x-data-grid-premium";
import { rollbackStatuses } from "@constants/statuses/rollbackStatuses";
import { invalidatePatronRequestQueries } from "@helpers/invalidatePatronRequestQueries";

interface UsePatronRequestRollbackProps {
	apiRef: RefObject<GridApiPremium | null>;
	onSuccess?: () => void;
}

interface RollbackState {
	open: boolean;
	isRollingBack: boolean;
	total: number;
	processed: number;
	successRows: any[];
	errorRows: any[];
	skippedRows: any[];
}

const INITIAL_STATE: RollbackState = {
	open: false,
	isRollingBack: false,
	total: 0,
	processed: 0,
	successRows: [],
	errorRows: [],
	skippedRows: [],
};

/**
 * Bulk rollback for the patron request grids. Mirrors usePatronRequestCleanup,
 * but with two hard constraints baked in rather than left to the caller:
 *
 *  - ONLY requests in an ERROR state are eligible (rollbackStatuses). Everything
 *    else in the selection is skipped, never posted.
 *  - The run is gated behind an explicit confirmation (requestRollback opens it,
 *    confirmAndRun executes) because a rollback is only ever safe after an
 *    outage - see the warning the confirmation modal renders.
 *
 * Auth token and API base are resolved here (not passed in) so a grid opts in
 * with just an apiRef.
 */
export const usePatronRequestRollback = ({
	apiRef,
	onSuccess,
}: UsePatronRequestRollbackProps) => {
	const auth = useAuth();
	const { cfg } = useRouter().options.context as { cfg: any };
	const dcbApiBase = cfg?.VITE_DCB_API_BASE;
	const queryClient = useQueryClient();

	const [confirmOpen, setConfirmOpen] = useState(false);
	// Eligible/skipped are split at request time and held so the confirmation can
	// summarise the split and the run does not have to re-read the selection.
	const [pending, setPending] = useState<{ eligible: any[]; skipped: any[] }>({
		eligible: [],
		skipped: [],
	});
	const [rollbackState, setRollbackState] =
		useState<RollbackState>(INITIAL_STATE);

	const splitSelection = () => {
		if (apiRef == null) return { eligible: [], skipped: [] };
		const selectedRows = Array.from(
			gridRowSelectionIdsSelector(apiRef).values(),
		).filter((row) => row !== null && row !== undefined);

		const eligible: any[] = [];
		const skipped: any[] = [];
		selectedRows.forEach((row) => {
			if (rollbackStatuses.includes(row.status)) {
				eligible.push(row);
			} else {
				skipped.push(row);
			}
		});
		return { eligible, skipped };
	};

	// Open the confirmation, having worked out what is eligible so the modal can
	// tell the user exactly what will and will not happen.
	const requestRollback = () => {
		setPending(splitSelection());
		setConfirmOpen(true);
	};

	const cancelConfirm = () => setConfirmOpen(false);

	const confirmAndRun = async () => {
		setConfirmOpen(false);
		const { eligible, skipped } = pending;

		setRollbackState({
			open: true,
			isRollingBack: eligible.length > 0,
			total: eligible.length,
			processed: 0,
			successRows: [],
			errorRows: [],
			skippedRows: skipped,
		});

		if (eligible.length === 0) return;

		let processed = 0;
		const batchSize = 5;

		for (let i = 0; i < eligible.length; i += batchSize) {
			const batch = eligible.slice(i, i + batchSize);
			const batchSuccess: any[] = [];
			const batchError: any[] = [];

			await Promise.all(
				batch.map(async (row) => {
					try {
						await axios.post(
							`${dcbApiBase}/patrons/requests/${row.id}/rollback`,
							{},
							{
								headers: {
									Authorization: `Bearer ${auth.user?.access_token}`,
								},
							},
						);
						batchSuccess.push(row);
					} catch (error) {
						console.error(`Failed to roll back request ${row.id}`, error);
						batchError.push(row);
					}
				}),
			);
			processed += batch.length;

			setRollbackState((prev) => ({
				...prev,
				processed,
				successRows: [...prev.successRows, ...batchSuccess],
				errorRows: [...prev.errorRows, ...batchError],
			}));
		}

		setRollbackState((prev) => ({ ...prev, isRollingBack: false }));

		// Refresh the grid (and detail/totals) so the restored statuses show up.
		invalidatePatronRequestQueries(queryClient);

		if (onSuccess) onSuccess();

		if (apiRef?.current) {
			apiRef.current.setRowSelectionModel({ type: "include", ids: new Set() });
		}
	};

	const closeResult = () =>
		setRollbackState((prev) => ({ ...prev, open: false }));

	return {
		confirmOpen,
		eligibleCount: pending.eligible.length,
		skippedCount: pending.skipped.length,
		selectedCount: pending.eligible.length + pending.skipped.length,
		rollbackState,
		requestRollback,
		cancelConfirm,
		confirmAndRun,
		closeResult,
	};
};
