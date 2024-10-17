import {
	nonClickableTypes,
	specialRedirectionTypes,
} from "src/constants/dataGridConstants";

export function determineDataGridPathOnClick(type: string, rowId: string) {
	if (specialRedirectionTypes.includes(type)) {
		if (type === "dataChangeLog") {
			return `/serviceInfo/dataChangeLog/${rowId}`;
		} else if (type == "welcomeLibraries") {
			return `/libraries/${rowId}`;
		} else {
			return `/patronRequests/${rowId}`;
		}
	} else if (
		// Others we don't want users to be able to click through on
		!nonClickableTypes.includes(type)
	) {
		// Whereas most can just use this standard redirection based on type
		return `/${type}/${rowId}`;
	}
	return "";
}
