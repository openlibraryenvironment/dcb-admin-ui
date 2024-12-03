export function calculateKeycloakRAGStatus(
	data: any,
): "Down" | "Partial" | "Up" | "Undefined" {
	const checks = data?.checks || [];

	const allStatus = checks.map((check: any) => check.status);

	if (allStatus.every((status: string) => status === "DOWN")) {
		return "Down"; // All statuses are 'DOWN'
	} else if (allStatus.some((status: string) => status === "DOWN")) {
		return "Partial"; // At least one status is 'DOWN'
	} else if (allStatus.every((status: string) => status === "UP")) {
		return "Up"; // All statuses are 'UP'
	} else {
		return "Undefined"; // RAG status cannot be determined
	}
}
