import { describe, expect, it } from "vitest";

import { csvFileName, panelCsv } from "./panelCsv";

/**
 * A panel CSV is a file that leaves this application and is read somewhere we cannot see,
 * by somebody who did not run the report. Two things follow, and both are tested here: it
 * has to say what it is, and it must not do anything when it is opened.
 */

const CONTEXT = {
	panel: "Why requests fail",
	scope: "Whole consortium",
	window: "1 Aug 2026 to 1 Sep 2026",
	generated: new Date("2026-09-14T09:30:00.000Z"),
};

const rows = [
	{ reason: "NO_ITEMS_SELECTABLE", count: 148 },
	{ reason: "PATRON_VERIFICATION_FAILED", count: 21 },
];

const columns = [
	{ header: "Reason", value: (row: (typeof rows)[number]) => row.reason },
	{ header: "Requests", value: (row: (typeof rows)[number]) => row.count },
];

describe("a panel CSV", () => {
	it("states what it is before the first figure", () => {
		const csv = panelCsv(rows, columns, CONTEXT);
		const lines = csv.split("\r\n");

		expect(lines[0]).toBe("Why requests fail");
		expect(lines[1]).toBe("Scope,Whole consortium");
		expect(lines[2]).toBe("Period,1 Aug 2026 to 1 Sep 2026");
		expect(lines[3]).toBe("Generated,2026-09-14T09:30:00.000Z");

		// A blank line, then the column headers - so a spreadsheet's own import can find
		// the table without the preamble running into it.
		expect(lines[4]).toBe("");
		expect(lines[5]).toBe("Reason,Requests");
		expect(lines[6]).toBe("NO_ITEMS_SELECTABLE,148");
	});

	it("carries the method when the figure has one", () => {
		const csv = panelCsv(rows, columns, {
			...CONTEXT,
			method: "Counted from x",
		});

		expect(csv).toContain("Method,Counted from x");
	});

	it("neutralises a value a spreadsheet would execute", () => {
		// A title beginning with = is a formula to Excel, and the file is opened by
		// whoever it was forwarded to. Prefixed with a tab so it is read as text.
		const csv = panelCsv(
			[{ title: "=1+1", count: 1 }],
			[
				{ header: "Title", value: (row) => row.title },
				{ header: "Count", value: (row) => row.count },
			],
			CONTEXT,
		);

		expect(csv).toContain('"\t=1+1",1');
	});

	it("quotes a value that would otherwise break the row", () => {
		const csv = panelCsv(
			[{ title: 'Smith, J. "the younger"' }],
			[{ header: "Title", value: (row) => row.title }],
			CONTEXT,
		);

		expect(csv).toContain('"Smith, J. ""the younger"""');
	});

	it("writes an empty field for a missing value, not the word undefined", () => {
		const csv = panelCsv(
			[{ author: null }],
			[{ header: "Author", value: (row) => row.author }],
			CONTEXT,
		);

		expect(csv.split("\r\n").at(-1)).toBe("");
	});

	it("names the file after the panel and the day it was taken", () => {
		expect(csvFileName("Why requests fail", CONTEXT.generated)).toBe(
			"why-requests-fail-2026-09-14.csv",
		);
		expect(csvFileName("Borrowing vs supplying", CONTEXT.generated)).toBe(
			"borrowing-vs-supplying-2026-09-14.csv",
		);
	});
});
