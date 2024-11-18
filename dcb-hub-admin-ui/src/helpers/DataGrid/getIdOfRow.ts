export function getIdOfRow(row: any, type: string) {
	if (type == "bibRecordCountByHostLMS") {
		return row.sourceSystemId;
	} else if (type == "errorOverviewResults") {
		const id = String(row.namedSql).concat(row.description);
		return id;
	} else if (type == "errorOverviewPatronRequests") {
		const id = String(row.RequestId).concat(row.URL);
		return id;
	} else {
		return row.id;
	}
}
