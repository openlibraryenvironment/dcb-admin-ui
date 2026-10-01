import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

import Link from "@components/Link/Link";

/**
 * The way back from a drill-down.
 *
 * `from` is a router path in a search param, not a typed route, and still goes through a
 * router link: a root-relative href resolves against the origin and leaves the app on a
 * deployment serving several OpenRS apps under path prefixes. Checked to be internal
 * where it is parsed - see drillSearch.
 *
 * Split into path and search because the router treats `to` as a pathname: a query string
 * inside it becomes part of the path and arrives as no search params at all.
 */
export default function ReturnToInsights({
	from,
	label,
}: {
	from?: string;
	label?: string;
}) {
	const { t } = useTranslation();
	const router = useRouter();

	if (!from) return null;

	const queryAt = from.indexOf("?");
	const to = queryAt === -1 ? from : from.slice(0, queryAt);
	const search =
		queryAt === -1
			? undefined
			: router.options.parseSearch(from.slice(queryAt));

	return (
		<Box sx={{ mb: 2 }}>
			<Link
				to={to}
				search={search}
				underline="hover"
				sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
			>
				<ArrowBack fontSize="small" aria-hidden />
				{label
					? t("insights.drill.back_to_panel", { panel: label })
					: t("insights.drill.back")}
			</Link>
		</Box>
	);
}
