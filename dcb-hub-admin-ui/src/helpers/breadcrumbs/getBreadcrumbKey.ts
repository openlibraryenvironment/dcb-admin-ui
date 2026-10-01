import { formatBreadcrumbTitles } from "@helpers/formatBreadcrumbTitles";

/**
 * The translation key (or literal title) a breadcrumb shows for a path prefix.
 *
 * Extracted from the Breadcrumbs component so breadcrumbTrail.test.ts can walk
 * every route in the tree and check that each crumb it produces addresses a real
 * page. It did not: "/patronRequests/audits" matched /patronRequests/$id with the
 * id "audits" and opened that page's "cannot find record" state.
 *
 * Pure: the path prefix and the page's own title are all it reads.
 */
export function getBreadcrumbKey(
	pathArray: string[],
	titleAttribute?: string,
): string {
	if (
		(pathArray[0] == "libraries" || pathArray[0] == "groups") &&
		pathArray.length == 2 &&
		titleAttribute
	) {
		if (titleAttribute) return formatBreadcrumbTitles(titleAttribute);
		else {
			return pathArray[1];
		}
	}
	if (pathArray[0] === "groups" && pathArray.length > 2) {
		if (pathArray[1].length === 36) {
			switch (pathArray[2]) {
				case "patronRequests":
					return "nav.groups.patronRequests";
				case "supplierRequests":
					return "nav.groups.supplierRequests";
				case "settings":
					return "nav.groups.settings";
			}
		}
	}

	if (pathArray[0] === "libraries" && pathArray.length > 2) {
		// First, check for library ID (UUID)
		if (pathArray[1].length === 36) {
			// For library-specific pages, handle different nested routes
			switch (pathArray[2]) {
				case "patronRequests":
					if (pathArray[3] == "active") {
						return "nav.libraries.patronRequests.active";
					} else if (pathArray[3] == "outOfSequence")
						return "nav.libraries.patronRequests.out_of_sequence";
					else if (pathArray[3] == "exception")
						return "nav.libraries.patronRequests.exception";
					else if (pathArray[3] == "completed")
						return "nav.libraries.patronRequests.completed";
					else if (pathArray[3] == "all")
						return "nav.libraries.patronRequests.all";
					return "nav.libraries.patronRequests.name";
				case "referenceValueMappings":
					if (pathArray[3]) {
						return `nav.libraries.referenceValueMappings.${pathArray[3]}`;
					}
					return "mappings.ref_value";
				case "numericRangeMappings":
					if (pathArray[3]) {
						return `nav.libraries.numericRangeMappings.${pathArray[3]}`;
					}
					return "mappings.numeric_range";
				case "supplierRequests":
					if (pathArray[3] == "all") {
						return "nav.libraries.supplierRequests.all";
					}
					return "nav.libraries.supplierRequests.name";
			}
		}
	}

	// This function formulates the correct translation key from the pathArray.
	// For nested keys (like circulation status mappings) we just need to use .join
	const nestedKey = pathArray.join(".");
	// However top-level keys need to be addressed differently as in some cases they have the same name as the objects
	// i.e 'mappings' must become 'mappings.name' so it references a specific key and not the object.
	const topLevelKey = pathArray[0];
	// Check if the nestedKey is equal to the topLevelKey,
	// if true, return only the topLevel key - if not, return a nested key.
	if (nestedKey === topLevelKey) {
		// Handle the issue with 'mappings' and 'settings' and any other keys that need the '.name' suffix.
		switch (topLevelKey) {
			case "mappings":
			case "settings":
			case "search":
			case "serviceInfo":
			case "libraries":
			case "patronRequests":
			case "consortium":
			case "groups":
				return "nav." + topLevelKey + ".name";
			default:
				return "nav." + topLevelKey;
		}
	} else {
		// Check for UUIDs and ensure they are not translated.
		// As all UUIDs must be 36 characters, we can apply a length check here.
		// A UUID type check would be better, but is not available in the pathArray as everything is stored as a string.
		if (pathArray.slice(-1)[0].length == 36) {
			// UUID found, do not translate.
			// UUIDs will also always be nested keys which is why this check works.
			return pathArray.slice(-1)[0];
		} else {
			// Handle special cases for search pages
			if (pathArray.length > 2) {
				switch (pathArray[0]) {
					case "search":
						if (pathArray[2] === "cluster") {
							return "nav.search.cluster";
						} else if (pathArray[2] === "items") {
							return "nav.search.items";
						} else if (pathArray[2] === "identifiers") {
							return "nav.search.identifiers";
						} else if (pathArray[2] === "requestingHistory") {
							return "nav.search.requesting_history";
						} else if (pathArray[2] === "clusterExplanation") {
							return "nav.search.cluster_explainer";
						}
						break;
					case "libraries":
						if (pathArray[1].length == 36 && pathArray.length == 2) {
							return titleAttribute ?? pathArray[1];
						}
						switch (pathArray[2]) {
							case "bibs":
								return "nav.libraries.bibs";
							case "contacts":
								return "nav.libraries.contacts";
							case "locations":
								return "nav.locations";
							case "service":
								return "nav.libraries.service";
							case "settings":
								return "nav.libraries.settings";
						}
						break;
					case "groups":
						if (pathArray[1].length == 36 && pathArray.length == 2) {
							return titleAttribute ?? pathArray[1];
						}
				}
			}
			if (nestedKey.includes("#auditlog")) {
				// Catch cases where the URL is for the audit log section of the page
				return nestedKey.substring(0, 36);
			}
			// Check for audits: the key is formulated slightly differently due to the URL
			if (nestedKey == "patronRequests.audits") {
				return "nav.auditLog";
			}
			// Check for service info keys
			if (nestedKey == "serviceInfo.requestErrors") {
				return "nav.serviceInfo.requestErrors.name";
			}
			if (nestedKey == "serviceInfo.alarms") {
				return "nav.serviceInfo.alarms.name";
			}
			if (nestedKey == "serviceInfo.requestErrors.requests") {
				return titleAttribute ?? "nav.serviceInfo.requestErrors.requests";
			}
			// Not a UUID, formulate the translation key.
			return "nav." + nestedKey;
		}
	}
}
