import { formatDuration } from "../formatDuration";

// type for nested field paths
type SimpleField = string;
type NestedField = {
	field: string;
	path: string[];
	arrayHandler?: (value: any[]) => any;
};
type FieldPath = SimpleField | NestedField;

const isNestedField = (field: FieldPath): field is NestedField => {
	return typeof field === "object" && "path" in field;
};
// function to get value from nested path
const getNestedValue = (item: any, path: string[]): any => {
	return path.reduce((obj, key) => (obj ? obj[key] : undefined), item);
};

// Helper function to format cell value
const formatCellValue = (
	value: any,
	delimiter: string,
	field: string,
): string => {
	if (value === null || value === undefined) {
		return "";
	}
	const stringValue = value.toString();
	if (
		stringValue.includes(delimiter) ||
		stringValue.includes('"') ||
		stringValue.includes("\n")
	) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	if (field == "elapsedTimeInCurrentStatus") {
		return formatDuration(value);
	}
	return stringValue;
};
// Array handlers for cases like supplying agency where we need to get the first value in an array
const arrayHandlers = {
	firstItem: (arr: any[]) => (arr && arr.length > 0 ? arr[0] : undefined),
};

// Define field mappings for complex nested fields - add new ones here
const getFieldMapping = (field: string): FieldPath => {
	const fieldMappings: Record<string, FieldPath> = {
		agencyCode: { field: "agencyCode", path: ["agency", "code"] },
		clusterRecordTitle: {
			field: "clusterRecordTitle",
			path: ["clusterRecord", "title"],
		},
		patronBarcode: {
			field: "patronBarcode",
			path: ["requestingIdentity", "localBarcode"],
		},
		canonicalPtype: {
			field: "canonicalPtype",
			path: ["requestingIdentity", "canonicalPtype"],
		},
		supplyingAgencyCode: {
			field: "supplyingAgencyCode",
			path: ["suppliers"],
			arrayHandler: (suppliers) => {
				const firstSupplier = arrayHandlers.firstItem(suppliers);
				return firstSupplier?.localAgency;
			},
		},
		canonicalItemType: {
			field: "canonicalItemType",
			path: ["suppliers"],
			arrayHandler: (suppliers) => {
				const firstSupplier = arrayHandlers.firstItem(suppliers);
				return firstSupplier?.canonicalItemType;
			},
		},
		itemBarcode: {
			field: "itemBarcode",
			path: ["suppliers"],
			arrayHandler: (suppliers) => {
				const firstSupplier = arrayHandlers.firstItem(suppliers);
				return firstSupplier?.localItemBarcode;
			},
		},
		localItemType: {
			field: "localItemType",
			path: ["suppliers"],
			arrayHandler: (suppliers) => {
				const firstSupplier = arrayHandlers.firstItem(suppliers);
				return firstSupplier?.localItemType;
			},
		},
	};

	return fieldMappings[field] || field;
};

const getFieldValue = (item: any, fieldMapping: FieldPath): any => {
	if (!isNestedField(fieldMapping)) {
		return item[fieldMapping]; // For simple fields, no need to call the getNestedValue method
	}

	const nestedValue = getNestedValue(item, fieldMapping.path);

	if (fieldMapping.arrayHandler && Array.isArray(nestedValue)) {
		return fieldMapping.arrayHandler(nestedValue);
	}

	return nestedValue;
};

/**
 * Serialises server-fetched export rows to a delimited string. `fields` and
 * `headers` are aligned arrays derived from the grid's own columns (see
 * getExportColumns), so the column picker, the grid, and the file all agree.
 * Nested/derived source fields are resolved through the mapping registry above.
 */
export const convertFileToString = (
	data: any[],
	delimiter: string,
	fields: string[],
	headers: string[],
	// field -> (value -> label) for singleSelect columns; maps codes/UUIDs to the
	// same human labels the grid shows (see getValueLabelMaps).
	valueLabelMaps: Record<string, Record<string, string>> = {},
) => {
	const headerRow = headers.join(delimiter);

	const rows = data.map((item: any) =>
		fields
			.map((field: string) => {
				const fieldMapping = getFieldMapping(field);
				const rawValue = getFieldValue(item, fieldMapping);
				const labelMap = valueLabelMaps[field];
				const value =
					labelMap && rawValue != null
						? (labelMap[String(rawValue)] ?? rawValue)
						: rawValue;
				return formatCellValue(value, delimiter, field);
			})
			.join(delimiter),
	);

	return [headerRow, ...rows].join("\n");
};
