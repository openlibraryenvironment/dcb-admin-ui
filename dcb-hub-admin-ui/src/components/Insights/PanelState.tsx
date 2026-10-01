import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";

import { isStillComputing } from "@helpers/statsApi";

interface PanelStateProps {
	isLoading: boolean;
	/** A retry is pending because the count is still running; see isStillComputing. */
	isComputing?: boolean;
	isError: boolean;
	error?: unknown;
	isEmpty: boolean;
	onRetry: () => void;
	isRetrying?: boolean;
	/** Every state occupies this height, so a panel never resizes as it settles. */
	height: number;
	/** What would put data here, when the generic line is not the useful answer. */
	emptyKey?: string;
	/** Names what failed, where "this panel" is vaguer than the reader deserves. */
	failedKey?: string;
	children: () => ReactNode;
}

/**
 * The four states every Insights panel has, in one place.
 *
 * A panel that branched on the loading flag and then on the data rendered "no data" for a
 * 500, so a broken endpoint and a quiet month looked identical - which is how
 * /insights/dashboard-metrics returned 500 on every consortium-wide call for a week while
 * the trading partners panel reported no activity.
 *
 * `children` is a function: the data branch is the only one that evaluates it, and several
 * panels index into data that is absent in the other three.
 */
export default function PanelState({
	isLoading,
	isComputing = false,
	isError,
	error,
	isEmpty,
	onRetry,
	isRetrying = false,
	height,
	emptyKey = "insights.no_data",
	failedKey = "insights.panel.failed",
	children,
}: PanelStateProps) {
	const { t } = useTranslation();

	const centred = (content: ReactNode) => (
		<Box
			sx={{
				minHeight: height,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{content}
		</Box>
	);

	if (isLoading && isComputing) {
		return centred(
			<Alert severity="info">{t("insights.collection.computing")}</Alert>,
		);
	}

	if (isLoading) {
		return <Skeleton variant="rounded" height={height} />;
	}

	if (isError) {
		const busy = isStillComputing(error);

		return centred(
			<Alert
				severity={busy ? "info" : "warning"}
				action={
					<Button
						color="inherit"
						size="small"
						onClick={onRetry}
						disabled={isRetrying}
					>
						{t("insights.panel.retry")}
					</Button>
				}
			>
				{t(busy ? "insights.collection.busy" : failedKey)}
			</Alert>,
		);
	}

	if (isEmpty) {
		return centred(
			<Typography color="text.secondary">{t(emptyKey)}</Typography>,
		);
	}

	return <>{children()}</>;
}
