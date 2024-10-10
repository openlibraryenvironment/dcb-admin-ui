export function determineDataGridPathOnClick(type: string, rowId: string) {
	if (
		type === "patronRequestsLibraryActive" ||
		type === "patronRequestsLibraryOutOfSequence" ||
		type === "patronRequestsLibraryCompleted" ||
		type === "patronRequestsLibraryException" ||
		type === "dataChangeLog"
	) {
		if (type === "dataChangeLog") {
			return `/serviceInfo/dataChangeLog/${rowId}`;
		} else {
			return `/patronRequests/${rowId}`;
		}
	} else if (
		// Others we don't want users to be able to click through on
		type !== "referenceValueMappings" &&
		type !== "circulationStatus" &&
		type !== "numericRangeMappings" &&
		type !== "referenceValueMappingsForLibrary" &&
		type !== "numericRangeMappingsForLibrary"
	) {
		// Whereas most can just use this standard redirection based on type
		return `/${type}/${rowId}`;
	}
	return "";
}
