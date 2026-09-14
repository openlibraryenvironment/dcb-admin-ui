import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Box, Link, Typography } from "@mui/material";
import { createLink } from "@tanstack/react-router";

import type { Drill } from "@helpers/insightsDrill";

/**
 * A link from a figure to the requests behind it.
 *
 * The whole Insights view is a URL, so the destination can carry the way back: `from` is
 * this exact view and `fromLabel` names the panel, which is what the return link says
 * instead of "Back".
 *
 * `createLink` over MUI's anchor, as everywhere else here: the router keeps its typing on
 * `to`, and the result is a real anchor - middle-click, ctrl-click and "open in new tab"
 * all work, and a screen reader lists these among the page's links.
 */
const RouterLink = createLink(Link);

/** Where the reader is now, which is where a drill-down has to bring them back to. */
const here = () =>
	typeof window === "undefined"
		? undefined
		: `${window.location.pathname}${window.location.search}`;

export default function DrillLink({
	drill,
	panel,
	subject,
	children,
}: {
	drill: Drill;
	/** The panel's own title, so the destination can name where the reader came from. */
	panel: string;
	/**
	 * What the link is about, when the visible text does not say. A figure reads as "4.0%",
	 * which names nothing to somebody hearing the page's links one after another.
	 */
	subject?: string;
	children: ReactNode;
}) {
	const { t } = useTranslation();

	return (
		<RouterLink
			to={drill.to}
			search={{ q: drill.q, from: here(), fromLabel: panel }}
			// The visible text is a status, a code or a figure - none of which says what
			// following the link DOES, and a reader listing the page's links hears only the
			// name. So the name carries the destination - and STARTS with the visible text,
			// because WCAG 2.5.3 Label in Name requires the accessible name to contain what
			// is painted: a voice-control user says what they can see.
			aria-label={
				typeof children === "string"
					? `${children}: ${t("insights.drill.open", {
							subject: subject ?? children,
						})}`
					: t("insights.drill.open", { subject: subject ?? panel })
			}
		>
			{children}
		</RouterLink>
	);
}

/**
 * The same links for a panel whose figures are a chart.
 *
 * A bar is not focusable and a click handler on one is a pointer-only affordance, so the
 * drill-downs for a chart are a list beneath it rather than the marks themselves. The chart
 * stays the picture; the list is the navigation.
 */
export function DrillList({
	items,
	panel,
}: {
	items: { key: string; label: string; drill: Drill }[];
	panel: string;
}) {
	const { t } = useTranslation();

	if (items.length === 0) return null;

	return (
		<Box sx={{ mt: 2 }}>
			<Typography variant="body2" color="text.secondary" component="p">
				{t("insights.drill.list_label")}
			</Typography>
			<Box
				component="ul"
				sx={{
					listStyle: "none",
					display: "flex",
					flexWrap: "wrap",
					gap: 2,
					m: 0,
					mt: 0.5,
					p: 0,
				}}
			>
				{items.map((item) => (
					<li key={item.key}>
						<DrillLink drill={item.drill} panel={panel}>
							{item.label}
						</DrillLink>
					</li>
				))}
			</Box>
		</Box>
	);
}
