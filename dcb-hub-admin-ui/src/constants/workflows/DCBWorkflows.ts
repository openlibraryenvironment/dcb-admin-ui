// The various workflows
export enum Workflow {
	STANDARD = "RET-STD",
	WALK_UP = "RET-EXP",
	PICKUP_ANYWHERE = "RET-PUA",
	LOCAL = "RET-LOCAL",
}

/** The i18n key for a workflow code: RET-PUA -> workflows.RET-PUA ("Pickup anywhere"). */
export const workflowTranslationKey = (workflow: string): string =>
	`workflows.${workflow}`;

/**
 * Renders a workflow code for humans, falling back to the raw code so a workflow
 * the UI does not know yet shows "RET-NEW" rather than a bare translation key.
 */
export const translateWorkflow = (
	t: (key: string, options?: any) => string,
	workflow?: string | null,
): string =>
	workflow
		? t(workflowTranslationKey(workflow), { defaultValue: workflow })
		: "";

/**
 * Options list for workflow drop-downs and singleSelect grid columns.
 *
 * Takes `t` rather than reaching for the i18n singleton: only en-GB is bundled
 * synchronously (other languages load over HTTP - see i18n.ts), so building this
 * list at module scope froze every label to whatever happened to be loaded at
 * import time and left it in English after a language change. Call it from a
 * hook with the live `t` so the options re-translate with the rest of the UI.
 */
export const getDcbWorkflowOptions = (
	t: (key: string, options?: any) => string,
): Array<{ value: string; label: string }> =>
	Object.values(Workflow).map((value) => ({
		value,
		label: translateWorkflow(t, value),
	}));
