import type { ReactNode } from "react";

/** One chapter as the setup frame draws it, whichever flow it belongs to. */
export interface SetupFlowStep {
	id: string;
	/** Short label, for the progress rail and the finish list. */
	labelKey: string;
	/** The question, as the page heading. */
	titleKey: string;
	/** One sentence under it saying why we are asking. */
	subtitleKey: string;
	complete: boolean;
	available: boolean;
	skipped?: boolean;
	optional?: boolean;
}

export interface SetupFlowProgress {
	outstanding: number;
	skipped: number;
	percent: number;
}

/**
 * What SetupLayout and SetupRail draw. Each flow owns its route, so it renders the link to
 * one of its chapters - typed against that route - and the rail supplies the label.
 */
export interface SetupFlow {
	/** The chapters this deployment asks, in order. */
	steps: SetupFlowStep[];
	progress: SetupFlowProgress;
	pageTitleKey: string;
	renderLink: (stepId: string, label: ReactNode) => ReactNode;
}

/** The rail's link styling, so every flow's links look the same. */
export const railLinkSx = {
	display: "block",
	py: 0.5,
	color: "primary.linkText",
} as const;
