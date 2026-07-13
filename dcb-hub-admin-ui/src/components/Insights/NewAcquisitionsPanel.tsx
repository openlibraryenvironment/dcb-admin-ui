import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	Typography,
	Skeleton,
	Box,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { newAcquisitionsQueryOptions, StatsParams } from "@helpers/statsApi";

const PANEL_MIN_HEIGHT = 280;

// How newly-acquired titles are performing in the network. Library scope (the endpoint
// needs a libraryCode) and driven by an "acquired since" date the user picks.
export default function NewAcquisitionsPanel({
	params,
	libraryCode,
}: {
	params: StatsParams;
	libraryCode: string;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const [acquiredSince, setAcquiredSince] = useState<Dayjs>(() =>
		dayjs().subtract(1, "year"),
	);

	const { data, isLoading } = useQuery(
		newAcquisitionsQueryOptions(client, {
			...params,
			libraryCode,
			acquiredSince: acquiredSince.toISOString(),
		}),
	);

	const rows = data ?? [];

	return (
		<Card variant="outlined">
			<CardContent>
				<Stack
					direction="row"
					spacing={2}
					sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
				>
					<Box>
						<Typography variant="h6" gutterBottom>
							{t("insights.charts.new_acquisitions.title")}
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							{t("insights.charts.new_acquisitions.subtitle")}
						</Typography>
					</Box>
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DatePicker
							label={t("insights.charts.new_acquisitions.acquired_since")}
							value={acquiredSince}
							onChange={(value) => value && setAcquiredSince(value)}
							slotProps={{ textField: { size: "small" } }}
							disableFuture
						/>
					</LocalizationProvider>
				</Stack>

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
										{t("insights.charts.top_titles.col_title")}
									</TableCell>
									<TableCell>
										{t("insights.charts.rare_gem.col_author")}
									</TableCell>
									<TableCell align="right">
										{t("insights.charts.new_acquisitions.col_supplied")}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={row.clusterId} hover>
										<TableCell>{row.title ?? "—"}</TableCell>
										<TableCell>{row.author ?? "—"}</TableCell>
										<TableCell align="right">{row.supplyCount}</TableCell>
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
