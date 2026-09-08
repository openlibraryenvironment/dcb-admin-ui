import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { BarChartPro } from "@mui/x-charts-pro";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import {
	formatProfileQueryOptions,
	type SourceFormatStat,
} from "@helpers/statsApi";
import { formatMix } from "@helpers/insightsCollection";
import CollectionPanel from "./CollectionPanel";

const CHART_HEIGHT = 300;
const FORMAT_LIMIT = 12;

/**
 * The format mix of the catalogue itself - counted per WORK, so it reconciles against the
 * collection profile beside it rather than counting a source that catalogued one work four
 * times as four.
 *
 * Not the same question as "demand by format", which is next to it on this page and counts
 * requests: a consortium can hold mostly print and be asked mostly for audio, and the gap
 * between those two panels is the interesting part.
 */
export default function FormatMixPanel({
	libraryCode,
}: {
	// A single Host LMS code narrows to one library's mix. A CSV of several is treated as
	// consortium-wide: summing a subset would read as "the consortium" while not being it.
	libraryCode?: string;
}) {
	const client = useDcbRestClient();

	const single =
		libraryCode && !libraryCode.includes(",") ? libraryCode : undefined;

	return (
		<CollectionPanel<SourceFormatStat[]>
			titleKey="insights.collection.format_mix.title"
			subtitleKey={
				single
					? "insights.collection.format_mix.subtitle_library"
					: "insights.collection.format_mix.subtitle"
			}
			queryOptions={formatProfileQueryOptions(client)}
			isEmpty={(rows) => rows.length === 0}
			minHeight={CHART_HEIGHT}
		>
			{(rows) => <FormatMixChart rows={rows} sourceCode={single} />}
		</CollectionPanel>
	);
}

function FormatMixChart({
	rows,
	sourceCode,
}: {
	rows: SourceFormatStat[];
	sourceCode?: string;
}) {
	const { t } = useTranslation();
	const { categorical } = useChartPalette();

	const slices = useMemo(
		() => formatMix(rows, sourceCode).slice(0, FORMAT_LIMIT),
		[rows, sourceCode],
	);

	const labelFor = (derivedType: string | null) =>
		derivedType ?? t("insights.collection.format_mix.unknown");

	const chartLabel = t("insights.collection.format_mix.chart_label", {
		count: slices.length,
		top: slices.length > 0 ? labelFor(slices[0].derivedType) : "—",
	});

	return (
		<Box role="img" aria-label={chartLabel}>
			<BarChartPro
				height={CHART_HEIGHT}
				layout="horizontal"
				yAxis={[
					{
						scaleType: "band",
						data: slices.map((s) => labelFor(s.derivedType)),
					},
				]}
				series={[
					{
						data: slices.map((s) => s.titleCount),
						label: t("insights.collection.format_mix.series"),
						color: categorical[0],
					},
				]}
				margin={{ left: 160 }}
			/>
		</Box>
	);
}
