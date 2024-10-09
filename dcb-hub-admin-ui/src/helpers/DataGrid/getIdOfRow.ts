export function getIdOfRow(row: any, type: string) {
	if (type == "bibRecordCountByHostLMS") {
		return row.sourceSystemId;
	} else {
		return row.id;
	}
}
