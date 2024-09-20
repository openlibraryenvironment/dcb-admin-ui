import {
	Alert as MUIAlert,
	AlertTitle,
	AlertProps,
	Snackbar,
} from "@mui/material";
import { capitalize } from "@mui/material/utils";
import { forwardRef } from "react";

const SnackbarAlert = forwardRef<HTMLDivElement, AlertProps>(
	function Alert(props, ref) {
		return <MUIAlert elevation={6} ref={ref} variant="filled" {...props} />;
	},
);

export default function TimedAlert(props: any) {
	return (
		<>
			<Snackbar
				open={props.open}
				autoHideDuration={props.autoHideDuration}
				onClose={props.onCloseFunc}
			>
				<SnackbarAlert
					severity={props.severityType}
					onClose={props.onCloseFunc}
				>
					<AlertTitle>
						{props.alertTitle ?? capitalize(props.severityType)}
					</AlertTitle>
					{props.alertText}
				</SnackbarAlert>
			</Snackbar>
		</>
	);
}
