import { useTranslation } from "react-i18next";
import { Box, Link } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

/**
 * The way back from a drill-down.
 *
 * Named for the panel, not "Back": the reader arrived here from one figure among thirty,
 * and a browser's back button is not a promise the page can make - they may have filtered,
 * paged or sorted since. The whole Insights view is a URL, so returning to the exact one
 * they left costs nothing.
 *
 * A plain anchor rather than a router Link: `from` is a path carried in the URL, so it is
 * not one of the typed routes the router knows. It is checked to be internal where it is
 * parsed - see drillSearch.
 */
export default function ReturnToInsights({
	from,
	label,
}: {
	from?: string;
	label?: string;
}) {
	const { t } = useTranslation();

	if (!from) return null;

	return (
		<Box sx={{ mb: 2 }}>
			<Link
				href={from}
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
