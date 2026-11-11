import { GridColumnVisibilityModel } from "@mui/x-data-grid-premium";

export const defaultClusterExplanationVisibility: GridColumnVisibilityModel = {
	// The grouping column carries it, with the number of events
	subjectId: false,
	formattedTimestamp: false,
	matchedBibId: false,
	message: false,
};
