/**
 * How long an alert stays up.
 *
 * Errors do not time out. A success message is a courtesy and can fade, but an
 * error is the only account the user gets of why their work did not save -
 * often several lines of it from the server - and a countdown they did not ask
 * for can take it away mid-sentence. It is also WCAG 2.2.1: content that
 * disappears on a timer the user cannot control.
 *
 * Separate from the component so the rule can be tested without a DOM.
 */
export const resolveAutoHideDuration = (
	severity: string | undefined,
	requested: number | null | undefined,
): number | null => {
	if (severity === "error") return null;
	return requested ?? null;
};

/** Errors are announced immediately; anything else is a polite status update. */
export const alertRole = (severity: string | undefined): "alert" | "status" =>
	severity === "error" ? "alert" : "status";

/**
 * A stray click elsewhere must not discard an error the user has not read.
 * Successes may still be dismissed that way.
 */
export const shouldCloseOnReason = (
	severity: string | undefined,
	reason: string | undefined,
): boolean => !(severity === "error" && reason === "clickaway");
