import { describe, expect, it } from "vitest";

import {
	buildImportTemplate,
	detectDelimiter,
	parseLibraryImport,
	splitDelimitedLine,
	summariseImport,
	type EvaluateOptions,
} from "@helpers/libraryImport";
import { LIBRARY_IMPORT_COLUMNS } from "@constants/libraryImport";

const messages: EvaluateOptions["messages"] = {
	requiredMissing: (column) => `missing:${column}`,
	notANumber: (column) => `nan:${column}`,
	unknownHostLms: (code) => `unknownHostLms:${code}`,
	duplicateAgencyCode: (code) => `duplicate:${code}`,
	latitudeRange: "latitudeRange",
	longitudeRange: "longitudeRange",
	emailInvalid: (column) => `email:${column}`,
};

const options = (
	overrides: Partial<EvaluateOptions> = {},
): EvaluateOptions => ({
	knownHostLmsCodes: ["SIERRA-A", "FOLIO-B"],
	existingLibraries: [],
	messages,
	...overrides,
});

const HEADERS =
	"agencyCode,fullName,shortName,abbreviatedName,address,type,hostLmsCode,longitude,latitude,contact1Email";

const row = (values: Partial<Record<string, string>> = {}): string => {
	const defaults: Record<string, string> = {
		agencyCode: "ALPHA",
		fullName: "Alpha Library",
		shortName: "Alpha",
		abbreviatedName: "AL",
		address: "1 Alpha Street",
		type: "Academic",
		hostLmsCode: "SIERRA-A",
		longitude: "-1.5",
		latitude: "53.4",
		contact1Email: "alpha@example.invalid",
	};
	const merged = { ...defaults, ...values };
	return HEADERS.split(",")
		.map((key) => merged[key] ?? "")
		.join(",");
};

describe("splitDelimitedLine", () => {
	it("keeps a comma that is inside quotes", () => {
		// Library addresses contain commas roughly always; a naive split corrupts the
		// first real file anybody uploads.
		expect(splitDelimitedLine('a,"1 High Street, Exampleton",c', ",")).toEqual([
			"a",
			"1 High Street, Exampleton",
			"c",
		]);
	});

	it("reads a doubled quote as one literal quote", () => {
		expect(splitDelimitedLine('"The ""Old"" Library",x', ",")).toEqual([
			'The "Old" Library',
			"x",
		]);
	});

	it("keeps empty fields in place", () => {
		// A blank column must not shift every later value one to the left.
		expect(splitDelimitedLine("a,,c", ",")).toEqual(["a", "", "c"]);
	});
});

describe("detectDelimiter", () => {
	it("prefers tabs when the header has more of them", () => {
		// A "CSV" exported in a tab-separated locale is a real and common file, and the
		// extension is the least reliable thing about an upload.
		expect(detectDelimiter("a\tb\tc")).toBe("\t");
		expect(detectDelimiter("a,b,c")).toBe(",");
	});
});

