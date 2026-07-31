import { RefObject, useState } from "react";
import axios from "axios";
import { useAuth } from "react-oidc-context";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
	GridApiPremium,
	gridRowSelectionIdsSelector,
} from "@mui/x-data-grid-premium";
import { cleanupStatuses } from "@constants/statuses/cleanupStatuses";
import { invalidatePatronRequestQueries } from "@helpers/invalidatePatronRequestQueries";

interface UsePatronRequestCleanupProps {
	apiRef: RefObject<GridApiPremium | null>;
	onSuccess?: () => void;
}

/**
 * Bulk "force clean up" for the patron request grids. Standardised with
 * usePatronRequestRollback: same shape, same self-resolved auth/API base (a grid
 * opts in with just an apiRef), and the same patron-request cache invalidation on
 * completion so the grid reflects the new statuses without a reload.
 *
 * Cleanup runs immediately (no confirmation step) - unlike rollback, which is
 * only safe after an outage and so gates behind a warning. Eligibility is the
 * broad cleanupStatuses set; anything else in the selection is skipped.
 */
export const usePatronRequestCleanup = ({
	apiRef,
	onSuccess,
}: UsePatronRequestCleanupProps) => {
	const auth = useAuth();
	const { cfg } = useRouter().options.context as { cfg: any };
	const dcbApiBase = cfg?.VITE_DCB_API_BASE;
	const queryClient = useQueryClient();

	const [cleanupState, setCleanupState] = useState({
		open: false,
		isCleaning: false,
		total: 0,
		processed: 0,
		successRows: [] as any[],
		errorRows: [] as any[],
		skippedRows: [] as any[],
	});

	const handleCleanup = async () => {
		if (apiRef == null) {
			return;
		}
		const selectedRowIds = gridRowSelectionIdsSelector(apiRef);
		const allSelectedRows = Array.from(selectedRowIds.values());
		const validRows = allSelectedRows.filter(
			(row) => row !== null && row !== undefined,
		);

		if (validRows.length === 0) return;

		const eligibleRows: any[] = [];
		const skippedRows: any[] = [];

		validRows.forEach((row) => {
			if (cleanupStatuses.includes(row.status)) {
				eligibleRows.push(row);
			} else {
				skippedRows.push(row);
			}
		});

		setCleanupState({
			open: true,
			isCleaning: eligibleRows.length > 0,
			total: eligibleRows.length,
			processed: 0,
			successRows: [],
			errorRows: [],
			skippedRows: skippedRows,
		});

		if (eligibleRows.length === 0) return;

		let processed = 0;
		const batchSize = 5;

		for (let i = 0; i < eligibleRows.length; i += batchSize) {
			const batch = eligibleRows.slice(i, i + batchSize);
			const batchSuccess: any[] = [];
			const batchError: any[] = [];

			await Promise.all(
				batch.map(async (row) => {
					try {
						const cleanupUrl = `${dcbApiBase}/patrons/requests/${row.id}/transition/cleanup`;
						await axios.post(
							cleanupUrl,
							{},
							{
								headers: {
									Authorization: `Bearer ${auth.user?.access_token}`,
								},
							},
						);
						batchSuccess.push(row);
					} catch (error) {
						console.error(`Failed to clean up request ${row.id}`, error);
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

	const handleCloseCleanup = () => {
		setCleanupState((prev) => ({ ...prev, open: false }));
	};

	return {
		cleanupState,
		handleCleanup,
		handleCloseCleanup,
	};
};
