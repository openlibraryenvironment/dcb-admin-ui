import { GridColumnVisibilityModel } from "@mui/x-data-grid-premium";

/** What identifies an item at the library holding it: there when looked for, not by default. */
export const itemColumnVisibility: GridColumnVisibilityModel = {
	barcode: false,
	location: false,
	callNumber: false,
	localItemType: false,
	hostLmsCode: false,
};
