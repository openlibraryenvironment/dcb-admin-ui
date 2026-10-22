import { useTranslation } from "react-i18next";
import { Alert, AlertTitle, Box, Typography } from "@mui/material";

import { useLocaleStore } from "@hooks/useLocaleStore";
import { lastPingView } from "@helpers/hostLmsLastPing";
import { deploymentLocale, resolveFormatLocale } from "@helpers/locale";

type HostLmsLastPingProps = {
	/** HostLms.lastPing as dcb-service returns it. */
	lastPing: unknown;
};

/** What dcb-service found at its last connectivity check of one Host LMS. */
export default function HostLmsLastPing({ lastPing }: HostLmsLastPingProps) {
	const { t } = useTranslation();
	const choice = useLocaleStore((s) => s.choice);
	const view = lastPingView(lastPing);

	if (!view) {
		return <Alert severity="info">{t("hostlms.last_ping.never")}</Alert>;
	}

	const dateTime = new Intl.DateTimeFormat(
		resolveFormatLocale(choice, deploymentLocale()),
		{ dateStyle: "medium", timeStyle: "short" },
	);
	const when = (iso: string | null) =>
		iso ? dateTime.format(new Date(iso)) : t("hostlms.last_ping.not_recorded");

	const facts: { key: string; label: string; value: string }[] = [
		{
			key: "checked_at",
			label: t("hostlms.last_ping.checked_at"),
			value: when(view.checkedAt),
		},
		{
			key: "last_ok_at",
			label: t("hostlms.last_ping.last_ok_at"),
			value: view.lastOkAt
				? when(view.lastOkAt)
				: t("hostlms.last_ping.never_ok"),
		},
		...(view.versionInfo
			? [
					{
						key: "version",
						label: t("hostlms.last_ping.version"),
						value: view.versionInfo,
					},
				]
			: []),
		...(view.pingMillis != null
			? [
					{
						key: "duration",
						label: t("hostlms.last_ping.duration"),
						value: t("hostlms.last_ping.duration_value", {
							ms: view.pingMillis,
						}),
					},
				]
			: []),
	];

	return (
		<Alert severity={view.severity}>
			<AlertTitle>{t(`hostlms.last_ping.state.${view.state}`)}</AlertTitle>
			<Typography variant="body2">
				{t(`hostlms.last_ping.advice.${view.state}`)}
			</Typography>
			<Box
				component="dl"
				sx={{
					display: "grid",
					gridTemplateColumns: "max-content 1fr",
					columnGap: 2,
					rowGap: 0.5,
					mt: 1.5,
					mb: 0,
				}}
			>
				{facts.map((fact) => (
					<Box key={fact.key} sx={{ display: "contents" }}>
						<Typography
							component="dt"
							variant="body2"
							sx={{ fontWeight: "bold" }}
						>
							{fact.label}
						</Typography>
						<Typography component="dd" variant="body2" sx={{ m: 0 }}>
							{fact.value}
						</Typography>
					</Box>
				))}
			</Box>
		</Alert>
	);
}
