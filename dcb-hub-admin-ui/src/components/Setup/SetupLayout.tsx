import { PropsWithChildren, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Stack,
	Typography,
} from "@mui/material";
import { useBlocker } from "@tanstack/react-router";
import SetupRunProvider from "./SetupRunProvider";
import { useSetupDirty } from "./setupRun";

import PageContainer from "@layout/PageContainer/PageContainer";
import SetupRail from "./SetupRail";
import { SETUP_CHAPTERS } from "./setupChapters";
import {
	CONSORTIUM_SETUP_STEPS,
	stepNumber,
	type ConsortiumSetupState,
	type ConsortiumSetupStepId,
} from "@helpers/consortiumSetup";

interface SetupLayoutProps {
	step: ConsortiumSetupStepId;
	state: ConsortiumSetupState;
}

/**
 * The frame every chapter is rendered in — W-4.
 *
 * Two things here are not decoration:
 *
 *  1. **Focus moves to the heading on every chapter change.** A SPA navigation leaves
 *     focus wherever the last click left it, so without this a keyboard or screen-reader
 *     user presses Continue and is still standing on a button that no longer exists,
 *     three chapters' worth of content above where they now are. The heading takes
 *     `tabIndex={-1}` so it can be focused programmatically without becoming a tab stop.
 *
 *  2. **The move is announced.** The heading being focused reads the heading; it does not
 *     say where in the flow the user now is. "Step 3 of 6" is information that exists only
 *     as position in the rail, i.e. only visually, so it is put in a live region as well.
 */
function SetupLayoutInner({
	step,
	state,
	children,
}: PropsWithChildren<SetupLayoutProps>) {
	const { t } = useTranslation();
	const headingRef = useRef<HTMLHeadingElement>(null);
	const isDirty = useSetupDirty();


	const chapter = SETUP_CHAPTERS[step];
	const announcement = t("setup.announcement", {
		number: stepNumber(step),
		total: CONSORTIUM_SETUP_STEPS.length,
		title: t(chapter.labelKey),
	});

	useEffect(() => {
		headingRef.current?.focus();
	}, [step]);

	// Leaving a chapter mid-edit throws the edits away, and the rail invites exactly that:
	// six links, one click each, no warning. `withResolver` hands back proceed/reset so the
	// decision is a real dialog rather than the browser's own confirm(), which cannot be
	// styled, translated or made accessible.
	//
	// `enableBeforeUnload` covers the other half - a closed tab or a typed URL, which no
	// router can intercept. The browser shows its own generic wording there; that is the
	// price of the only hook that works at all outside the SPA.
	const blocker = useBlocker({
		shouldBlockFn: () => isDirty,
		enableBeforeUnload: () => isDirty,
		withResolver: true,
	});

	return (
		<PageContainer title={t("setup.page_title")} hideTitleBox hideBreadcrumbs>
			{/* Polite, and keyed on the step so the text genuinely changes between
			    chapters - an identical string rewritten into a live region is not
			    re-announced by most screen readers. */}
			<Box
				key={step}
				aria-live="polite"
				aria-atomic="true"
				sx={{
					position: "absolute",
					width: 1,
					height: 1,
					overflow: "hidden",
					clip: "rect(0 0 0 0)",
					whiteSpace: "nowrap",
				}}
			>
				{announcement}
			</Box>

			<Stack
				direction={{ xs: "column", md: "row" }}
				spacing={4}
				sx={{ alignItems: "flex-start" }}
			>
				<SetupRail current={step} state={state} />

				<Box sx={{ flexGrow: 1, maxWidth: 780, width: "100%" }}>
					<Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
						{t("setup.step_of", {
							number: stepNumber(step),
							total: CONSORTIUM_SETUP_STEPS.length,
						})}
					</Typography>
					<Typography
						variant="h1"
						component="h1"
						ref={headingRef}
						tabIndex={-1}
						// The heading is focused on navigation, so it gets a focus ring
						// like anything else that can hold focus. Suppressing it would
						// leave a sighted keyboard user with no idea where they landed.
						sx={{ outlineOffset: 4, mb: 1 }}
					>
						{t(chapter.titleKey)}
					</Typography>
					<Typography sx={{ color: "text.secondary", mb: 3 }}>
						{t(chapter.subtitleKey)}
					</Typography>

					{children}
				</Box>
			</Stack>

			{/* Not a Confirmation: this asks about work in progress, not a destructive
			    action on a named entity, and it needs its own wording. */}
			<Dialog
				open={blocker.status === "blocked"}
				onClose={() => blocker.status === "blocked" && blocker.reset()}
				aria-labelledby="setup-unsaved-title"
			>
				<DialogTitle id="setup-unsaved-title">
					{t("setup.unsaved.title")}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>{t("setup.unsaved.body")}</DialogContentText>
				</DialogContent>
				<DialogActions>
					{/* Safe action FIRST, against the usual primary-last order. This dialog
					    guards work in progress, so the first control a keyboard user reaches
					    should be the one that keeps it. autoFocus would say the same thing and
					    is banned for good reason - it moves focus without being asked - so the
					    DOM order carries it instead. */}
					<Button
						variant="contained"
						onClick={() => blocker.status === "blocked" && blocker.reset()}
					>
						{t("setup.unsaved.stay")}
					</Button>
					<Button
						onClick={() => blocker.status === "blocked" && blocker.proceed()}
					>
						{t("setup.unsaved.leave")}
					</Button>
				</DialogActions>
			</Dialog>
		</PageContainer>
	);
}

/**
 * The provider has to sit ABOVE the component that reads it, so the layout is split in
 * two: this wrapper provides, the inner one consumes. A single component calling both
 * would read the context it declares, which React resolves to the DEFAULT value - so the
 * blocker would see isDirty false forever and never block anything.
 */
export default function SetupLayout(props: PropsWithChildren<SetupLayoutProps>) {
	return (
		<SetupRunProvider>
			<SetupLayoutInner {...props} />
		</SetupRunProvider>
	);
}
