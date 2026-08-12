import {
	Alert as MUIAlert,
	AlertTitle,
	AlertProps,
	Snackbar,
} from "@mui/material";
import { capitalize } from "@mui/material/utils";
import { forwardRef } from "react";

import {
	alertRole,
	resolveAutoHideDuration,
	shouldCloseOnReason,
} from "./alertTiming";

const SnackbarAlert = forwardRef<HTMLDivElement, AlertProps>(
	function Alert(props, ref) {
		return <MUIAlert elevation={6} ref={ref} {...props} />;
	},
);

export default function TimedAlert(props: any) {
	const severity = props.severityType;

	return (
		<Snackbar
			open={props.open}
			autoHideDuration={resolveAutoHideDuration(
				severity,
				props.autoHideDuration,
			)}
			onClose={(_event, reason) => {
				if (!shouldCloseOnReason(severity, reason)) return;
				props.onCloseFunc?.();
			}}
		>
			<SnackbarAlert
				severity={severity}
				onClose={props.onCloseFunc}
				role={alertRole(severity)}
				sx={{
					maxWidth: "700px",
					// Server errors arrive as one line per problem; without this they
					// collapse onto a single unreadable line.
					whiteSpace: "pre-line",
				}}
			>
				<AlertTitle>{props.alertTitle ?? capitalize(severity)}</AlertTitle>
				{props.alertText}
			</SnackbarAlert>
		</Snackbar>
	);
}
