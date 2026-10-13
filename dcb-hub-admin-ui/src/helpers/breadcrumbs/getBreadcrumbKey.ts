import { formatBreadcrumbTitles } from "@helpers/formatBreadcrumbTitles";
import type { ConsortiumSetupStepId } from "@helpers/consortiumSetup";
import { SETUP_CHAPTERS } from "@components/Setup/setupChapters";

// Pages with no `nav.` key, labelled with their own title. A page that hides its crumbs
// still needs these: the location moves before the page being left unmounts.
const PAGE_TITLES: Record<string, string> = {
	"404": "ui.error.404.name",
	"500": "ui.error.500.name",
	maintenance: "ui.error.503.name",
	networkError: "ui.error.network_error",
	unauthorised: "ui.error.401.name",
	"hostlmss.new": "hostlms.new",
	setup: "setup.page_title",
	"setup.done": "setup.done.page_title",
};

/**
 * Whether a breadcrumb's value is a translation key or a title taken from the
 * record. Passing a record's name through `t()` asks i18next for a key called
 * "Alpha Test Library", which it reports missing on every page load.
 */
export const isTranslationKey = (value: string): boolean =>
	value.includes(".") && !value.includes(" ");

/**
 * The translation key (or literal title) a breadcrumb shows for a path prefix. Pure,
 * so navigationTargets.test.ts can check every route's crumbs link somewhere real and
 * carry a label.
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
				case "insights":
					return "nav.groups.insights";
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
	if (nestedKey in PAGE_TITLES) return PAGE_TITLES[nestedKey];
	if (pathArray[0] === "setup" && pathArray[1] in SETUP_CHAPTERS) {
		return SETUP_CHAPTERS[pathArray[1] as ConsortiumSetupStepId].labelKey;
	}
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
						// Every tab under a library. One missing case does not fail quietly: the
						// fallback returns "nav." + the joined path, so the breadcrumb renders
						// `nav.libraries.<uuid>.accounts` as literal text. accounts, branding and
						// insights were missing, and e2e/i18n-missing.spec.ts is what found them.
						switch (pathArray[2]) {
							case "accounts":
								return "nav.libraries.accounts";
							case "bibs":
								return "nav.libraries.bibs";
							case "branding":
								return "nav.libraries.branding";
							case "insights":
								return "nav.libraries.insights";
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
