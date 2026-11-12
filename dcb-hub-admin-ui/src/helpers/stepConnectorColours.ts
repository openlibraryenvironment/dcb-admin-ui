import type { Theme } from "@mui/material/styles";

/**
 * A stepper connector's line colours. Each one shows state, so each is a graphical object
 * held to 3:1 against the page (WCAG 1.4.11) by openRS.contrast.test.ts.
 */
export const stepConnectorColours = (theme: Theme) => ({
	reached: theme.palette.success.main,
	notReached: theme.palette.text.secondary,
	failed: theme.palette.error.main,
});
