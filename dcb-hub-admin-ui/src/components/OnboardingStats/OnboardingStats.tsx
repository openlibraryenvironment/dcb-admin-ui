import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Stack, Typography } from "@mui/material";

import { getILS } from "@helpers/getILS";

/**
 * The headline counts for a consortium: how many libraries, and on which ILS.
 *
 * The grid answers "which library needs attention". It does not answer "what am
 * I actually running" - and during initial setup, when someone is working
 * through a list of thirty libraries, "four of the six Sierra sites are in"
 * is the number they are keeping in their head. Counting rows by eye across a
 * paginated grid is how that goes wrong.
 *
 * Deliberately not a chart. Seven integers with no trend and no part-to-whole
 * question do not need one; a chart here would be decoration that takes longer
 * to read than the number it encodes.
 */

interface OnboardingStatsProps {
	/** Rows as prepared by the onboarding page - library plus its `setup` state. */
	libraries: any[];
	loading?: boolean;
}

/** Stable order, so the tiles do not reshuffle as libraries are added. */
const ILS_ORDER = [
	"Alma",
	"FOLIO",
	"Koha",
	"Polaris",
	"Sierra",
	"Foundation",
	"OpenRS appliance",
	"UNKNOWN",
];

const StatTile = ({
	value,
	label,
	caption,
}: {
	value: number | string;
	label: string;
	caption?: string;
}) => (
	<Paper
		variant="outlined"
		sx={{ p: 2, minWidth: 140, flex: "1 1 140px" }}
		// The number is the content; the label names it. Both wear text tokens
		// rather than a status colour, so nothing here encodes by colour alone.
	>
		<Stack spacing={0.25}>
			<Typography variant="h4" component="p" sx={{ lineHeight: 1.1 }}>
				{value}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600 }}>
				{label}
			</Typography>
			{caption && (
				<Typography variant="caption" color="text.secondary">
					{caption}
				</Typography>
			)}
		</Stack>
	</Paper>
);

export default function OnboardingStats({
	libraries,
	loading = false,
}: OnboardingStatsProps) {
	const { t } = useTranslation();

	const stats = useMemo(() => {
		const byIls = new Map<string, number>();
		let complete = 0;

		for (const library of libraries) {
			const ils = getILS(library?.agency?.hostLms?.lmsClientClass ?? "");
			byIls.set(ils, (byIls.get(ils) ?? 0) + 1);
			if (library?.setup?.isComplete) complete += 1;
		}

		return {
			total: libraries.length,
			complete,
			outstanding: libraries.length - complete,
			// Only ILSs that are actually present: a permanent "Koha: 0" tile is
			// noise on a consortium that has never had one.
			ils: ILS_ORDER.filter((name) => byIls.has(name)).map((name) => ({
				name,
				count: byIls.get(name) ?? 0,
			})),
		};
	}, [libraries]);

	// An empty row is more honest than tiles full of zeroes that are about to
	// change; the grid's own loading state already says work is in progress.
	if (loading || stats.total === 0) return null;

	return (
		<Box component="section" aria-labelledby="onboarding-stats-heading">
			<Typography
				id="onboarding-stats-heading"
				variant="h3"
				component="h2"
				sx={{ mb: 1 }}
			>
				{t("consortium.onboarding_stats")}
			</Typography>
			<Stack
				direction="row"
				spacing={2}
				sx={{ flexWrap: "wrap", rowGap: 2, mb: 3 }}
			>
				<StatTile
					value={stats.total}
					label={t("consortium.onboarding_stats_libraries")}
				/>
				<StatTile
					value={stats.complete}
					label={t("consortium.onboarding_stats_complete")}
					caption={t("consortium.onboarding_stats_outstanding", {
						count: stats.outstanding,
					})}
				/>
				{stats.ils.map((entry) => (
					<StatTile
						key={entry.name}
						value={entry.count}
						label={
							entry.name === "UNKNOWN"
								? t("consortium.onboarding_stats_unknown_ils")
								: entry.name
						}
						caption={t("consortium.onboarding_stats_ils_caption")}
					/>
				))}
			</Stack>
		</Box>
	);
}
