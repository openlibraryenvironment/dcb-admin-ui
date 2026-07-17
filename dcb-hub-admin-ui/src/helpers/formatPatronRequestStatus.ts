export const formatPatronRequestStatus = (
	status?: string | null,
	outcome?: string | null,
) => {
	const workflowStatus = status || "Unknown";
	if (!outcome) return workflowStatus;

	return `${workflowStatus} · ${outcome.replaceAll("_", " ")}`;
};
