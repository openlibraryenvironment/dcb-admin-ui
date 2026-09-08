import {
	LIBRARY_IMPORT_COLUMNS,
	LIBRARY_IMPORT_MAX_ROWS,
	type LibraryImportColumn,
} from "@constants/libraryImport";

/**
 * Reading and judging an uploaded library spreadsheet — W-10.
 *
 * Pure functions, no React and no network, so the rules can be tested without a browser
 * and without a server. The chapter does the asking and the writing; this decides what a
 * file says and whether each row can be applied.
 */

export type LibraryImportVerdict = "create" | "update" | "reject";

export interface LibraryImportRow {
	/** 1-based line number in the uploaded file, headers included. Used in messages. */
	line: number;
	values: Record<string, string>;
	verdict: LibraryImportVerdict;
	/** Populated for `reject`, and never empty when it is. */
	problems: string[];
	/** For `update`: the fields that differ, so the review grid can say what changes. */
	changes: { field: string; from: string; to: string }[];
	/** The existing library's id, when this row matches one. */
	existingId?: string;
	/**
	 * Whether this row will be applied. Creates default to true; UPDATES DEFAULT TO
	 * FALSE - a row matching a library that already exists is flagged for the user to
	 * decide on, so re-uploading a file by mistake changes nothing on its own.
	 */
	selected: boolean;
}

export interface LibraryImportParseResult {
	rows: LibraryImportRow[];
	/** Headers in the file that this build does not know about. Reported, not fatal. */
	unknownHeaders: string[];
	/** Required columns the file does not have at all. Fatal for every row. */
	missingHeaders: string[];
}

export interface ImportProblemMessages {
	requiredMissing: (column: string) => string;
	notANumber: (column: string) => string;
	unknownHostLms: (code: string) => string;
	duplicateAgencyCode: (code: string) => string;
	latitudeRange: string;
	longitudeRange: string;
	emailInvalid: (column: string) => string;
}

/**
 * Split one delimited line, honouring double quotes.
 *
 * A library's address contains commas roughly always, so a naive `split(",")` corrupts
 * most real files on the first row that matters. `""` inside a quoted field is an escaped
 * quote, which is what a spreadsheet writes when a name contains one.
 */
