export interface TimedAlertProps {
	open: boolean;
	severityType: "success" | "info" | "warning" | "error";
	onCloseFunc: any;
	autoHideDuration: number;
	alertTitle?: string;
	alertText: any;
}
