import { useTranslation } from "react-i18next";
import {
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import useDCBServiceInfo from "@hooks/useDCBServiceInfo";
import {
	SERVICE_CAPABILITIES,
	capabilityStatus,
	type CapabilityStatus,
} from "@constants/serviceCapabilities";

/**
 * Which DCB Admin features this deployment's dcb-service can serve, and whether they
 * are switched on — R-19.
 *
 * <h2>What this is for</h2>
 *
 * DCB Admin runs against dcb-service 8.71.0 and 9.0.0 alike, with the newer features
 * behind runtime flags so an environment can turn them on when its backend is upgraded,
 * without rebuilding the bundle. That leaves two questions somebody has to be able to
 * answer without reading source: "is the switch due yet", and "why has this feature
 * stopped working". This table answers both, in one screen.
 *
 * The mismatch rows are the point. A flag switched on ahead of the upgrade
 * (`premature`) is the state in which a feature fails in ways that look like a bug, and
 * it is the state nothing else in the application would report.
 *
 * <h2>Accessibility</h2>
 *
 * A real table with real header cells, and the status said in WORDS. A row's state is
 * never carried by colour alone: the Alert below is an addition to the text, not the
 * only place the mismatch appears.
 */

/** The states worth interrupting somebody about. */
const MISMATCHED: ReadonlyArray<CapabilityStatus> = ["premature", "available"];

export default function ServiceCapabilities() {
	const { t } = useTranslation();
	const { version } = useDCBServiceInfo();

	const rows = SERVICE_CAPABILITIES.map((capability) => ({
		capability,
		status: capabilityStatus(capability, version),
	}));

	const mismatches = rows.filter((row) => MISMATCHED.includes(row.status));

	return (
		<>
			<Typography variant="h2" sx={{ mt: 4, mb: 1 }}>
				{t("service_capabilities.title")}
			</Typography>
			<Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
				{t("service_capabilities.subtitle", {
					version: version ?? t("service_capabilities.version_unknown"),
				})}
			</Typography>

			{mismatches.length > 0 && (
				<Alert
					severity={
						mismatches.some((row) => row.status === "premature")
							? "warning"
							: "info"
					}
					sx={{ mb: 2 }}
				>
					{mismatches
						.map((row) =>
							t(`service_capabilities.alert.${row.status}`, {
								feature: t(`service_capabilities.feature.${row.capability.id}`),
								flag: row.capability.flag,
							}),
						)
						.join(" ")}
				</Alert>
			)}

			<TableContainer sx={{ overflowX: "auto" }}>
				<Table
					size="small"
					aria-label={String(t("service_capabilities.title"))}
					sx={{ minWidth: 640 }}
				>
					<TableHead>
						<TableRow>
							<TableCell component="th" scope="col">
								{t("service_capabilities.column.feature")}
							</TableCell>
							<TableCell component="th" scope="col">
								{t("service_capabilities.column.needs")}
							</TableCell>
							<TableCell component="th" scope="col">
								{t("service_capabilities.column.flag")}
							</TableCell>
							<TableCell component="th" scope="col">
								{t("service_capabilities.column.status")}
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map(({ capability, status }) => (
							<TableRow key={capability.id}>
								<TableCell component="th" scope="row">
									{t(`service_capabilities.feature.${capability.id}`)}
								</TableCell>
								<TableCell>
									{capability.since
										? t("service_capabilities.needs_version", {
												version: capability.since,
											})
										: t("service_capabilities.needs_unreleased")}
								</TableCell>
								<TableCell>
									{/* The variable name, verbatim - it is what an operator types. */}
									<code>{capability.flag}</code>
									{": "}
									{capability.enabled()
										? t("service_capabilities.flag_on")
										: t("service_capabilities.flag_off")}
								</TableCell>
								<TableCell>
									{t(`service_capabilities.status.${status}`)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</>
	);
}
