export const getInitialAccordionState = (
	initialExpanded: number,
	total: number,
) => {
	return Array.from({ length: total }, (_, index) => index < initialExpanded);
};
