import { GridValidRowModel } from "@mui/x-data-grid-pro";
// For the validation of row edits in the data grids.
export const validateRow = (
	newRow: GridValidRowModel,
	oldRow: GridValidRowModel,
	editableColumns: any,
): string | null => {
	for (const column of editableColumns) {
		const newValue = newRow[column.field];
		const oldValue = oldRow[column.field];

		// Only validate if the value has changed
		if (newValue !== oldValue) {
			switch (column.type) {
				case "string":
					if (typeof newValue === "string" && newValue.trim() === "") {
						// return `${fieldName} cannot be empty`;
						return "ui.data_grid.validation.no_empty";
					}
					break;
				case "number":
					if (typeof newValue !== "number" || isNaN(newValue)) {
						// return `${fieldName} must be a valid number`;
						return "ui.data_grid.validation.number";
					}
					break;
				default:
					if (newValue === null || newValue === undefined) {
						return "ui.data_grid.validation.required";
					}
			}

			// Add custom validation rules if needed
			if (column.field === "email" && typeof newValue === "string") {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(newValue)) {
					return "ui.data_grid.validation.email";
				}
			}
		}
	}

	return null;
};
