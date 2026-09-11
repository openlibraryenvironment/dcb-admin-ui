import { describe, expect, it } from "vitest";
import {
	serialiseExportHeader,
	serialiseExportRows,
} from "./serialiseExportRows";

const TAB = "\t";

describe("serialiseExportRows", () => {
	it("reads already-flattened cells straight off the row", () => {
		// Regression: these fields were previously re-resolved against nested
		// source paths (requestingIdentity.localBarcode, suppliers[0].localItemType),
		// which blanked them because useGridExport hands over flat rows.
		const rows = [{ patronBarcode: "26060", localItemType: "BOOK" }];

		expect(
			serialiseExportRows(rows, TAB, ["patronBarcode", "localItemType"]),
		).toEqual(["26060\tBOOK"]);
	});

	it("maps singleSelect codes to their grid labels", () => {
		const output = serialiseExportRows(
			[{ supplyingAgencyCode: "ACAD" }],
			TAB,
			["supplyingAgencyCode"],
			{ supplyingAgencyCode: { ACAD: "Academy Library" } },
		);

		expect(output).toEqual(["Academy Library"]);
	});

	it("falls back to the raw value when no label matches", () => {
		const output = serialiseExportRows(
			[{ supplyingAgencyCode: "UNKNOWN" }],
			TAB,
			["supplyingAgencyCode"],
			{ supplyingAgencyCode: { ACAD: "Academy Library" } },
		);

		expect(output).toEqual(["UNKNOWN"]);
	});

	it("emits empty cells for null and undefined", () => {
		const output = serialiseExportRows(
			[{ patronBarcode: null, localItemType: undefined }],
			TAB,
			["patronBarcode", "localItemType"],
		);

		expect(output).toEqual(["\t"]);
	});

	it("quotes and escapes values containing the delimiter or quotes", () => {
		const output = serialiseExportRows(
			[{ title: 'Cats, Dogs and "Friends"' }],
			",",
			["title"],
		);

		expect(output).toEqual(['"Cats, Dogs and ""Friends"""']);
	});

	it("leaves an already-formatted duration untouched", () => {
		// The column's valueGetter formats this; the serialiser must not re-format.
		const output = serialiseExportRows(
			[{ elapsedTimeInCurrentStatus: "02:04:15:30" }],
			TAB,
			["elapsedTimeInCurrentStatus"],
		);

		expect(output).toEqual(["02:04:15:30"]);
	});

	it("returns one string per row, so pages can be serialised as they arrive", () => {
		const output = serialiseExportRows(
			[{ id: "a" }, { id: "b" }, { id: "c" }],
			TAB,
			["id"],
		);

		expect(output).toEqual(["a", "b", "c"]);
	});
});

describe("serialiseExportHeader", () => {
	it("joins the headers with the delimiter", () => {
		expect(
			serialiseExportHeader(["Patron barcode", "Local item type"], TAB),
		).toBe("Patron barcode\tLocal item type");
	});
});
