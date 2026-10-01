/**
 * Where a breadcrumb for `key` should link, or undefined when that level of the
 * path is not a page.
 *
 * Breadcrumb hrefs are built by slicing the current path, so every intermediate
 * segment becomes a link whether or not a route answers it. Two kinds do not:
 * the list pages whose real URL carries a category ("/all"), and "Audit log",
 * which is a section of a patron request rather than a page of its own -
 * `/patronRequests/audits` matched `/patronRequests/$id` with id "audits" and
 * opened the detail page's "cannot find record" state.
 */
const INERT_KEYS = new Set(["nav.auditLog"]);

const NEEDS_CATEGORY = new Set([
	"mappings.numeric_range",
	"mappings.ref_value",
	"nav.libraries.patronRequests.name",
	"nav.libraries.supplierRequests.name",
	"nav.patronRequests.name",
]);

export const getSpecialRedirects = (
	key: string,
	href: string,
	isUUIDinSearch: boolean,
): string | undefined => {
	// For cases when our breadcrumb links need non-standard redirects
	if (isUUIDinSearch) {
		return "/search?q=" + key;
	}
	if (INERT_KEYS.has(key)) {
		return undefined;
	}
	if (NEEDS_CATEGORY.has(key)) {
		return href + "/all";
	}
	return href;
};
