import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useSetupStore } from "@hooks/useSetupStore";
import { useSetupRunActions } from "@components/Setup/setupRun";
import {
	nextStep,
	previousStep,
	type ConsortiumSetupStepId,
} from "@helpers/consortiumSetup";

/**
 * Moving between chapters — W-4.
 *
 * Every navigation out of a chapter goes through here so that "record where they got to"
 * cannot be forgotten at one call site, and so that no chapter builds a URL by hand: the
 * typed `to` + `params` pair is what keeps the router's type safety honest and stops a
 * renamed chapter rotting silently into a 404.
 */
export function useSetupNavigation(current: ConsortiumSetupStepId) {
	const navigate = useNavigate();
	const skip = useSetupStore((s) => s.skip);
	const unskip = useSetupStore((s) => s.unskip);
	const setLastVisited = useSetupStore((s) => s.setLastVisited);
	const { markVisited } = useSetupRunActions();

	const goTo = useCallback(
		(step: ConsortiumSetupStepId | undefined) => {
			if (!step) {
				navigate({ to: "/setup/done" });
				return;
			}
			setLastVisited(step);
			navigate({ to: "/setup/$step", params: { step } });
		},
		[navigate, setLastVisited],
	);

	return {
		/**
		 * Answering a chapter clears any skip it carried. Without this, going back to
		 * a chapter that was skipped and filling it in properly would leave the finish
		 * screen still reporting it as passed over.
		 */
		goNext: useCallback(() => {
			unskip(current);
			// Marked on the way OUT, not on arrival. Landing on a chapter is not the same
			// as having dealt with it, and a rail that ticks the moment you look at
			// something is reporting your attention rather than your decision. It only
			// matters for the optional chapter, which has no other way to settle.
			markVisited(current);
			goTo(nextStep(current));
		}, [current, goTo, unskip, markVisited]),

		goBack: useCallback(() => {
			const previous = previousStep(current);
			if (previous) goTo(previous);
		}, [current, goTo]),

		skipAndContinue: useCallback(() => {
			skip(current);
			markVisited(current);
			goTo(nextStep(current));
		}, [current, goTo, skip, markVisited]),
	};
}
