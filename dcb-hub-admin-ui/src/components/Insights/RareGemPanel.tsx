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
import {
	uniqueContributionsQueryOptions,
	StatsParams,
} from "@helpers/statsApi";

const PANEL_MIN_HEIGHT = 280;

// A ranked list of unique collection contributions - deliberately a table, not a
// chart: the value is the identity of the titles, not a magnitude comparison.
export default function RareGemPanel({
	params,
}: {
	params: StatsParams & { libraryCode: string };
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const { data, isLoading } = useQuery(
		uniqueContributionsQueryOptions(client, params),
	);

	const rows = data ?? [];

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{t("insights.charts.rare_gem.title")}
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.charts.rare_gem.subtitle")}
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
									<TableCell>
										{t("insights.charts.rare_gem.col_title")}
									</TableCell>
									<TableCell>
										{t("insights.charts.rare_gem.col_author")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.rare_gem.col_requests")}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.map((gem) => (
									<TableRow key={gem.clusterId} hover>
										<TableCell>{gem.title ?? "—"}</TableCell>
										<TableCell>{gem.author ?? "—"}</TableCell>
										<TableCell align="right">{gem.supplyCount}</TableCell>
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
