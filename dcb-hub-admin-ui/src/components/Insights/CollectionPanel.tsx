import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Typography } from "@mui/material";

import PanelState from "./PanelState";

/**
 * Shell for the five collection-analysis panels: the card, and a query that must not retry.
 *
 * `retry: false` in the options type is the load-bearing part. These aggregates answer 429
 * when the one permit is busy, and an automatic retry spends the next caller's budget.
 * PanelState reads that 429 and offers a manual retry instead.
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
