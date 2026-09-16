import { useTranslation } from "react-i18next";
import { Box, Link } from "@mui/material";
import { createLink } from "@tanstack/react-router";

import { Subject, visibleSubjects } from "@helpers/insightsSubjects";
import { SUBJECT_BAR_HEIGHT, SUBJECT_BAR_TOP } from "@themes/stickyOffsets";

/**
 * The six subjects, as links.
 *
 * NOT a tablist, deliberately. The library page already owns a twelve-tab strip and the
 * groups page a four-tab strip, and a second tablist inside the panel of the first gives a
 * keyboard user two sets of arrow keys with no way to tell which has focus. docs/
 * accessibility.md already records that navigation which changes the URL is better as
 * links, and keeps `Tabs` for the six existing bars only because changing them would lose
 * the roving focus MUI gets right. That trade does not apply to a bar built from scratch.
 *
 * Sticky under the AppBar at the offset the theme's scroll-padding assumes, so a focused
 * element never lands beneath it - both numbers come from stickyOffsets for that reason.
 */

// createLink over MUI's anchor, the same shape as TabLink over Tab: the router keeps its
// typing on `to`, and the result is a real <a> - so middle-click, ctrl-click and "open in
// new tab" all work, and a screen reader lists these among the page's links.
const SubjectLink = createLink(Link);

export default function SubjectBar({
	current,
	scopedCodes,
	to,
	params,
}: {
	current: Subject;
	/** How many Host LMS codes the view covers; decides whether Gaps can be shown. */
	scopedCodes: number;
	to: string;
	params?: Record<string, string>;
}) {
	const { t } = useTranslation();

	return (
		<Box
			component="nav"
			aria-label={String(t("insights.subjects.label"))}
			sx={{
				position: "sticky",
				top: `${SUBJECT_BAR_TOP}px`,
				zIndex: (theme) => theme.zIndex.appBar - 1,
				minHeight: SUBJECT_BAR_HEIGHT,
				display: "flex",
				gap: 0,
				overflowX: "auto",
				bgcolor: "primary.tabsBackground",
				borderBottom: 1,
				borderColor: "divider",
				mb: 3,
			}}
		>
			{visibleSubjects(scopedCodes).map((subject) => {
				const selected = subject === current;

				return (
					<SubjectLink
						key={subject}
						underline="none"
						to={to}
						params={params}
						search={(prev: Record<string, unknown>) => ({
							...prev,
							tab: subject,
						})}
						// The current subject, for a screen reader as well as for the eye.
						aria-current={selected ? "page" : undefined}
						sx={{
							px: 2,
							py: 1.5,
							whiteSpace: "nowrap",
							textDecoration: "none",
							color: "primary.navigationText",
							fontWeight: selected ? 700 : 400,
							borderBottom: 3,
							borderColor: selected ? "primary.tabIndicator" : "transparent",
							"&:hover": { bgcolor: "primary.hover" },
						}}
					>
						{t(`insights.subjects.${subject}`)}
					</SubjectLink>
				);
			})}
		</Box>
	);
}
