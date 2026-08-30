import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Typography } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import {
	clusterSizeDistributionQueryOptions,
	type ClusterSizeStat,
} from "@helpers/statsApi";
import {
	bucketedHolders,
	clusterQuality,
	isUnderClustered,
} from "@helpers/insightsCollection";
import CollectionPanel from "./CollectionPanel";

const CHART_HEIGHT = 260;

/**
 * How many libraries hold each work - and therefore how much the rest of this section can
 * be believed.
 *
 * dcb-service ships this distribution beside the counts it qualifies rather than after
 * them, for a reason worth repeating here: if nearly every work has exactly one holder,
 * the matcher has failed to cluster and "titles only we hold" is measuring the matcher,
 * not the collection. The warning below is that check made visible.
 */
export default function ClusterQualityPanel() {
	const client = useDcbRestClient();

	return (
		<CollectionPanel<ClusterSizeStat[]>
			titleKey="insights.collection.cluster_quality.title"
			subtitleKey="insights.collection.cluster_quality.subtitle"
			queryOptions={clusterSizeDistributionQueryOptions(client)}
			isEmpty={(rows) => rows.length === 0}
			minHeight={CHART_HEIGHT + 80}
		>
			{(rows) => <ClusterQualityBody rows={rows} />}
		</CollectionPanel>
	);
}

function ClusterQualityBody({ rows }: { rows: ClusterSizeStat[] }) {
	const { t } = useTranslation();
	const { categorical } = useChartPalette();

	const { buckets, quality } = useMemo(
		() => ({ buckets: bucketedHolders(rows), quality: clusterQuality(rows) }),
		[rows],
	);

	const singlePct =
		quality.singleHolderPct != null ? quality.singleHolderPct.toFixed(1) : "—";

	// The chart is one of two renderings of the same numbers; the sentence below carries
	// them in text, so the SVG needs a label rather than a full description.
	const chartLabel = t("insights.collection.cluster_quality.chart_label", {
		single: singlePct,
	});

	return (
		<>
			<Typography variant="body2" gutterBottom>
				{t("insights.collection.cluster_quality.summary", {
					single: singlePct,
					total: quality.totalClusters.toLocaleString(),
					commonest: quality.commonestHolderCount ?? "—",
				})}
			</Typography>

			{isUnderClustered(quality) && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					{t("insights.collection.cluster_quality.under_clustered", {
						single: singlePct,
					})}
				</Alert>
			)}

			<Box role="img" aria-label={chartLabel}>
				<BarChartPro
					height={CHART_HEIGHT}
					xAxis={[
						{
							scaleType: "band",
							data: buckets.map((b) => b.label),
							label: t("insights.collection.cluster_quality.axis_holders"),
						},
					]}
					series={[
						{
							data: buckets.map((b) => b.clusterCount),
							label: t("insights.collection.cluster_quality.series"),
							color: categorical[0],
						},
					]}
				/>
			</Box>
		</>
	);
}
