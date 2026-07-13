import { Box, Tab, Tabs, Typography } from "@mui/material";
import { FilterAltOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";

import { handleTabChange } from "@helpers/navigation/handleTabChange";
import { a11yTabProps } from "@helpers/navigation/a11yTabProps";

// The five workflow buckets shared by every top-level patron request grid.
// `inProgress`/`finished` keep the server-side names the pages already derive.
type PatronRequestTabKey =
	"exception" | "outOfSequence" | "inProgress" | "finished" | "all";

export type PatronRequestTabCounts = Record<PatronRequestTabKey, number>;
export type PatronRequestTabLoading = Partial<
	Record<PatronRequestTabKey, boolean>
>;

interface PatronRequestTabsProps {
	/**
	 * The active tab's route path. Pass `Route.fullPath` (e.g.
	 * "/patronRequests/active") - it MUST equal one of the tab `value`s below
	 * so MUI selects the right tab and onChange yields a navigable path.
	 */
	currentPath: string;
	/** Resolved total for each tab's badge. */
	totalSizes: PatronRequestTabCounts;
	/** Per-tab loading flags; a loading tab shows a spinner label in place of its count. */
	loading?: PatronRequestTabLoading;
	/** When true, the *current* tab renders a filter indicator (its grid is filtered). */
	isFilterApplied?: boolean;
}

// One entry per tab. `key` indexes both `totalSizes` and `loading`; `path` is
// the route's fullPath and doubles as the MUI Tab value (via a11yTabProps), so
// selection and navigation stay in lockstep - the drift that previously caused
// "None of the Tabs' children match" warnings and index-based misnavigation.
const TABS: ReadonlyArray<{
	path: string;
	labelKey: string;
	key: PatronRequestTabKey;
}> = [
	{
		path: "/patronRequests/exception",
		labelKey: "libraries.patronRequests.exception_short",
		key: "exception",
	},
	{
		path: "/patronRequests/outOfSequence",
		labelKey: "libraries.patronRequests.out_of_sequence_short",
		key: "outOfSequence",
	},
	{
		path: "/patronRequests/active",
		labelKey: "libraries.patronRequests.active_short",
		key: "inProgress",
	},
	{
		path: "/patronRequests/completed",
		labelKey: "libraries.patronRequests.completed_short",
		key: "finished",
	},
	{
		path: "/patronRequests/all",
		labelKey: "libraries.patronRequests.all_short",
		key: "all",
	},
];

export default function PatronRequestTabs({
	currentPath,
	totalSizes,
	loading = {},
	isFilterApplied = false,
}: PatronRequestTabsProps) {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<Tabs
			value={currentPath}
			onChange={(_event, value) => handleTabChange({ newValue: value, router })}
			aria-label={t(
				"nav.patronRequests.accessibility_title",
				"Patron request navigation",
			)}
		>
			{TABS.map((tab) => {
				const isLoading = Boolean(loading[tab.key]);
				const showFilter = isFilterApplied && currentPath === tab.path;
				return (
					<Tab
						key={tab.path}
						{...a11yTabProps(tab.path)}
						label={
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography variant="subTabTitle">
									{t(tab.labelKey, {
										number: isLoading
											? t("common.loading")
											: totalSizes[tab.key],
									})}
								</Typography>
								{showFilter && (
									<FilterAltOutlined
										fontSize="small"
										aria-label={String(t("common.filter_applied"))}
									/>
								)}
							</Box>
						}
					/>
				);
			})}
		</Tabs>
	);
}
