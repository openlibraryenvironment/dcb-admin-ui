// Top-level patron request queries
export const queries = {
	exception: `status: "ERROR"`,
	outOfSequence: `outOfSequenceFlag:true AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status:"CANCELLED" AND NOT status:"FINALISED" AND NOT status:"COMPLETED" AND NOT status:"HANDED_OFF_AS_LOCAL"`,
	inProgress: `outOfSequenceFlag:false AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED"`,
	finished: `(status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" OR status: "CANCELLED" OR status: "FINALISED" OR status:"COMPLETED" OR status: "HANDED_OFF_AS_LOCAL")`,
};
