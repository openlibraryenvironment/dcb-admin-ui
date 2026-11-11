import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { reprocessCluster } from "@helpers/reprocessCluster";

interface ClusterReprocessDialogProps {
	clusterId: string;
	onClose: () => void;
}

const TITLE_ID = "cluster-reprocess-title";

/** Confirms a cluster reprocess, then says in place that it has started or why it has not. */
export default function ClusterReprocessDialog({
	clusterId,
	onClose,
}: ClusterReprocessDialogProps) {
	const { t } = useTranslation();
	const restClient = useDcbRestClient();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => reprocessCluster(restClient, clusterId),
		onSuccess: (outcome) => {
			if (outcome.kind !== "started") return;
			// Not ["clusterItems"]: that is a live availability fan-out to every member's LMS
			return Promise.all([
				queryClient.invalidateQueries({
					predicate: ({ queryKey }) =>
						queryKey[0] === "cluster" && queryKey[2] === clusterId,
				}),
				queryClient.invalidateQueries({
					queryKey: ["clusterAuditLog", clusterId],
				}),
			]);
		},
	});

	const outcome = mutation.data;
	// Set in the click: the request leaves before isPending reaches a render
	const running = useRef(false);
	const confirm = () => {
		if (running.current) return;
		running.current = true;
		mutation.mutate(undefined, {
			onSettled: () => {
				running.current = false;
			},
		});
	};
	const close = () => {
		if (!running.current && !mutation.isPending) onClose();
	};
	// The focused confirm button unmounts when the outcome replaces it (WCAG 2.4.3)
	const closeButton = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (outcome) closeButton.current?.focus();
	}, [outcome]);

	return (
		<Dialog open onClose={close} aria-labelledby={TITLE_ID}>
			<DialogTitle id={TITLE_ID}>
				{t("search.reprocess_cluster.title")}
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2}>
					<DialogContentText>
						{t("search.reprocess_cluster.body")}
					</DialogContentText>
					<div role="status" aria-live="polite">
						{outcome && (
							<Alert
								severity={outcome.kind === "started" ? "success" : "error"}
							>
								{t(`search.reprocess_cluster.${outcome.kind}`)}
								{outcome.kind === "failed" && outcome.reference && (
									<RequestReference reference={outcome.reference} />
								)}
							</Alert>
						)}
					</div>
				</Stack>
			</DialogContent>
			<DialogActions>
				{outcome ? (
					<Button ref={closeButton} onClick={onClose} variant="contained">
						{t("ui.actions.close")}
					</Button>
				) : (
					<>
						<Button onClick={onClose} disabled={mutation.isPending}>
							{t("ui.actions.cancel")}
						</Button>
						<Button
							onClick={confirm}
							variant="contained"
							color="error"
							disabled={mutation.isPending}
							startIcon={
								mutation.isPending ? (
									<CircularProgress size="1rem" aria-hidden />
								) : undefined
							}
						>
							{t("search.reprocess_cluster.confirm")}
						</Button>
					</>
				)}
			</DialogActions>
		</Dialog>
	);
}
