import i18n from "@/i18n";

// The various workflows
export enum Workflow {
	STANDARD = "RET-STD",
	WALK_UP = "RET-EXP",
	PICKUP_ANYWHERE = "RET-PUA",
	LOCAL = "RET-LOCAL",
}

// Generate the options list for our drop downs
export const dcbWorkflowOptions = Object.values(Workflow).map((value) => {
	const translationKey = `workflows.${value}`;

	return {
		value: value,
		label: i18n.t(translationKey),
	};
});
