import { GridValidRowModel } from "@mui/x-data-grid-pro";
type ValidationResult = {
	field: string;
	translationKey: string;
};
// For the validation of row edits in the data grids.
export const validateRow = (
	newRow: GridValidRowModel,
	oldRow: GridValidRowModel,
	editableColumns: any,
): ValidationResult | null => {
	// For debugging purposes. Commented out by default
	// console.log("New Row:", JSON.stringify(newRow, null, 2));
	// console.log("Old Row:", JSON.stringify(oldRow, null, 2));
	// Special handling for "name" column which is actually two fields
	const oldFirstName = oldRow.firstName;
	const newFirstName = newRow.firstName;
	const oldLastName = oldRow.lastName;
	const newLastName = newRow.lastName;
	// The name fields are presented as one column, but for validation purposes need to be evaluated separately.
	// Otherwise we don't pick them up for validation
	if (newFirstName != oldFirstName || newLastName != oldLastName) {
		// Will only trigger "empty" validation if both are empty: as some people can go by a mononym
		if (
			typeof newFirstName === "string" &&
			newFirstName.trim() === "" &&
			typeof newLastName === "string" &&
			newLastName.trim() === ""
		) {
			return {
				field: "name",
				translationKey: "ui.data_grid.validation.no_empty",
			};
		}
	}
	for (const column of editableColumns) {
		const newValue = newRow[column.field];
		const oldValue = oldRow[column.field];
		if (column.field === "role") {
			// Compare role names instead of entire objects
			const newRoleName = newValue?.name;
			const oldRoleName = oldValue?.name;
			if (newRoleName !== oldRoleName) {
				// Perform any specific role validation if needed
				if (!newRoleName) {
					return {
						field: column.field,
						translationKey: "ui.data_grid.validation.required",
					};
				}
			}
		}
		// Only validate if the value has changed
		if (newValue !== oldValue) {
			switch (column.type) {
				case "string":
					if (typeof newValue === "string" && newValue.trim() === "") {
						return {
							field: column.field,
							translationKey: "ui.data_grid.validation.no_empty",
						};
					}
					break;
				case "number":
					if (typeof newValue !== "number" || isNaN(newValue)) {
						return {
							field: column.field,
							translationKey: "ui.data_grid.validation.number",
						};
					}
					break;
				default:
					if (newValue === null || newValue === undefined) {
						return {
							field: column.field,
							translationKey: "ui.data_grid.validation.required",
						};
					}
			}

			// Add custom validation rules as needed
			if (column.field === "email" && typeof newValue === "string") {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(newValue)) {
					return {
						field: column.field,
						translationKey: "ui.data_grid.validation.email",
					};
				}
			}
		}
	}

	return null;
};
