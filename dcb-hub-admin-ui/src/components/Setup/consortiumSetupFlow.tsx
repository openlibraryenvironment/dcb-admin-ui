import { CustomLink } from "@components/CustomLink/CustomLink";
import {
	consortiumSetupSteps,
	type ConsortiumSetupState,
} from "@helpers/consortiumSetup";
import { SETUP_CHAPTERS } from "./setupChapters";
import { railLinkSx, type SetupFlow } from "./setupFlow";

/** The consortium's chapters as the setup frame draws them. */
export const consortiumSetupFlow = (
	state: ConsortiumSetupState,
): SetupFlow => ({
	steps: consortiumSetupSteps().map((id) => {
		const step = state.steps.find((candidate) => candidate.id === id);
		return {
			id,
			...SETUP_CHAPTERS[id],
			complete: step?.complete ?? false,
			available: step?.available ?? false,
			skipped: step?.skipped,
			optional: step?.optional,
		};
	}),
	progress: state.progress,
	pageTitleKey: "setup.page_title",
	renderLink: (stepId, label) => (
		// Fills the row so the hit area is the whole label (WCAG 2.5.8)
		<CustomLink
			to="/setup/$step"
			params={{ step: stepId }}
			underline="hover"
			sx={railLinkSx}
		>
			{label}
		</CustomLink>
	),
});
