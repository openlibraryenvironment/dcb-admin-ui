import {
	Breadcrumbs as MUIBreadcrumbs,
	Typography,
	useTheme,
} from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import Link from "@components/Link/Link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
//localisation
import { useTranslation } from "next-i18next";
import { truncate } from "lodash";
import { formatBreadcrumbTitles } from "src/helpers/formatBreadcrumbTitles";
import { getSpecialRedirects } from "src/helpers/breadcrumbs/getSpecialRedirects";

type BreadcrumbType = {
	href: string;
	isCurrent: boolean;
	key: string;
	isUUID: boolean;
};

type BreadcrumbsType = {
	titleAttribute?: string;
};

export default function Breadcrumbs({ titleAttribute }: BreadcrumbsType) {
	const router = useRouter();
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbType[]>([]);
	const { t } = useTranslation();
	const theme = useTheme();

	useEffect(() => {
		const pathWithoutQuery = router.asPath.split("?")[0];
		let pathArray = pathWithoutQuery.split("/");
		pathArray.shift();

		pathArray = pathArray.filter((path) => path !== "");

		const breadcrumbs: BreadcrumbType[] = pathArray.map((path, index) => {
			const href = "/" + pathArray.slice(0, index + 1).join("/");
			return {
				href,
				isCurrent: index === pathArray.length - 1,
				key: getKey(pathArray.slice(0, index + 1)),
				isUUID: path.length === 36,
			};
		});
		setBreadcrumbs(breadcrumbs);
	}, [router.asPath]);

	const getKey = (pathArray: string[]): string => {
		if (
			pathArray[0] == "libraries" &&
			pathArray.length == 2 &&
			titleAttribute
		) {
			// return formatBreadcrumbTitles(titleAttribute ?? pathArray[1]) ?? pathArray[1];
			if (titleAttribute) return formatBreadcrumbTitles(titleAttribute);
			else {
				return pathArray[1];
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
				case "consortium":
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
					if (pathArray[0] === "search") {
						if (pathArray[2] === "cluster") {
							return "nav.search.cluster";
						} else if (pathArray[2] === "items") {
							return "nav.search.items";
						} else if (pathArray[2] === "identifiers") {
							return "nav.search.identifiers";
						}
					} else if (pathArray[0] == "libraries") {
						if (pathArray[1].length == 36 && pathArray.length == 2) {
							return titleAttribute ?? pathArray[1];
						}
						switch (pathArray[2]) {
							case "contacts":
								return "nav.libraries.contacts";
							case "locations":
								return "nav.locations";
							case "service":
								return "nav.libraries.service";
							case "settings":
								return "nav.libraries.settings";
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
				// Check for request errors
				if (nestedKey == "serviceInfo.requestErrors") {
					return "nav.serviceInfo.requestErrors.name";
				}
				if (nestedKey == "serviceInfo.requestErrors.requests") {
					return titleAttribute ?? "nav.serviceInfo.requestErrors.requests";
				}
				// Not a UUID, formulate the translation key.
				return "nav." + nestedKey;
			}
		}
	};

	//this is used to either set the breadcrumb as a link if it is the last breadcrumb.
	const mapBreadcrumbs = () => {
		return breadcrumbs?.map((breadcrumb, index) => {
			const isUUIDInSearchPage =
				router.pathname.startsWith("/search/[id]") && breadcrumb.isUUID;
			const isLastBreadcrumb = index === breadcrumbs.length - 1;

			if (isLastBreadcrumb) {
				return (
					<Typography
						sx={{ color: "inherit", fontSize: "14px" }}
						key={breadcrumb.href}
						title={
							breadcrumb.key.length === 36 ? titleAttribute : t(breadcrumb.key)
						}
						aria-current="page"
					>
						{breadcrumb.key.length === 36
							? titleAttribute
								? titleAttribute.length > 36
									? truncate(titleAttribute, { length: 36 })
									: titleAttribute
								: breadcrumb.key
							: t(breadcrumb.key)}
					</Typography>
				);
			}

			if (breadcrumb.key === "nav.auditLog") {
				return (
					<Typography
						sx={{ color: theme.palette.primary.breadcrumbs, fontSize: "14px" }}
						key={index}
						title={t(breadcrumb.key)}
					>
						{breadcrumb.isUUID ? breadcrumb.key : t(breadcrumb.key)}
					</Typography>
				);
			}

			return (
				<Link
					sx={{ color: theme.palette.primary.breadcrumbs, fontSize: "14px" }}
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
			aria-label={t("a11y.is_breadcrumb")}
			sx={{ pl: 3, pr: 3 }}
			separator={<ArrowForwardIos sx={{ fontSize: "1em" }} />}
		>
			{/* Check if we're on the home page - if we are, unset the 'Home' link */}
			{/* Breadcrumb length will always be 0 on the home page as it is at the base URL */}
			{breadcrumbs.length == 0 ? (
				<Typography
					title={t("nav.home")}
					sx={{ color: "inherit", fontSize: "14px" }}
				>
					{t("nav.home")}
				</Typography>
			) : (
				<Link
					sx={{ color: theme.palette.primary.breadcrumbs, fontSize: "14px" }}
					underline="hover"
					href="/"
					title={t("nav.home")}
				>
					{t("nav.home")}
				</Link>
			)}
			{mapBreadcrumbs()};
		</MUIBreadcrumbs>
	);
}
