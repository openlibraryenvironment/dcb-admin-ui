export function getIdOfRow(row: any, type: string) {
	if (type == "bibRecordCountByHostLMS") {
		return row.sourceSystemId;
	} else if (type == "errorOverviewResults") {
		return row.namedSql + row.description;
	} else if (type == "errorOverviewPatronRequests") {
		return String(row.requestId + row.auditUrl + row.date);
	} else {
		return row.id;
	}
}
