import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	LinearProgress,
	Step,
	StepLabel,
	Stepper,
	Typography,
} from "@mui/material";

import { CustomLink } from "@components/CustomLink/CustomLink";
import DCBStepIcon from "@components/DCBStepIcon/DCBStepIcon";
import { useVisitedChapters } from "./setupRun";

import {
	consortiumSetupSteps,
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
 * <h2>A Stepper, and still a list of links</h2>
 *
 * The first version was a hand-built `<nav>` of links. It was accessible and it looked
 * wrong: body-2 text at roughly half the weight of the chapter beside it, no rule between
 * one step and the next, and the only mark of the current step a small coloured icon that
 * did not read as "you are here" at a glance.
 *
 * A vertical MUI `Stepper` fixes all three for free and is what the rest of this
 * application already uses for a sequence — the New Library wizard, the consortium
 * wizard, the NCIP onboarding page. Its connectors are the division between steps, its
 * active step is typographically distinct, and `DCBStepIcon` is the same numbered mark
 * those wizards use, so setup stops looking like a different product.
 *
 * <h2>What is deliberately not a Stepper's default</h2>
 *
 * `nonLinear`, because these are not gated in order — a returning user jumps to whichever
 * chapter they left.
 *
 * Every reachable step is a REAL LINK, and it is the STEP LABEL that is the link - not a
 * `StepButton`. MUI 9's StepButton hardcodes `role="tab"` with `aria-posinset`/`aria-setsize`
 * (StepButton.js:136-138) and only gets a `role="tablist"` parent in a Stepper's roving-tab
 * arrangement. Wrapping it in `createLink` therefore produces an `<a role="tab">` orphaned
 * from any tablist - which the axe gate caught as a CRITICAL `aria-required-parent`, and
 * which was a lie about the element besides: these are navigations, not tabs.
 *
 * `StepLabel` sets no role at all, so the anchor keeps its own semantics. Setup spans
 * sittings and gets handed between colleagues, so every chapter has to be openable in a new
 * tab, announced as a link, and present in a screen reader's link list.
 *
 * A chapter that is not yet reachable is a plain `StepLabel`, not a disabled link: a
 * disabled control is a dead end a keyboard user still has to tab through, and the reason
 * it is unreachable ("you need a consortium first") is already on the screen they are
 * looking at.
 *
 * <h2>How much is left, in words as well as in a bar</h2>
 *
 * The rail said where the user was and what was behind them, and never said how much was
 * left. "Five chapters, two behind you" is the thing somebody decides on when choosing
 * whether to start now, and it existed only as a count of ticks the reader had to make
 * themselves - or, on the home page, as a banner they had already navigated away from.
 *
 * The number is the answer and the bar is the illustration, not the other way round: a
 * determinate `LinearProgress` on its own conveys proportion by length and colour, which is
 * neither readable at a glance nor available to a screen reader beyond a bare percentage.
 * The bar is named by the sentence above it, so it is announced as "1 step left" rather
 * than "80%".
 *
 * <h2>What is left, not how many of how many</h2>
 *
 * It first said "0 of 5 steps done" - above a rail listing SIX chapters, because the
 * optional one is excluded from the denominator for a good reason (see
 * `consortiumSetup.ts`) that is invisible to anybody reading the two together. Once the
 * optional chapter ticked it got worse: a row marked Done beside a count of none done.
 *
 * A denominator was never the point. "3 steps left" is the number somebody deciding
 * whether to start now actually wants, it claims no total for the rail to contradict, and
 * it is the wording of the home-page banner they have already read. The bar still draws
 * the proportion; it just no longer has to defend a number.
 */
export default function SetupRail({ current, state }: SetupRailProps) {
	const { t } = useTranslation();

	// Annotated: TypeScript otherwise picks Box's div overload for component="nav" and
	// reports the aria-label as unknown rather than resolving the polymorphic props.
	const railLabel: string = t("setup.rail_label");

	const stepFor = (id: ConsortiumSetupStepId) =>
		state.steps.find((step) => step.id === id);

	// The chapters this deployment asks, so the rail, its numbers and the announced
	// total all come from one list. See consortiumSetupSteps.
	const chapters = consortiumSetupSteps();
	const activeIndex = chapters.indexOf(current);

	// Chapters seen during THIS pass. Only used to settle the optional one - the rest
	// report what the data says, which does not care whether anybody looked at it.
	const visited = useVisitedChapters();

	const { progress } = state;
	const progressId = useId();

	const progressSummary =
		progress.outstanding === 0
			? t("setup.progress.left_none")
			: t("setup.progress.left", { count: progress.outstanding });

	return (
		<Box
			component="nav"
			aria-label={railLabel}
			// Deliberately not sticky. A rail pinned to the viewport is the classic way a
			// focused control ends up underneath something (WCAG 2.4.11), and this one is
			// short enough not to need it.
			sx={{ minWidth: { md: 260 }, flexShrink: 0 }}
		>
			<Box sx={{ mb: 2 }}>
				<Typography
					id={progressId}
					variant="body2"
					sx={{ color: "text.secondary" }}
				>
					{progressSummary}
				</Typography>
				{/* A separate line rather than a clause, so neither string has to be glued
				    to the other with punctuation a translator cannot move. It appears only
				    when something was passed over - and it has to appear, because a skip
				    quietly reducing "what is left" is how a half-configured consortium
				    gets signed off as ready. */}
				{progress.skipped > 0 && (
					<Typography
						variant="caption"
						component="p"
						sx={{ color: "text.secondary" }}
					>
						{t("setup.progress.skipped", { count: progress.skipped })}
					</Typography>
				)}
				<LinearProgress
					variant="determinate"
					value={progress.percent}
					aria-labelledby={progressId}
					// A track this thin is decorative when it is the only signal; here the
					// sentence carries the meaning, so the bar is allowed to be quiet.
					sx={{ mt: 1, height: 6, borderRadius: 1 }}
				/>
			</Box>

			<Stepper
				nonLinear
				activeStep={activeIndex}
				orientation="vertical"
				sx={{
					// The connectors ARE the division between steps, so give them room to
					// read as one. Without this the rail is a stack of nearly-touching
					// rows and the eye finds no structure in it.
					"& .MuiStepConnector-line": { minHeight: 16 },
					"& .MuiStepLabel-root": { py: 1 },
				}}
			>
				{chapters.map((id) => {
					const step = stepFor(id);
					const isCurrent = id === current;

					// The state is on the icon, which is decorative, so it is also said in
					// words. "Done", "skipped" and "not started" are not colours.
					// Optional is checked FIRST. A chapter that writes nothing has no "done" to
					// report, and calling it "Not started" for the life of the deployment is a
					// nag about work that does not exist.
					// An optional chapter reads "Optional" until it has been seen and "Done"
					// afterwards. Passing through IS the whole of the work - there is nothing
					// to save - so a tick is the honest report of it, and it is per-run rather
					// than remembered, which is what stops a wiped deployment inheriting one.
					const settledOptional = step?.optional && visited.includes(id);

					const status = settledOptional
						? t("setup.status.done")
						: step?.optional
							? t("setup.status.optional")
							: step?.complete
								? t("setup.status.done")
								: step?.skipped
									? t("setup.status.skipped")
									: step?.available
										? t("setup.status.not_started")
										: t("setup.status.not_yet_available");

					const label = (
						<Typography
							component="span"
							// The current chapter is the one the page is showing, so it is
							// the one that should look loudest. Weight rather than colour:
							// colour alone is not a distinction (1.4.1) and this has to
							// hold in high contrast too.
							sx={{ fontWeight: isCurrent ? 700 : 400 }}
						>
							{t(SETUP_CHAPTERS[id].labelKey)}
						</Typography>
					);

					const optional = (
						<Typography
							component="span"
							variant="caption"
							sx={{ color: "text.secondary" }}
						>
							{status}
						</Typography>
					);

					return (
						<Step
							key={id}
							completed={(step?.complete ?? false) || !!settledOptional}
						>
							<StepLabel
								optional={optional}
								icon={
									<DCBStepIcon
										icon={chapters.indexOf(id) + 1}
										active={isCurrent}
										completed={(step?.complete ?? false) || !!settledOptional}
									/>
								}
							>
								{step?.available ? (
									<CustomLink
										to="/setup/$step"
										params={{ step: id }}
										underline="hover"
										// Fills the row so the hit area is the whole label rather than
										// the few words in it (WCAG 2.5.8).
										sx={{
											display: "block",
											py: 0.5,
											color: "primary.linkText",
										}}
									>
										{label}
									</CustomLink>
								) : (
									label
								)}
							</StepLabel>
						</Step>
					);
				})}
			</Stepper>
		</Box>
	);
}
