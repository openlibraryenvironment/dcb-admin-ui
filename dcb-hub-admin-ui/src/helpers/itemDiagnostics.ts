import type { Item } from "@models/Item";

// The adapter's decision log can explain an available item too, such as a hold count the
// system did not report, so entries are shown whatever the status
export function showItemDiagnostics(
	item: Partial<Pick<Item, "status" | "decisionLogEntries">> | undefined,
): boolean {
	return (
		item?.status?.code !== "AVAILABLE" ||
		(item?.decisionLogEntries?.length ?? 0) > 0
	);
}
