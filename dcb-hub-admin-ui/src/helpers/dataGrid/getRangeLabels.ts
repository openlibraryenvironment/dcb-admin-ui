export function getRangeLabels(field: string) {
	switch (field) {
		case "elapsedTimeInCurrentStatus":
			return {
				from: "ui.data_grid.filters.days_from",
				to: "ui.data_grid.filters.days_to",
			};
		default:
			return {
				from: "ui.data_grid.filters.from",
				to: "ui.data_grid.filters.to",
			};
	}
}

export function getRangePlaceholders(field: string) {
	switch (field) {
		case "elapsedTimeInCurrentStatus":
			return {
				from: "",
				to: "",
			};
		default:
			return {
				from: "",
				to: "",
			};
	}
}
