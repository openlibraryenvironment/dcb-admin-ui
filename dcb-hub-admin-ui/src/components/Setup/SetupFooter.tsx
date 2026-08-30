import { useTranslation } from "react-i18next";
import { Button, CircularProgress, Divider, Stack } from "@mui/material";

interface SetupFooterProps {
	/** Omitted on the first chapter, where there is nowhere to go back to. */
	onBack?: () => void;
	onContinue: () => void;
	/** Overrides "Continue" - the last chapter says "Finish", saves say "Save and continue". */
	continueLabel?: string;
	continueDisabled?: boolean;
	/** Shown while a chapter is writing. Also disables continue, so it cannot double-submit. */
	busy?: boolean;
	/** Omitted where a chapter cannot be skipped (the consortium record). */
	onSkip?: () => void;
	skipLabel?: string;
}

/**
 * The one place a chapter is moved on from — W-4.
 *
 * Skip is a real button beside Continue, not a link in the corner. "I'll do this later"
 * being a first-class, obvious action is what stops a setup flow becoming something people
 * abandon halfway and never return to: the alternative is a user who cannot answer one
 * question closing the tab.
 *
 * Order is Back, then Skip, then Continue: the primary action is last in the DOM and last
 * in the tab order, which is where a keyboard user expects to arrive after reading the
 * chapter.
 */
export default function SetupFooter({
	onBack,
	onContinue,
	continueLabel,
	continueDisabled,
	busy,
	onSkip,
	skipLabel,
}: SetupFooterProps) {
	const { t } = useTranslation();

	return (
		<>
			<Divider sx={{ mt: 4 }} />
			<Stack
				direction={{ xs: "column-reverse", sm: "row" }}
				spacing={2}
				sx={{ mt: 3, justifyContent: "flex-end" }}
			>
				{onBack && (
					<Button onClick={onBack} disabled={busy} variant="outlined">
						{t("setup.actions.back")}
					</Button>
				)}
				{onSkip && (
					<Button onClick={onSkip} disabled={busy} variant="outlined">
						{skipLabel ?? t("setup.actions.skip")}
					</Button>
				)}
				<Button
					onClick={onContinue}
					disabled={busy || continueDisabled}
					variant="contained"
					// A spinner alone says "wait"; it does not say what for. The label
					// stays put and the spinner sits beside it.
					startIcon={
						busy ? <CircularProgress size={16} color="inherit" /> : undefined
					}
				>
					{continueLabel ?? t("setup.actions.continue")}
				</Button>
			</Stack>
		</>
	);
}
