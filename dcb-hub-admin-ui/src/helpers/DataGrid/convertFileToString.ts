import { getFieldsForExport } from "./getFieldsForExport";
import { getHeadersForExport } from "./getHeadersForExport";

export const convertFileToString = (
	data: any,
	delimiter: any,
	coreType: string,
) => {
	const formattedHeaders = getHeadersForExport(coreType);
	const fieldsForExport = getFieldsForExport(coreType);

	const headerRow = formattedHeaders.join(delimiter);

	const rows = data.map((item: any) =>
		fieldsForExport
			.map((field: string | number) => {
				if (field == "agencyCode") {
					let cell = item.agency.code;
					if (cell === null || cell === undefined) {
						return "";
					}
					cell = cell.toString();
					if (
						cell.includes(delimiter) ||
						cell.includes('"') ||
						cell.includes("\n")
					) {
						return `"${cell.replace(/"/g, '""')}"`;
					}
					return cell;
				} else {
					let cell = item[field];
					if (cell === null || cell === undefined) {
						return "";
					}
					cell = cell.toString();
					if (
						cell.includes(delimiter) ||
						cell.includes('"') ||
						cell.includes("\n")
					) {
						return `"${cell.replace(/"/g, '""')}"`;
					}
					return cell;
				}
			})
			.join(delimiter),
	);

	return [headerRow, ...rows].join("\n");
};
