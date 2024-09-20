import { GridRowModel } from "@mui/x-data-grid-pro";
import { formatChangedFields } from "./formatChangedFields";

export function computeMutation(newRow: GridRowModel, oldRow: GridRowModel) {
	const changedFields: Partial<GridRowModel> = {};
	const originalFields: Partial<GridRowModel> = {};

	Object.keys(newRow).forEach((key) => {
		if (newRow[key] !== oldRow[key]) {
			changedFields[key] = newRow[key];
			originalFields[key] = oldRow[key];
		}
	});

	if (Object.keys(changedFields).length > 0) {
		return formatChangedFields(changedFields, originalFields);
	}
	return null;
}
