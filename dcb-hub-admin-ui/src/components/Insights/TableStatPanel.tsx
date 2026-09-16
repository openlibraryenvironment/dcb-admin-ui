import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import PanelState from "./PanelState";

import { MetricId } from "@helpers/insightsMetrics";
import MetricInfo from "./MetricInfo";
import {
	Box,
	Card,
	CardContent,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

const PANEL_MIN_HEIGHT = 280;

export interface StatColumn<T> {
	headerKey: string;
	align?: "left" | "right";
	cell: (row: T) => ReactNode;
}

interface TableStatPanelProps<T> {
	titleKey: string;
	subtitleKey: string;
	queryOptions: {
		queryKey: readonly unknown[];
		queryFn: () => Promise<T[]>;
	};
	columns: StatColumn<T>[];
	getRowKey: (row: T) => string;
	/** Set by callers whose figure has a registry entry; see insightsMetrics. */
	metric?: MetricId;
	limit?: number;
}

// Generic ranked-table panel - the right form when identity of the rows matters more
// than a magnitude comparison (titles, gaps). Reused across every "top N list" stat.
export default function TableStatPanel<T>({
	titleKey,
	subtitleKey,
	queryOptions,
	columns,
	getRowKey,
	metric,
	limit = 20,
}: TableStatPanelProps<T>) {
	const { t } = useTranslation();
	const { data, isLoading, isError, error, refetch, isFetching } =
		useQuery(queryOptions);

	const rows = (data ?? []).slice(0, limit);

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Typography variant="h6" component="h3">
						{t(titleKey)}
					</Typography>
					{metric ? <MetricInfo metric={metric} label={t(titleKey)} /> : null}
				</Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t(subtitleKey)}
				</Typography>

				<PanelState
					isLoading={isLoading}
					isError={isError}
					error={error}
					isEmpty={rows.length === 0}
					onRetry={refetch}
					isRetrying={isFetching}
					height={PANEL_MIN_HEIGHT}
				>
					{() => (
						<TableContainer sx={{ maxHeight: 420 }}>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow>
										{columns.map((col) => (
											<TableCell
												key={col.headerKey}
												align={col.align ?? "left"}
											>
												{t(col.headerKey)}
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{rows.map((row) => (
										<TableRow key={getRowKey(row)} hover>
											{columns.map((col) => (
												<TableCell
													key={col.headerKey}
													align={col.align ?? "left"}
												>
													{col.cell(row)}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
