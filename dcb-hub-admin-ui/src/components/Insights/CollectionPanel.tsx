import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, type QueryFunction } from "@tanstack/react-query";
import { Card, CardContent, Typography } from "@mui/material";

import type { collectionAnalysisPolicy } from "@helpers/statsApi";
import PanelState from "./PanelState";

/**
 * Shell for the five collection-analysis panels: the card, and a query that retries only
 * while the count is still running. The options type takes that policy whole, so a panel
 * cannot be given a query that retries a real failure.
 */

interface CollectionPanelProps<T> {
	titleKey: string;
	subtitleKey: string;
	queryOptions: typeof collectionAnalysisPolicy & {
		queryKey: readonly unknown[];
		// TanStack's own type, not `() => Promise<T>`. The hand-written signature took
		// no arguments, so a queryFn that reads the context - which is where the
		// AbortSignal comes from - did not satisfy it.
		queryFn: QueryFunction<T, readonly unknown[]>;
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
	const { data, isLoading, isError, error, refetch, isFetching, failureCount } =
		useQuery(queryOptions);

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" component="h3" gutterBottom>
					{t(titleKey)}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t(subtitleKey)}
				</Typography>
				<PanelState
					isLoading={isLoading}
					isComputing={failureCount > 0}
					isError={isError}
					error={error}
					isEmpty={data === undefined || isEmpty(data)}
					onRetry={refetch}
					isRetrying={isFetching}
					height={minHeight}
					failedKey="insights.collection.failed"
				>
					{() => children(data as T)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
