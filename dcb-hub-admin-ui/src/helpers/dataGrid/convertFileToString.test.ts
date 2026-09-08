import { describe, expect, it } from "vitest";
import { convertFileToString } from "./convertFileToString";

const TAB = "\t";

describe("convertFileToString", () => {
	it("reads already-flattened cells straight off the row", () => {
		// Regression: these fields were previously re-resolved against nested
		// source paths (requestingIdentity.localBarcode, suppliers[0].localItemType),
		// which blanked them because useGridExport hands over flat rows.
		const rows = [{ patronBarcode: "26060", localItemType: "BOOK" }];

		const output = convertFileToString(
			rows,
			TAB,
			["patronBarcode", "localItemType"],
			["Patron barcode", "Local item type"],
		);

		expect(output).toBe(
			["Patron barcode\tLocal item type", "26060\tBOOK"].join("\n"),
		);
	});

	it("maps singleSelect codes to their grid labels", () => {
		const output = convertFileToString(
			[{ supplyingAgencyCode: "ACAD" }],
			TAB,
			["supplyingAgencyCode"],
			["Supplying library"],
			{ supplyingAgencyCode: { ACAD: "Academy Library" } },
		);

		expect(output).toBe("Supplying library\nAcademy Library");
	});

	it("falls back to the raw value when no label matches", () => {
		const output = convertFileToString(
			[{ supplyingAgencyCode: "UNKNOWN" }],
			TAB,
			["supplyingAgencyCode"],
			["Supplying library"],
			{ supplyingAgencyCode: { ACAD: "Academy Library" } },
		);

		expect(output).toBe("Supplying library\nUNKNOWN");
	});

	it("emits empty cells for null and undefined", () => {
		const output = convertFileToString(
			[{ patronBarcode: null, localItemType: undefined }],
			TAB,
			["patronBarcode", "localItemType"],
			["Patron barcode", "Local item type"],
		);

		expect(output).toBe("Patron barcode\tLocal item type\n\t");
	});

	it("quotes and escapes values containing the delimiter or quotes", () => {
		const output = convertFileToString(
			[{ title: 'Cats, Dogs and "Friends"' }],
			",",
			["title"],
			["Title"],
		);

		expect(output).toBe('Title\n"Cats, Dogs and ""Friends"""');
	});

	it("leaves an already-formatted duration untouched", () => {
		// The column's valueGetter formats this; the serialiser must not re-format.
		const output = convertFileToString(
			[{ elapsedTimeInCurrentStatus: "02:04:15:30" }],
			TAB,
			["elapsedTimeInCurrentStatus"],
			["Time in state (days)"],
		);

		expect(output).toBe("Time in state (days)\n02:04:15:30");
	});
});
