export const getSpecialRedirects = (
	key: string,
	href: string,
	isUUIDinSearch: boolean,
): string => {
	// For cases when our breadcrumb links need non-standard redirects
	if (isUUIDinSearch) {
		return "/search?q=" + key;
	} else if (
		key == "mappings.numeric_range" ||
		key == "mappings.ref_value" ||
		key == "nav.libraries.patronRequests.name"
	) {
		return href + "/all";
	} else {
		return href;
	}
};
