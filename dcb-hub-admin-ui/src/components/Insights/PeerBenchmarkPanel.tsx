import { useMemo } from "react";
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

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { peerBenchmarksQueryOptions } from "@helpers/statsApi";

const PANEL_MIN_HEIGHT = 300;

function median(values: number[]): number | null {
	const s = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
	if (s.length === 0) return null;
	const mid = Math.floor(s.length / 2);
	return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Ranks every library's borrower-side performance and marks the current library, with
// the consortium median as the benchmark line. The competitive gap vs LibraryIQ.
export default function PeerBenchmarkPanel({
	params,
	libraryCode,
}: {
	params: { startDate?: string; endDate?: string };
	libraryCode?: string;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const { data, isLoading } = useQuery(
		peerBenchmarksQueryOptions(client, params),
	);

	const { rows, medianFill, medianCheckout } = useMemo(() => {
		const mapped = (data ?? []).map((r) => {
			const resolved = r.successCount + r.failedCount;
			return {
				libraryCode: r.libraryCode,
				totalRequests: r.totalRequests,
				fillRate: resolved > 0 ? (r.successCount / resolved) * 100 : null,
				checkoutRate:
					r.totalRequests > 0
						? (r.checkoutCount / r.totalRequests) * 100
						: null,
			};
		});
		const mFill = median(
			mapped.map((r) => r.fillRate).filter((v): v is number => v != null),
		);
		const mCheckout = median(
			mapped.map((r) => r.checkoutRate).filter((v): v is number => v != null),
		);
		mapped.sort((a, b) => (b.fillRate ?? -1) - (a.fillRate ?? -1));
		return { rows: mapped, medianFill: mFill, medianCheckout: mCheckout };
	}, [data]);

	const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{t("insights.charts.peer_benchmark.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.peer_benchmark.subtitle", {
						fill: pct(medianFill),
						checkout: pct(medianCheckout),
					})}
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
					<TableContainer sx={{ maxHeight: 440 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell>
										{t("insights.charts.peer_benchmark.col_library")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.peer_benchmark.col_requests")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.peer_benchmark.col_checkout")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.peer_benchmark.col_fill")}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.map((row) => {
									const isCurrent = row.libraryCode === libraryCode;
									const aboveMedian =
										medianFill != null &&
										row.fillRate != null &&
										row.fillRate >= medianFill;
									return (
										<TableRow
											key={row.libraryCode}
											hover
											selected={isCurrent}
											sx={isCurrent ? { fontWeight: "bold" } : undefined}
										>
											<TableCell
												sx={isCurrent ? { fontWeight: 700 } : undefined}
											>
												{row.libraryCode}
											</TableCell>
											<TableCell align="right">
												{row.totalRequests.toLocaleString()}
											</TableCell>
											<TableCell align="right">
												{pct(row.checkoutRate)}
											</TableCell>
											<TableCell
												align="right"
												sx={{
													color:
														row.fillRate == null
															? "text.secondary"
															: aboveMedian
																? "success.main"
																: "error.main",
												}}
											>
												{pct(row.fillRate)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</CardContent>
		</Card>
	);
}
