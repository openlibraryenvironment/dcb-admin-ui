import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Skeleton,
	Typography,
} from "@mui/material";

import { isBusy } from "@helpers/insightsCollection";

/**
 * Shell for the five collection-analysis panels.
 *
 * They share a failure mode nothing else on this dashboard has: a 429 that means "the one
 * permit is busy, ask again shortly" rather than "something broke" - see isBusy. So the
 * refusal gets its own message and a MANUAL retry, and the query carries retry: false.
 */

interface CollectionPanelProps<T> {
	titleKey: string;
	subtitleKey: string;
	queryOptions: {
		queryKey: readonly unknown[];
		queryFn: () => Promise<T>;
		staleTime: number;
		retry: false;
	};
	isEmpty: (data: T) => boolean;
	children: (data: T) => ReactNode;
	minHeight?: number;
}

export default function CollectionPanel<T>({
	titleKey,
	subtitleKey,
	queryOptions,
	isEmpty,
	children,
	minHeight = 320,
}: CollectionPanelProps<T>) {
	const { t } = useTranslation();
	const { data, isLoading, isError, error, refetch, isFetching } =
		useQuery(queryOptions);

	// Fixed height on every state, so the skeleton and the refusal occupy exactly what the
	// loaded panel will - the one metric a reviewer cannot see in a diff is CLS.
	const frame = (content: ReactNode) => (
		<Box
			sx={{
				minHeight,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{content}
		</Box>
	);

	let body: ReactNode;

	if (isLoading) {
		body = <Skeleton variant="rounded" height={minHeight} />;
	} else if (isError) {
		body = frame(
			<Alert
				severity={isBusy(error) ? "info" : "warning"}
				action={
					<Button
						color="inherit"
						size="small"
						onClick={() => refetch()}
						disabled={isFetching}
					>
						{t("insights.collection.retry")}
					</Button>
				}
			>
				{t(
					isBusy(error)
						? "insights.collection.busy"
						: "insights.collection.failed",
				)}
			</Alert>,
		);
	} else if (data === undefined || isEmpty(data)) {
		body = frame(
			<Typography color="text.secondary">{t("insights.no_data")}</Typography>,
		);
	} else {
		body = children(data);
	}

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" component="h3" gutterBottom>
					{t(titleKey)}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t(subtitleKey)}
				</Typography>
				{body}
			</CardContent>
		</Card>
	);
}
