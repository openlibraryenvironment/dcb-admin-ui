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
	collectionOverlapQueryOptions,
	type CollectionOverlapStat,
} from "@helpers/statsApi";
import CollectionPanel from "./CollectionPanel";

const ROW_LIMIT = 25;

/**
 * Who duplicates this library, and by how much.
 *
 * One library against all others, never the full matrix - at 500 members that is 124,750
 * pairs, and dcb-service does not offer it. So this panel needs a "us" and renders only in
 * a single-library scope; with several libraries selected there is no one row to be the
 * left-hand side of the comparison.
 */
export default function CollectionOverlapPanel({
	libraryCode,
}: {
	libraryCode: string;
}) {
	const client = useDcbRestClient();

	return (
		<CollectionPanel<CollectionOverlapStat[]>
			titleKey="insights.collection.overlap.title"
			subtitleKey="insights.collection.overlap.subtitle"
			queryOptions={collectionOverlapQueryOptions(client, { libraryCode })}
			isEmpty={(rows) => rows.length === 0}
		>
			{(rows) => <OverlapTable rows={rows} libraryCode={libraryCode} />}
		</CollectionPanel>
	);
}

function OverlapTable({
	rows,
	libraryCode,
}: {
	rows: CollectionOverlapStat[];
	libraryCode: string;
}) {
	const { t } = useTranslation();

	// The pair is emitted once, unordered, so the partner is whichever side is not us.
	const partners = useMemo(
		() =>
			[...rows]
				.sort((a, b) => b.sharedTitleCount - a.sharedTitleCount)
				.slice(0, ROW_LIMIT)
				.map((row) => ({
					key: `${row.leftSystemId}-${row.rightSystemId}`,
					code:
						row.leftSystemCode === libraryCode
							? row.rightSystemCode
							: row.leftSystemCode,
					sharedTitleCount: row.sharedTitleCount,
				})),
		[rows, libraryCode],
	);

	return (
		<TableContainer sx={{ maxHeight: 420 }}>
			<Table size="small" stickyHeader>
				<caption style={{ captionSide: "bottom" }}>
					<Typography variant="caption" color="text.secondary">
						{t("insights.collection.overlap.caption", {
							shown: partners.length,
							total: rows.length,
						})}
					</Typography>
				</caption>
				<TableHead>
					<TableRow>
						<TableCell>
							{t("insights.collection.overlap.col_library")}
						</TableCell>
						<TableCell align="right">
							{t("insights.collection.overlap.col_shared")}
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{partners.map((partner) => (
						<TableRow key={partner.key} hover>
							<TableCell>{partner.code}</TableCell>
							<TableCell align="right">
								{partner.sharedTitleCount.toLocaleString()}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
