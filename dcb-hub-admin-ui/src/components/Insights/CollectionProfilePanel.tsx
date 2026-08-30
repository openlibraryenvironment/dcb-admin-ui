import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	collectionProfileQueryOptions,
	type CollectionProfileStat,
} from "@helpers/statsApi";
import { rankedProfile, uniqueSharePct } from "@helpers/insightsCollection";
import CollectionPanel from "./CollectionPanel";

// A consortium is hundreds of members; a panel shows a head, and rankedProfile keeps the
// libraries in scope in it whatever their rank.
const ROW_LIMIT = 25;

/**
 * What each library brings to the shared catalogue: works contributed, and how many of
 * those nobody else holds. Derived from ingested bibs, so it describes the collection as
 * catalogued rather than as used - the demand panels answer the other half.
 */
export default function CollectionProfilePanel({
	libraryCode,
}: {
	// The scope CSV. Present rows are pulled to the front rather than ranked away.
	libraryCode?: string;
}) {
	const client = useDcbRestClient();

	return (
		<CollectionPanel<CollectionProfileStat[]>
			titleKey="insights.collection.profile.title"
			subtitleKey="insights.collection.profile.subtitle"
			queryOptions={collectionProfileQueryOptions(client)}
			isEmpty={(rows) => rows.length === 0}
		>
			{(rows) => <ProfileTable rows={rows} libraryCode={libraryCode} />}
		</CollectionPanel>
	);
}

function ProfileTable({
	rows,
	libraryCode,
}: {
	rows: CollectionProfileStat[];
	libraryCode?: string;
}) {
	const { t } = useTranslation();

	const inScope = useMemo(
		() =>
			new Set(
				(libraryCode ?? "")
					.split(",")
					.map((c) => c.trim())
					.filter(Boolean),
			),
		[libraryCode],
	);

	const shown = useMemo(
		() => rankedProfile(rows, libraryCode, ROW_LIMIT),
		[rows, libraryCode],
	);

	return (
		<TableContainer sx={{ maxHeight: 420 }}>
			<Table size="small" stickyHeader>
				<caption style={{ captionSide: "bottom" }}>
					<Typography variant="caption" color="text.secondary">
						{t("insights.collection.profile.caption", {
							shown: shown.length,
							total: rows.length,
						})}
					</Typography>
				</caption>
				<TableHead>
					<TableRow>
						<TableCell>
							{t("insights.collection.profile.col_library")}
						</TableCell>
						<TableCell align="right">
							{t("insights.collection.profile.col_works")}
						</TableCell>
						<TableCell align="right">
							{t("insights.collection.profile.col_unique")}
						</TableCell>
						<TableCell align="right">
							{t("insights.collection.profile.col_unique_share")}
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{shown.map((row) => {
						const isCurrent = inScope.has(row.sourceSystemCode);
						const share = uniqueSharePct(row);

						return (
							<TableRow key={row.sourceSystemId} hover selected={isCurrent}>
								<TableCell sx={isCurrent ? { fontWeight: 700 } : undefined}>
									{row.sourceSystemCode}
									{isCurrent ? (
										<Typography
											variant="caption"
											component="span"
											sx={{ ml: 1 }}
										>
											{t("insights.charts.peer_benchmark.your_library")}
										</Typography>
									) : null}
								</TableCell>
								<TableCell align="right">
									{row.clusterCount.toLocaleString()}
								</TableCell>
								<TableCell align="right">
									{row.uniqueTitleCount.toLocaleString()}
								</TableCell>
								<TableCell align="right">
									{share == null ? "—" : `${share.toFixed(1)}%`}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
