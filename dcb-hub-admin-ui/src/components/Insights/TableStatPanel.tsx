import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	Typography,
	Skeleton,
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
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
	limit = 20,
}: TableStatPanelProps<T>) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery(queryOptions);

	const rows = (data ?? []).slice(0, limit);

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{t(titleKey)}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t(subtitleKey)}
				</Typography>

				{isLoading ? (
					<Skeleton variant="rounded" height={PANEL_MIN_HEIGHT} />
				) : rows.length === 0 ? (
					<Box
						sx={{
							minHeight: PANEL_MIN_HEIGHT,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Typography color="text.secondary">
							{t("insights.no_data")}
						</Typography>
					</Box>
				) : (
					<TableContainer sx={{ maxHeight: 420 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									{columns.map((col) => (
										<TableCell key={col.headerKey} align={col.align ?? "left"}>
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
			</CardContent>
		</Card>
	);
}
