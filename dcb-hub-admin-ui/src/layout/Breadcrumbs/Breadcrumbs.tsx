import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Breadcrumbs as MUIBreadcrumbs, Typography } from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import { useLocation } from "@tanstack/react-router"; // TanStack Hook
import { truncate } from "lodash";

import Link from "@components/Link/Link";
import { getSpecialRedirects } from "@helpers/breadcrumbs/getSpecialRedirects";
import { getBreadcrumbKey } from "@helpers/breadcrumbs/getBreadcrumbKey";

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
		(pathArray: string[]) => getBreadcrumbKey(pathArray, titleAttribute),
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
						sx={{ color: "inherit", fontSize: "0.875rem" }}
						key={breadcrumb.href}
						title={title}
						aria-current="page"
					>
						{title}
					</Typography>
				);
			}

			const destination = getSpecialRedirects(
				breadcrumb.key,
				breadcrumb.href,
				isUUIDInSearchPage,
			);

			// A level of the path that is not a page renders as text. Slicing the path
			// makes every segment a candidate link, and a link to a segment no route
			// answers takes the reader somewhere worse than nowhere.
			if (!destination) {
				return (
					<Typography
						sx={{ color: "inherit", fontSize: "0.875rem" }}
						key={breadcrumb.href}
						title={String(t(breadcrumb.key))}
					>
						{t(breadcrumb.key)}
					</Typography>
				);
			}

			return (
				<Link
					sx={{ color: "primary.breadcrumbs", fontSize: "0.875rem" }}
					underline="hover"
					key={breadcrumb.href}
					href={destination}
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
					sx={{ color: "inherit", fontSize: "0.875rem" }}
				>
					{t("nav.home")}
				</Typography>
			) : (
				<Link
					sx={{ color: "primary.breadcrumbs", fontSize: "0.875rem" }}
					underline="hover"
					to="/"
					title={t("nav.home")}
				>
					{t("nav.home")}
				</Link>
			)}
			{mapBreadcrumbs()}
		</MUIBreadcrumbs>
	);
}
