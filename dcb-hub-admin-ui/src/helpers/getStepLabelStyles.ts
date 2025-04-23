export const getStepColors = (
	isActive: boolean,
	hasError: boolean,
	isCompleted: boolean,
): "success.main" | "error.main" | "primary" | "secondary" | "" => {
	if (isActive && !hasError) return "success.main";
	if (hasError) return "error.main";
	if (isCompleted) return "success.main";
	else return "";
};

export const getStepLabelFontWeight = (isActive: boolean) => {
	if (isActive) {
		return "bold";
	}
};