export function splitDelimitedLine(line: string, delimiter: string): string[] {
	const out: string[] = [];
	let field = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (inQuotes) {
			if (char === '"') {
				if (line[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
		} else if (char === delimiter) {
			out.push(field);
			field = "";
		} else {
			field += char;
		}
	}

	out.push(field);
	return out.map((value) => value.trim());
}

/**
 * Whether the file is comma- or tab-separated, decided from the header line.
 *
 * Sniffed rather than taken from the file extension, because a "CSV" exported from a
 * spreadsheet in a tab-separated locale is a real and common file, and the extension is
 * the least reliable thing about an upload.
 */
export function detectDelimiter(headerLine: string): string {
	const tabs = (headerLine.match(/\t/g) ?? []).length;
	const commas = (headerLine.match(/,/g) ?? []).length;
	return tabs > commas ? "\t" : ",";
}

const isBlank = (value: string | undefined): boolean =>
	value === undefined || value.trim().length === 0;

// Deliberately loose. The authority on an address is dcb-service, and a client-side
// pattern that is stricter than the server's rejects valid addresses that would have been
// accepted - which is worse than passing one through to a clear server-side refusal.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUIRED_COLUMNS = LIBRARY_IMPORT_COLUMNS.filter(
	(column) => column.required,
);

/** Every column whose values must parse as a number if present. */
const NUMERIC_COLUMNS = LIBRARY_IMPORT_COLUMNS.filter(
	(column) => column.type === "number",
);

export interface EvaluateOptions {
	/** Host LMS codes that exist. A row naming anything else is rejected. */
	knownHostLmsCodes: readonly string[];
	/** Existing libraries, so a repeated agency code becomes an update rather than a create. */
	existingLibraries: readonly { id: string; agencyCode?: string | null }[];
	messages: ImportProblemMessages;
}

/**
 * Parse a whole file into rows, then judge each one.
 *
 * Judging happens here rather than at apply time so that NOTHING IS WRITTEN before the
 * user has seen what would be. A bulk import that reports its failures halfway through
 * leaves a consortium in a state nobody chose and nobody can describe.
 */
export function parseLibraryImport(
	text: string,
	options: EvaluateOptions,
): LibraryImportParseResult {
	// Tolerate CRLF, LF and a UTF-8 BOM - all three are what a spreadsheet actually
	// produces, and a BOM on the first header makes that column silently unrecognised.
	const lines = text
		// A literal escape, not the character: a raw BOM in source is invisible in a
		// diff and the linter rejects it outright.
		.replace(/^\uFEFF/, "")
		.split(/\r\n|\n|\r/)
		.filter((line) => line.trim().length > 0);

	if (lines.length === 0) {
		return { rows: [], unknownHeaders: [], missingHeaders: [] };
	}

	const delimiter = detectDelimiter(lines[0]);
	const headers = splitDelimitedLine(lines[0], delimiter);
	const known = new Set(LIBRARY_IMPORT_COLUMNS.map((column) => column.key));

	const unknownHeaders = headers.filter(
		(header) => header.length > 0 && !known.has(header),
	);
	const missingHeaders = REQUIRED_COLUMNS.map((column) => column.key).filter(
		(key) => !headers.includes(key),
	);

	// A cap on the parse itself, not just on what is displayed. See the constant.
	const dataLines = lines.slice(1, LIBRARY_IMPORT_MAX_ROWS + 1);

	const rows = dataLines.map((line, index) => {
		const cells = splitDelimitedLine(line, delimiter);
		const values: Record<string, string> = {};
		headers.forEach((header, column) => {
			if (known.has(header)) values[header] = cells[column] ?? "";
		});
		// +2: one for the header line, one because line numbers start at 1. The number
		// in a message has to be the one the user sees in their spreadsheet.
		return { line: index + 2, values };
	});

	return {
		rows: evaluateRows(rows, missingHeaders, options),
		unknownHeaders,
		missingHeaders,
	};
}

function evaluateRows(
	parsed: { line: number; values: Record<string, string> }[],
	missingHeaders: string[],
	{ knownHostLmsCodes, existingLibraries, messages }: EvaluateOptions,
): LibraryImportRow[] {
	const hostLmsCodes = new Set(knownHostLmsCodes);
	const existingByAgencyCode = new Map<string, string>();
	for (const library of existingLibraries) {
		if (library.agencyCode)
			existingByAgencyCode.set(library.agencyCode.toLowerCase(), library.id);
	}

	// A code repeated WITHIN the file is a different problem from one that matches an
	// existing library: the second occurrence would overwrite the first in the same run,
	// and neither the user nor the application could say which won.
	const seenInFile = new Map<string, number>();

	return parsed.map(({ line, values }) => {
		const problems: string[] = [];

		for (const key of missingHeaders) {
			problems.push(messages.requiredMissing(key));
		}

		for (const column of REQUIRED_COLUMNS) {
			if (!missingHeaders.includes(column.key) && isBlank(values[column.key])) {
				problems.push(messages.requiredMissing(column.key));
			}
		}

		for (const column of NUMERIC_COLUMNS) {
			const raw = values[column.key];
			if (isBlank(raw)) continue;
			if (!Number.isFinite(Number(raw))) {
				problems.push(messages.notANumber(column.key));
			}
		}

		// Ranges, not just "is a number". A latitude of 530 is a number and is also the
		// single most common way a coordinate column ends up wrong.
		const latitude = Number(values.latitude);
		if (!isBlank(values.latitude) && Number.isFinite(latitude)) {
			if (latitude < -90 || latitude > 90)
				problems.push(messages.latitudeRange);
		}
		const longitude = Number(values.longitude);
		if (!isBlank(values.longitude) && Number.isFinite(longitude)) {
			if (longitude < -180 || longitude > 180)
				problems.push(messages.longitudeRange);
		}

		if (!isBlank(values.contact1Email) && !EMAIL.test(values.contact1Email)) {
			problems.push(messages.emailInvalid("contact1Email"));
		}

		const hostLmsCode = values.hostLmsCode?.trim();
		if (hostLmsCode && !hostLmsCodes.has(hostLmsCode)) {
			// Rejected, never invented. Creating a Host LMS from a spreadsheet cell
			// would produce a system with no client config that nothing can talk to.
			problems.push(messages.unknownHostLms(hostLmsCode));
		}

		const agencyCode = values.agencyCode?.trim().toLowerCase();
		if (agencyCode) {
			const firstSeenAt = seenInFile.get(agencyCode);
			if (firstSeenAt !== undefined) {
				problems.push(messages.duplicateAgencyCode(values.agencyCode.trim()));
			} else {
				seenInFile.set(agencyCode, line);
			}
		}

		const existingId = agencyCode
			? existingByAgencyCode.get(agencyCode)
			: undefined;

		if (problems.length > 0) {
			return {
				line,
				values,
				verdict: "reject" as const,
				problems,
				changes: [],
				existingId,
				selected: false,
			};
		}

		if (existingId) {
			return {
				line,
				values,
				verdict: "update" as const,
				problems: [],
				changes: [],
				existingId,
				// FLAGGED, NOT APPLIED. The user opts each update in; a file uploaded
				// twice by mistake therefore changes nothing.
				selected: false,
			};
		}

		return {
			line,
			values,
			verdict: "create" as const,
			problems: [],
			changes: [],
			selected: true,
		};
	});
}

/** Counts for the summary line above the review grid. */
export const summariseImport = (rows: readonly LibraryImportRow[]) => ({
	create: rows.filter((row) => row.verdict === "create").length,
	update: rows.filter((row) => row.verdict === "update").length,
	reject: rows.filter((row) => row.verdict === "reject").length,
	selected: rows.filter((row) => row.selected).length,
});

/**
 * A template file, generated from the column definition.
 *
 * Generated rather than committed for the same reason the parser and the validator share a
 * definition: a committed template is a fourth copy of the schema, and it is the copy
 * nobody remembers to update.
 */
export function buildImportTemplate(): string {
	const headers = LIBRARY_IMPORT_COLUMNS.map((column) => column.key);
	const example = LIBRARY_IMPORT_COLUMNS.map((column: LibraryImportColumn) =>
		// Quote anything containing the delimiter, which is exactly what the parser
		// above expects to read back.
		column.example.includes(",") ? `"${column.example}"` : column.example,
	);
	return `${headers.join(",")}\n${example.join(",")}\n`;
}
