import { useTranslation } from "react-i18next";
import {
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import { useLocaleStore } from "@hooks/useLocaleStore";
import { deploymentLocale, resolveFormatLocale } from "@helpers/locale";
import { scheduledWorkFrom } from "@helpers/scheduledWork";

/** What dcb-service's /info says about its scheduled work and the instances running it. */
export default function ScheduledWork({
	serviceInfo,
}: {
	serviceInfo: unknown;
}) {
	const { t } = useTranslation();
	const choice = useLocaleStore((s) => s.choice);
	const work = scheduledWorkFrom(serviceInfo);

	if (!work) return null;

	const dateTime = new Intl.DateTimeFormat(
		resolveFormatLocale(choice, deploymentLocale()),
		{ dateStyle: "medium", timeStyle: "medium" },
	);
	const yesNo = (value: boolean | null) =>
		value == null
			? t("common.unknown")
			: t(
					value
						? "environment.scheduled_work.yes"
						: "environment.scheduled_work.no",
				);

	return (
		<Stack spacing={1} sx={{ mb: 3 }}>
			<Typography variant="h2" sx={{ mb: 1 }}>
				{t("environment.scheduled_work.title")}
			</Typography>
			<Typography variant="body2">
				{t("environment.scheduled_work.enabled", {
					value: yesNo(work.scheduledWorkEnabled),
				})}
			</Typography>
			{work.trackingInterval && (
				<Typography variant="body2">
					{work.trackingLastRunCount != null &&
					work.trackingLastRunSeconds != null
						? t("environment.scheduled_work.tracking_last_run", {
								interval: work.trackingInterval,
								count: work.trackingLastRunCount,
								seconds: work.trackingLastRunSeconds,
							})
						: t("environment.scheduled_work.tracking", {
								interval: work.trackingInterval,
							})}
				</Typography>
			)}
			{work.harvestInterval && (
				<Typography variant="body2">
					{t("environment.scheduled_work.harvest", {
						interval: work.harvestInterval,
					})}
				</Typography>
			)}
			{work.nodes.length > 0 && (
				<TableContainer>
					<Table size="small">
						<caption>{t("environment.scheduled_work.nodes_caption")}</caption>
						<TableHead>
							<TableRow>
								<TableCell>{t("environment.scheduled_work.node")}</TableCell>
								<TableCell>
									{t("environment.scheduled_work.runs_scheduled_work")}
								</TableCell>
								<TableCell>{t("environment.scheduled_work.started")}</TableCell>
								<TableCell>
									{t("environment.scheduled_work.last_heartbeat")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{work.nodes.map((node) => (
								<TableRow key={node.id}>
									<TableCell>{node.name ?? node.id}</TableCell>
									<TableCell>{yesNo(node.runsScheduledWork)}</TableCell>
									<TableCell>{node.started ?? t("common.unknown")}</TableCell>
									<TableCell>
										{node.lastHeartbeat
											? dateTime.format(new Date(node.lastHeartbeat))
											: t("common.unknown")}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Stack>
	);
}
