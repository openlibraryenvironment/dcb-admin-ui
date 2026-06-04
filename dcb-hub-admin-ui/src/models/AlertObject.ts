export interface AlertObject {
	open: boolean;
	severity: "success" | "warning" | "info" | "error";
	title: string;
	text: string;
}
