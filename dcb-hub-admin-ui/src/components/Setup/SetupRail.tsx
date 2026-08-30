import { useTranslation } from "react-i18next";
import { Box, List, ListItem, Stack, Typography } from "@mui/material";

import { CustomLink } from "@components/CustomLink/CustomLink";
import {
	CheckCircle,
	RadioButtonChecked,
	RadioButtonUnchecked,
	RemoveCircleOutlined,
} from "@mui/icons-material";

import {
	CONSORTIUM_SETUP_STEPS,
	type ConsortiumSetupState,
	type ConsortiumSetupStepId,
} from "@helpers/consortiumSetup";
import { SETUP_CHAPTERS } from "./setupChapters";

interface SetupRailProps {
	current: ConsortiumSetupStepId;
	state: ConsortiumSetupState;
}

/**
 * Where the user is, what is behind them, and what is left — W-4.
 *
 * A `<nav>` of links, NOT a MUI `Stepper`. A Stepper's steps are buttons that move an
 * index; these are real navigations to real URLs, so they must be anchors - which is what
 * makes them openable in a new tab, announced as links, and reachable by a screen reader's
 * link list. `aria-current="step"` marks the one being shown.
 *
 * A chapter that is not yet reachable is rendered as plain text rather than a disabled
 * link: a disabled control is a dead end a keyboard user still has to tab through, and the
 * reason it is unreachable ("you need a consortium first") is already on the screen they
 * are looking at.
 */
export default function SetupRail({ current, state }: SetupRailProps) {
	const { t } = useTranslation();

	// Annotated: TypeScript otherwise picks Box's div overload for component="nav" and
	// reports the aria-label as unknown rather than resolving the polymorphic props.
	const railLabel: string = t("setup.rail_label");

	const stepFor = (id: ConsortiumSetupStepId) =>
		state.steps.find((step) => step.id === id);

	return (
		<Box
			component="nav"
			aria-label={railLabel}
			// Deliberately not sticky. A rail pinned to the viewport is the classic way
			// a focused control ends up underneath something (WCAG 2.4.11), and this one
			// is short enough not to need it.
			sx={{ minWidth: { md: 240 } }}
		>
			<List sx={{ p: 0 }}>
				{CONSORTIUM_SETUP_STEPS.map((id, index) => {
					const step = stepFor(id);
					const isCurrent = id === current;
					const number = index + 1;

					const icon = step?.complete ? (
						<CheckCircle fontSize="small" color="success" />
					) : step?.skipped ? (
						<RemoveCircleOutlined fontSize="small" color="disabled" />
					) : isCurrent ? (
						<RadioButtonChecked fontSize="small" color="primary" />
					) : (
						<RadioButtonUnchecked fontSize="small" color="disabled" />
					);

					// The state is on the icon, which is decorative, so it is also said
					// in words. "Done", "skipped" and "not started" are not colours.
					const status = step?.complete
						? t("setup.status.done")
						: step?.skipped
							? t("setup.status.skipped")
							: step?.available
								? t("setup.status.not_started")
								: t("setup.status.not_yet_available");

					const body = (
						<Stack
							direction="row"
							spacing={1}
							sx={{ alignItems: "center", py: 0.5 }}
						>
							<Box aria-hidden="true" sx={{ display: "flex" }}>
								{icon}
							</Box>
							<Typography component="span" variant="body2">
								{t("setup.rail_item", {
									number,
									label: t(SETUP_CHAPTERS[id].labelKey),
								})}
							</Typography>
							<Typography
								component="span"
								variant="body2"
								sx={{ color: "text.secondary" }}
							>
								{status}
							</Typography>
						</Stack>
					);

					return (
						<ListItem
							key={id}
							disablePadding
							// Target size (WCAG 2.5.8): the rows are links in a dense
							// column, so each gets a 24px-plus hit area of its own.
							sx={{ minHeight: 32, alignItems: "center" }}
						>
							{step?.available ? (
								<CustomLink
									to="/setup/$step"
									params={{ step: id }}
									// The active link is marked `aria-current="page"` by the
									// router itself, which is what announces "you are here"
									// rather than leaving it to the icon's colour.
									//
									// `aria-current="step"` would be the more precise value
									// for a position in a process, and it is not reachable:
									// TanStack spreads its own STATIC_ACTIVE_PROPS AFTER
									// activeProps (see link.js), so the router wins whatever
									// is passed. "page" is valid, is what every other
									// navigation in this application uses, and the
									// alternative is poking the attribute in from an effect
									// - which is a worse trade than the imprecision.
									underline="hover"
									sx={{ width: "100%", color: "primary.linkText" }}
								>
									{body}
								</CustomLink>
							) : (
								body
							)}
						</ListItem>
					);
				})}
			</List>
		</Box>
	);
}