describe("parseLibraryImport", () => {
	it("accepts a good row as a create, selected by default", () => {
		const { rows } = parseLibraryImport(`${HEADERS}\n${row()}`, options());

		expect(rows).toHaveLength(1);
		expect(rows[0].verdict).toBe("create");
		expect(rows[0].problems).toEqual([]);
		expect(rows[0].selected).toBe(true);
	});

	it("numbers rows the way the user's spreadsheet does", () => {
		const { rows } = parseLibraryImport(
			`${HEADERS}\n${row()}\n${row({ agencyCode: "BETA" })}`,
			options(),
		);

		// Line 1 is the header, so the first data row is line 2.
		expect(rows.map((r) => r.line)).toEqual([2, 3]);
	});

	it("rejects a row missing a required value, and says which", () => {
		const { rows } = parseLibraryImport(
			`${HEADERS}\n${row({ agencyCode: "" })}`,
			options(),
		);

		expect(rows[0].verdict).toBe("reject");
		expect(rows[0].problems).toContain("missing:agencyCode");
	});

	it("rejects an unknown Host LMS code rather than inventing one", () => {
		// The empty-hostLmsCode defect the New Library wizard shipped once: a library
		// with no real Host LMS exists, cannot be requested from, and says nothing.
		const { rows } = parseLibraryImport(
			`${HEADERS}\n${row({ hostLmsCode: "NOT-A-SYSTEM" })}`,
			options(),
		);

		expect(rows[0].verdict).toBe("reject");
		expect(rows[0].problems).toContain("unknownHostLms:NOT-A-SYSTEM");
	});

	it("flags a row matching an existing library as an update, deselected", () => {
		const { rows } = parseLibraryImport(
			`${HEADERS}\n${row({ agencyCode: "ALPHA" })}`,
			options({
				existingLibraries: [{ id: "lib-1", agencyCode: "alpha" }],
			}),
		);

		expect(rows[0].verdict).toBe("update");
		expect(rows[0].existingId).toBe("lib-1");
		// The whole point of the decision: re-uploading a file by mistake must change
		// nothing until somebody ticks a box.
		expect(rows[0].selected).toBe(false);
	});

	it("rejects the second of two rows carrying the same agency code", () => {
		const { rows } = parseLibraryImport(
			`${HEADERS}\n${row()}\n${row()}`,
			options(),
		);

		expect(rows[0].verdict).toBe("create");
		expect(rows[1].verdict).toBe("reject");
		expect(rows[1].problems).toContain("duplicate:ALPHA");
	});

	it("rejects a coordinate that is a number but not a place", () => {
		const { rows } = parseLibraryImport(
			`${HEADERS}\n${row({ latitude: "530" })}`,
			options(),
		);

		expect(rows[0].problems).toContain("latitudeRange");
	});

	it("rejects a coordinate that is not a number at all", () => {
		const { rows } = parseLibraryImport(
			`${HEADERS}\n${row({ longitude: "west" })}`,
			options(),
		);

		expect(rows[0].problems).toContain("nan:longitude");
	});

	it("reports a required column the file does not have at all", () => {
		const headers = "agencyCode,fullName";
		const { missingHeaders, rows } = parseLibraryImport(
			`${headers}\nALPHA,Alpha Library`,
			options(),
		);

		expect(missingHeaders).toContain("hostLmsCode");
		expect(rows[0].verdict).toBe("reject");
	});

	it("reports a header it does not recognise without failing the file", () => {
		const { unknownHeaders, rows } = parseLibraryImport(
			`${HEADERS},favouriteColour\n${row()},blue`,
			options(),
		);

		expect(unknownHeaders).toEqual(["favouriteColour"]);
		// An extra column in somebody's own spreadsheet is not a reason to refuse it.
		expect(rows[0].verdict).toBe("create");
	});

	it("survives a UTF-8 BOM on the first header", () => {
		// Excel writes one. Without stripping it the first column is silently
		// unrecognised and every row reports a missing agency code.
		const { rows } = parseLibraryImport(
			`\uFEFF${HEADERS}\n${row()}`,
			options(),
		);

		expect(rows[0].verdict).toBe("create");
	});

	it("reads CRLF the same as LF", () => {
		const { rows } = parseLibraryImport(
			`${HEADERS}\r\n${row()}\r\n`,
			options(),
		);

		expect(rows).toHaveLength(1);
		expect(rows[0].verdict).toBe("create");
	});

	it("stops at the row cap rather than parsing an arbitrary upload", () => {
		const many = Array.from({ length: 1200 }, (_, index) =>
			row({ agencyCode: `LIB${index}` }),
		).join("\n");
		const { rows } = parseLibraryImport(`${HEADERS}\n${many}`, options());

		expect(rows).toHaveLength(1000);
	});

	it("returns nothing for an empty file instead of throwing", () => {
		expect(parseLibraryImport("", options()).rows).toEqual([]);
	});
});

describe("summariseImport", () => {
	it("counts each verdict and what is actually selected", () => {
		const { rows } = parseLibraryImport(
			[
				HEADERS,
				row({ agencyCode: "NEW1" }),
				row({ agencyCode: "ALPHA" }),
				row({ agencyCode: "" }),
			].join("\n"),
			options({ existingLibraries: [{ id: "lib-1", agencyCode: "ALPHA" }] }),
		);

		expect(summariseImport(rows)).toEqual({
			create: 1,
			update: 1,
			reject: 1,
			selected: 1,
		});
	});
});

describe("buildImportTemplate", () => {
	it("is a file this parser reads back as a valid create", () => {
		// The template and the parser share one definition; this is the assertion that
		// proves it, and it is what stops the two drifting.
		const template = buildImportTemplate();
		const { rows, missingHeaders, unknownHeaders } = parseLibraryImport(
			template,
			options({ knownHostLmsCodes: ["EXAMPLE-SIERRA"] }),
		);

		expect(missingHeaders).toEqual([]);
		expect(unknownHeaders).toEqual([]);
		expect(rows).toHaveLength(1);
		expect(rows[0].verdict).toBe("create");
	});

	it("has a column for every column the application knows about", () => {
		const [headerLine] = buildImportTemplate().split("\n");
		expect(headerLine.split(",")).toEqual(
			LIBRARY_IMPORT_COLUMNS.map((column) => column.key),
		);
	});
});
