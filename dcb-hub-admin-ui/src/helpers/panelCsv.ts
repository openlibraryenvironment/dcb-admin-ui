/**
 * A panel's own numbers, as a CSV.
 *
 * NOT a second export engine: the rows are already in the query cache and bounded by the
 * query's own limit. Why the header rows carry the scope, window and method, and what is
 * deliberately not built: INSIGHTS_IA_AND_UX_PLAN.md section 9.
 */

export interface CsvColumn<T> {
	/** Already translated: the file is read by a person, not by this application. */
	header: string;
	value: (row: T) => string | number | null | undefined;
}

export interface CsvContext {
	/** The panel's title, so the file says what it is. */
	panel: string;
	/** What the figures were computed from - the registry's "how". */
	method?: string;
	/** The libraries in scope, or the consortium. */
	scope: string;
	/** The window, as the reader chose it. */
	window: string;
	/** When the figures were taken. A window is not a timestamp. */
	generated: Date;
}

/** One field, quoted only where it has to be, with embedded quotes doubled. */
const field = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined) return "";

	const text = String(value);

	// A leading =, +, - or @ is executed as a formula by spreadsheet applications, so a
	// value that starts with one is prefixed with a tab. This is a CSV injection defence,
	// not formatting: the file is opened by whoever it was forwarded to.
	const safe = /^[=+\-@\t\r]/.test(text) ? `\t${text}` : text;

	// The tab is quoted along with the rest: unquoted leading whitespace is stripped by
	// some parsers, which would put the formula back.
	return /[",\n\r\t]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

const row = (values: (string | number | null | undefined)[]) =>
	values.map(field).join(",");

export function panelCsv<T>(
	rows: T[],
	columns: CsvColumn<T>[],
	context: CsvContext,
): string {
	const header = [
		row([context.panel]),
		row(["Scope", context.scope]),
		row(["Period", context.window]),
		row(["Generated", context.generated.toISOString()]),
	];

	if (context.method) header.push(row(["Method", context.method]));

	return [
		...header,
		"",
		row(columns.map((column) => column.header)),
		...rows.map((item) => row(columns.map((column) => column.value(item)))),
	].join("\r\n");
}

/**
 * Hand the file to the reader.
 *
 * An object URL rather than a data URI: a data URI large enough to matter is refused by
 * some browsers, and this one is revoked as soon as the click is dispatched.
 */
export function downloadCsv(name: string, content: string): void {
	// The BOM is what makes Excel read the file as UTF-8 rather than as the machine's
	// codepage, which is where an accented author's name turns into mojibake. As an escape
	// rather than the character itself, which is invisible in a diff.
	const blob = new Blob(["﻿" + content], {
		type: "text/csv;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);

	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = name;
	anchor.click();

	URL.revokeObjectURL(url);
}

/** A filename a reader can tell apart from the last one they downloaded. */
export const csvFileName = (panel: string, generated: Date): string =>
	`${panel
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")}-${generated.toISOString().slice(0, 10)}.csv`;
