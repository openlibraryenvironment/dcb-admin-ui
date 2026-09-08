import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box } from "@mui/material";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { collectionTotalsQueryOptions } from "@helpers/statsApi";
import { isBusy } from "@helpers/insightsCollection";
import KpiTile from "./KpiTile";

/**
 * The consortium's catalogue in four numbers.
 *
 * Deliberately a KPI row rather than a card, so it reads as the header of the collection
 * section the way the fill-rate row heads the page. No date window: these count what is
 * catalogued, not what has been requested, so the range picker does not apply.
 */
export default function CollectionTotalsTiles() {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const { data, isLoading, isError, error } = useQuery(
		collectionTotalsQueryOptions(client),
	);

	if (isError) {
		return (
			<Alert severity={isBusy(error) ? "info" : "warning"}>
				{t(
					isBusy(error)
						? "insights.collection.busy"
						: "insights.collection.failed",
				)}
			</Alert>
		);
	}

	const n = (value: number | undefined) => (value ?? 0).toLocaleString();

	return (
		<Box
			sx={{
				display: "grid",
				gap: 2,
				gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
			}}
		>
			<KpiTile
				title={t("insights.collection.totals.distinct_titles")}
				value={n(data?.distinctTitles)}
				subtitle={t("insights.collection.totals.distinct_titles_sub")}
				loading={isLoading}
			/>
			<KpiTile
				title={t("insights.collection.totals.singly_held")}
				value={n(data?.singlyHeldTitles)}
				subtitle={t("insights.collection.totals.singly_held_sub")}
				loading={isLoading}
			/>
			<KpiTile
				title={t("insights.collection.totals.holdings")}
				value={n(data?.holdings)}
				subtitle={t("insights.collection.totals.holdings_sub")}
				loading={isLoading}
			/>
			<KpiTile
				title={t("insights.collection.totals.sources")}
				value={n(data?.contributingSources)}
				subtitle={t("insights.collection.totals.sources_sub")}
				loading={isLoading}
			/>
		</Box>
	);
}
