import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	CircularProgress,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableFooter,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { trackingBacklogQuery } from "@/queryOptions/trackingBacklog";

/** Requests waiting on a tracking poll, and how many of those polls are already due. */
export default function TrackingBacklog() {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { data, isLoading, isError } = useQuery(trackingBacklogQuery(client));
	const totals = (data ?? []).reduce(
		(sum, row) => ({
			scheduled: sum.scheduled + row.scheduled,
			overdue: sum.overdue + row.overdue,
		}),
		{ scheduled: 0, overdue: 0 },
	);

	return (
		<Stack spacing={2} component="section" aria-labelledby="tracking-backlog">
			<Typography id="tracking-backlog" variant="h2">
				{t("environment.tracking_backlog.title")}
			</Typography>
			<Typography variant="body2">
				{t("environment.tracking_backlog.description")}
			</Typography>
			{isLoading ? (
				<CircularProgress aria-label={t("common.loading")} />
			) : isError ? (
				<Alert severity="error">
					{t("environment.tracking_backlog.error")}
				</Alert>
			) : (
				<TableContainer>
					<Table size="small" aria-labelledby="tracking-backlog">
						<TableHead>
							<TableRow>
								<TableCell component="th" scope="col">
									{t("environment.tracking_backlog.status")}
								</TableCell>
								<TableCell component="th" scope="col" align="right">
									{t("environment.tracking_backlog.scheduled")}
								</TableCell>
								<TableCell component="th" scope="col" align="right">
									{t("environment.tracking_backlog.overdue")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data?.map((row) => (
								<TableRow key={row.status}>
									<TableCell component="th" scope="row">
										{row.status}
									</TableCell>
									<TableCell align="right">{row.scheduled}</TableCell>
									<TableCell align="right">{row.overdue}</TableCell>
								</TableRow>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell component="th" scope="row">
									{t("environment.tracking_backlog.total")}
								</TableCell>
								<TableCell align="right">{totals.scheduled}</TableCell>
								<TableCell align="right">{totals.overdue}</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</TableContainer>
			)}
		</Stack>
	);
}
