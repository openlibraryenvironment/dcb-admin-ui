/**
 * What to tell the user while a page action is in flight, and what it changed when it
 * settles.
 *
 * A pure function, for the reason @helpers/actions/entityMutationLogic gives: this
 * project's Vitest has no DOM, and the decision worth testing is which message wins, not
 * how it is rendered. Strings arrive already translated, so nothing here knows about i18n.
 */
export interface RunningAction {
	/** True while this action's request is outstanding. */
	running: boolean;
	/** What to say about it, translated. */
	message: string;
}

/**
 * The message for the first running action, or null when none is.
 *
 * First, not "the" one: the three actions on a patron request are mutually exclusive by
 * the menu that launches them, and a caller that manages to run two is told about the one
 * it declared first rather than silently about neither.
 */
export const actionProgressMessage = (
	actions: readonly RunningAction[],
	slowMessage?: string | null,
): string | null => {
	const running = actions.find((action) => action.running);
	if (!running) return null;
	return slowMessage ? `${running.message} — ${slowMessage}` : running.message;
};

/**
 * How long an action runs before we say something further about it.
 *
 * `/patrons/requests/{id}/update` polls the supplying library's LMS, and a guarded clean
 * up posts that endpoint and then the cleanup, so the wait is two third-party round trips
 * to systems we do not own. Ten seconds is long enough not to fire on a healthy request
 * and short enough to answer "is this stuck?" before the user reaches for the back button.
 */
export const SLOW_ACTION_MS = 10_000;

/**
 * What a settled action did to the request's status.
 *
 * Three answers, and `unchanged` is the one that earns this its place: the ordinary
 * outcome of checking for updates is that nothing moved, and a bare "Check complete" left
 * the user re-reading the page to work out whether that was the case. `unknown` claims
 * nothing - a status missing from either side is not evidence that it held.
 */
export type StatusChange =
	| { kind: "changed"; from: string; to: string }
	| { kind: "unchanged"; status: string }
	| { kind: "unknown" };

export const statusChange = (
	before: string | null | undefined,
	after: string | null | undefined,
): StatusChange => {
	if (!before || !after) return { kind: "unknown" };
	return before === after
		? { kind: "unchanged", status: after }
		: { kind: "changed", from: before, to: after };
};
