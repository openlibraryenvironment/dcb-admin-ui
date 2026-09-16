import { RefObject, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
	GridApiPremium,
	gridRowSelectionIdsSelector,
} from "@mui/x-data-grid-premium";
import {
	cleanupPatronRequest,
	isCleanupEligible,
} from "@helpers/cleanupPatronRequest";
import { isGuardedCleanupEnabled } from "@helpers/featureFlags";
import { invalidatePatronRequestQueries } from "@helpers/invalidatePatronRequestQueries";

interface UsePatronRequestCleanupProps {
	apiRef: RefObject<GridApiPremium | null>;
	onSuccess?: () => void;
}

interface CleanupState {
	open: boolean;
	isCleaning: boolean;
	total: number;
	processed: number;
	successRows: any[];
	errorRows: any[];
	skippedRows: any[];
	refusedRows: any[];
}

const INITIAL_STATE: CleanupState = {
	open: false,
	isCleaning: false,
	total: 0,
	processed: 0,
	successRows: [],
	errorRows: [],
	skippedRows: [],
	refusedRows: [],
};

/**
 * Bulk clean up for the patron request grids. Standardised with usePatronRequestRollback:
 * same shape, same self-resolved auth and API base, same patron-request cache invalidation.
 *
 * Where dcb-service guards cleanup (9.0.0 and later) every request is checked for updates
 * first and the server decides; whatever it refuses is collected so it can be overridden in
 * one further step, behind a confirmation. Against an older service the status list in
 * isCleanupEligible is the only gate and there is nothing to override.
 */
export const usePatronRequestCleanup = ({
	apiRef,
	onSuccess,
}: UsePatronRequestCleanupProps) => {
	const auth = useAuth();
	const { cfg } = useRouter().options.context as { cfg: any };
	const dcbApiBase = cfg?.VITE_DCB_API_BASE;
	const queryClient = useQueryClient();
	const guarded = isGuardedCleanupEnabled();

	const [cleanupState, setCleanupState] = useState<CleanupState>(INITIAL_STATE);
	const [overrideConfirmOpen, setOverrideConfirmOpen] = useState(false);

	const runCleanup = async (
		rows: any[],
		override: boolean,
		skippedRows: any[],
		alreadyCleaned: any[] = [],
	) => {
		setCleanupState({
			open: true,
			isCleaning: rows.length > 0,
			total: rows.length,
			processed: 0,
			successRows: alreadyCleaned,
			errorRows: [],
			skippedRows,
			refusedRows: [],
		});

		if (rows.length === 0) return;

		let processed = 0;
		const batchSize = 5;

		for (let i = 0; i < rows.length; i += batchSize) {
			const batch = rows.slice(i, i + batchSize);
			const batchSuccess: any[] = [];
			const batchError: any[] = [];
			const batchRefused: any[] = [];

			await Promise.all(
				batch.map(async (row) => {
					const outcome = await cleanupPatronRequest(
						dcbApiBase,
						auth.user?.access_token,
						row,
						{ override, refreshFirst: guarded },
					);

					if (outcome.kind === "cleaned") {
						batchSuccess.push(row);
					} else if (outcome.kind === "refused") {
						batchRefused.push(row);
					} else {
						console.error(`Failed to clean up request ${row.id}`, outcome.kind);
						batchError.push(row);
					}
				}),
			);
			processed += batch.length;

			setCleanupState((prev) => ({
				...prev,
				processed,
				successRows: [...prev.successRows, ...batchSuccess],
				errorRows: [...prev.errorRows, ...batchError],
				refusedRows: [...prev.refusedRows, ...batchRefused],
			}));
		}

		setCleanupState((prev) => ({ ...prev, isCleaning: false }));

		// Refresh the grid (and detail/totals) so the finalised statuses show up.
		invalidatePatronRequestQueries(queryClient);

		if (onSuccess) onSuccess();

		if (apiRef?.current) {
			apiRef.current.setRowSelectionModel({ type: "include", ids: new Set() });
		}
	};

	const handleCleanup = async () => {
		if (apiRef == null) {
			return;
		}

		const selectedRows = Array.from(
			gridRowSelectionIdsSelector(apiRef).values(),
		).filter((row) => row !== null && row !== undefined);

		if (selectedRows.length === 0) return;

		const eligible: any[] = [];
		const skipped: any[] = [];

		selectedRows.forEach((row) => {
			if (isCleanupEligible(row, guarded)) {
				eligible.push(row);
			} else {
				skipped.push(row);
			}
		});

		await runCleanup(eligible, false, skipped);
	};

	const requestOverride = () => setOverrideConfirmOpen(true);

	const cancelOverride = () => setOverrideConfirmOpen(false);

	const confirmOverride = async () => {
		setOverrideConfirmOpen(false);

		// The successes of the first pass are carried through, so the dialog still reports
		// everything the run cleaned up rather than only the overridden rows.
		await runCleanup(
			cleanupState.refusedRows,
			true,
			cleanupState.skippedRows,
			cleanupState.successRows,
		);
	};

	const handleCloseCleanup = () =>
		setCleanupState((prev) => ({ ...prev, open: false }));

	return {
		cleanupState,
		handleCleanup,
		handleCloseCleanup,
		overrideAvailable: guarded && cleanupState.refusedRows.length > 0,
		refusedCount: cleanupState.refusedRows.length,
		overrideConfirmOpen,
		requestOverride,
		cancelOverride,
		confirmOverride,
	};
};
