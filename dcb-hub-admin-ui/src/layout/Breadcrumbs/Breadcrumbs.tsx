import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Breadcrumbs as MUIBreadcrumbs, Typography } from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import { useLocation } from "@tanstack/react-router"; // TanStack Hook
import { truncate } from "lodash";

import Link from "@components/Link/Link";
import { formatBreadcrumbTitles } from "@helpers/formatBreadcrumbTitles";
import { getSpecialRedirects } from "@helpers/breadcrumbs/getSpecialRedirects";

type BreadcrumbType = {
	href: string;
	isCurrent: boolean;
	key: string;
	isUUID: boolean;
};

export default function Breadcrumbs({
	titleAttribute,
}: {
	titleAttribute?: string;
}) {
	const location = useLocation();
	const { t } = useTranslation();

	const getKey = useCallback(
		(pathArray: string[]): string => {
			if (
				(pathArray[0] == "libraries" || pathArray[0] == "groups") &&
				pathArray.length == 2 &&
				titleAttribute
			) {
				// return formatBreadcrumbTitles(titleAttribute ?? pathArray[1]) ?? pathArray[1];
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
		},
		[titleAttribute],
	);

	// Breadcrumbs are derived directly from the current path rather than stored
	// in state and synced via an effect.
	const breadcrumbs = useMemo<BreadcrumbType[]>(() => {
		const pathWithoutQuery = location.pathname.split("?")[0];
		const pathArray = pathWithoutQuery.split("/").filter(Boolean);
		return pathArray.map((path, index) => {
			const href = "/" + pathArray.slice(0, index + 1).join("/");
			return {
				href,
				isCurrent: index === pathArray.length - 1,
				key: getKey(pathArray.slice(0, index + 1)),
				isUUID: path.length === 36,
			};
		});
	}, [location.pathname, getKey]);

	const mapBreadcrumbs = () => {
		return breadcrumbs.map((breadcrumb, index) => {
			const isUUIDInSearchPage =
				location.pathname.startsWith("/search/") && breadcrumb.isUUID;
			const isLastBreadcrumb = index === breadcrumbs.length - 1;

			if (isLastBreadcrumb) {
				const title =
					breadcrumb.key.length === 36
						? titleAttribute
							? truncate(titleAttribute, { length: 36 })
							: breadcrumb.key
						: t(breadcrumb.key);
				return (
					<Typography
						sx={{ color: "inherit", fontSize: "14px" }}
						key={breadcrumb.href}
						title={title}
						aria-current="page"
					>
						{title}
					</Typography>
				);
			}

			return (
				<Link
					sx={{ color: "primary.breadcrumbs", fontSize: "14px" }}
					underline="hover"
					key={breadcrumb.href}
					href={getSpecialRedirects(
						breadcrumb.key,
						breadcrumb.href,
						isUUIDInSearchPage,
					)}
					title={t(breadcrumb.key)}
				>
					{t(breadcrumb.key)}
				</Link>
			);
		});
	};

	return (
		<MUIBreadcrumbs
			aria-label={String(t("ui.a11y.is_breadcrumb"))}
			sx={{ px: 3 }}
			separator={<ArrowForwardIos sx={{ fontSize: "1em" }} />}
		>
			{breadcrumbs.length === 0 ? (
				<Typography
					title={String(t("nav.home"))}
					sx={{ color: "inherit", fontSize: "14px" }}
				>
					{t("nav.home")}
				</Typography>
			) : (
				<Link
					sx={{ color: "primary.breadcrumbs", fontSize: "14px" }}
					underline="hover"
					href="/"
					title={t("nav.home")}
				>
					{t("nav.home")}
				</Link>
			)}
			{mapBreadcrumbs()}
		</MUIBreadcrumbs>
	);
}
