import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	StatsParams,
	supplierResponseSlaQueryOptions,
	timeInStatusQueryOptions,
	TurnaroundStat,
} from "@helpers/statsApi";
import { formatDuration } from "@helpers/insightsRange";
import { durationRows, longestDuration } from "@helpers/insightsDurations";

import PanelState from "./PanelState";
import MetricInfo from "./MetricInfo";

const PANEL_HEIGHT = 300;

/**
 * How long each leg of a request takes, named.
 *
 * Five durations were already measured and two were named. The two transit legs fell out
 * of the time-in-status query as raw status codes in a list of eighteen, so the question
 * "is the courier slipping" had an answer on the page that nobody could find. Semantics:
 * INSIGHTS_IA_AND_UX_PLAN.md section 4.
 */
export default function DurationsPanel({
	params,
	toLoaned,
	toFinalised,
	loading = false,
}: {
	params: StatsParams;
	toLoaned?: TurnaroundStat;
	toFinalised?: TurnaroundStat;
	loading?: boolean;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const dwell = useQuery(timeInStatusQueryOptions(client, params));
	const response = useQuery(supplierResponseSlaQueryOptions(client, params));

	const scopedCodes = params.libraryCode
		? params.libraryCode.split(",").filter(Boolean).length
		: 0;

	const rows = useMemo(
		() =>
			durationRows({
				toLoaned,
				toFinalised,
				supplierResponse: response.data,
				dwell: dwell.data,
				scopedCodes,
			}),
		[toLoaned, toFinalised, response.data, dwell.data, scopedCodes],
	);

	const longest = longestDuration(rows);

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" component="h3" gutterBottom>
					{t("insights.durations.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.durations.subtitle")}
				</Typography>

				<PanelState
					isLoading={loading || dwell.isLoading || response.isLoading}
					isError={dwell.isError || response.isError}
					error={dwell.error ?? response.error}
					isEmpty={longest === 0}
					onRetry={() => {
						void dwell.refetch();
						void response.refetch();
					}}
					isRetrying={dwell.isFetching || response.isFetching}
					height={PANEL_HEIGHT}
				>
					{() => (
						<Box component="dl" sx={{ display: "grid", gap: 1.5, m: 0, mt: 1 }}>
							{rows.map((row) => (
								<Box
									key={row.key}
									sx={{
										display: "grid",
										gridTemplateColumns: {
											xs: "1fr",
											sm: "minmax(0, 200px) 1fr",
										},
										gap: { xs: 0.5, sm: 2 },
										alignItems: "center",
									}}
								>
									<Box component="dt" sx={{ minWidth: 0 }}>
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
										>
											<Typography variant="body2">{t(row.key)}</Typography>
											<MetricInfo
												metric={row.metric}
												label={t(row.key)}
												sampleCount={row.sampleCount}
											/>
										</Box>
										<Typography variant="caption" color="text.secondary">
											{row.detail}
										</Typography>
									</Box>

									<Box component="dd" sx={{ m: 0, minWidth: 0 }}>
										{row.absent ? (
											// Not a zero-length bar. A system that never reports the
											// status produces no observation, and drawing that as an
											// instant leg is the most flattering possible lie.
											<Typography variant="body2" color="warning.main">
												{t("insights.durations.not_reported")}
											</Typography>
										) : (
											<>
												<Box
													aria-hidden
													sx={{
														position: "relative",
														height: 10,
														borderRadius: 1,
														bgcolor: "action.hover",
														mb: 0.5,
													}}
												>
													<Box
														sx={{
															position: "absolute",
															inset: 0,
															width: `${Math.max(2, ((row.p95Seconds ?? row.p50Seconds ?? 0) / longest) * 100)}%`,
															borderRadius: 1,
															bgcolor: "action.selected",
														}}
													/>
													<Box
														sx={{
															position: "absolute",
															inset: 0,
															width: `${Math.max(2, ((row.p50Seconds ?? 0) / longest) * 100)}%`,
															borderRadius: 1,
															bgcolor: "primary.main",
														}}
													/>
												</Box>
												<Typography variant="caption" color="text.secondary">
													{row.p95Seconds != null
														? t("insights.durations.pair", {
																p50: formatDuration(row.p50Seconds),
																p95: formatDuration(row.p95Seconds),
															})
														: t("insights.durations.median", {
																value: formatDuration(row.p50Seconds),
															})}
													{row.sampleCount != null
														? ` ${t("insights.durations.sample", {
																count: row.sampleCount,
															})}`
														: ""}
												</Typography>
											</>
										)}
									</Box>
								</Box>
							))}
						</Box>
					)}
				</PanelState>
			</CardContent>
		</Card>
	);
}
