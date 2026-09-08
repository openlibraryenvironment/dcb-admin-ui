/**
 * The spreadsheet a consortium uploads to create its libraries in one go — W-10.
 *
 * ONE DEFINITION, four consumers: the parser, the validator, the review grid's columns and
 * the downloadable template. The file the user is handed therefore cannot drift from the
 * file the application accepts, which is the single most common way a bulk import feature
 * rots - a template committed once, and a parser changed three times since.
 *
 * <h2>Relationship to `dcb-service/scripts/libraries_setup.sh`</h2>
 *
 * The column names are the shell script's TSV columns, so a consortium that already has a
 * sheet for that script can upload it here. Two deliberate differences:
 *
 *  - **`hostLmsCode` is added, and it is required.** `LibraryInput.hostLmsCode` is
 *    `String!`, and the script never sent one - it sent `hostLmsConfiguration`, which is a
 *    different field entirely. A library created without a real Host LMS code is the
 *    empty-`hostLmsCode` defect the New Library wizard already shipped once: the library
 *    exists, nothing can be requested from it, and no screen says why.
 *  - **Contacts are numbered explicitly** rather than being positional repeats, so a sheet
 *    with one contact does not have to carry five empty columns.
 */

export type LibraryImportFieldType = "text" | "number" | "boolean";

export interface LibraryImportColumn {
	/** The header as it appears in the file, and the key in a parsed row. */
	key: string;
	/** Rejected at parse time when blank. */
	required: boolean;
	type: LibraryImportFieldType;
	/** Translation key for the column's one-line explanation in the help panel. */
	descriptionKey: string;
	/** What the template's example row shows in this column. */
	example: string;
}

export const LIBRARY_IMPORT_COLUMNS: LibraryImportColumn[] = [
	{
		key: "agencyCode",
		required: true,
		type: "text",
		descriptionKey: "setup.import.columns.agencyCode",
		example: "EXLIB",
	},
	{
		key: "fullName",
		required: true,
		type: "text",
		descriptionKey: "setup.import.columns.fullName",
		example: "Example University Library",
	},
	{
		key: "shortName",
		required: true,
		type: "text",
		descriptionKey: "setup.import.columns.shortName",
		example: "Example University",
	},
	{
		key: "abbreviatedName",
		required: true,
		type: "text",
		descriptionKey: "setup.import.columns.abbreviatedName",
		example: "EUL",
	},
	{
		key: "address",
		required: true,
		type: "text",
		descriptionKey: "setup.import.columns.address",
		example: "1 Library Way, Exampleton",
	},
	{
		key: "type",
		required: true,
		type: "text",
		descriptionKey: "setup.import.columns.type",
		example: "Academic",
	},
	{
		key: "hostLmsCode",
		required: true,
		type: "text",
		descriptionKey: "setup.import.columns.hostLmsCode",
		example: "EXAMPLE-SIERRA",
	},
	{
		key: "longitude",
		required: false,
		type: "number",
		descriptionKey: "setup.import.columns.longitude",
		example: "-1.4746",
	},
	{
		key: "latitude",
		required: false,
		type: "number",
		descriptionKey: "setup.import.columns.latitude",
		example: "53.3811",
	},
	{
		key: "backupDowntimeSchedule",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.backupDowntimeSchedule",
		example: "Sundays 02:00-04:00",
	},
	{
		key: "supportHours",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.supportHours",
		example: "Mon-Fri 09:00-17:00",
	},
	{
		key: "discoverySystem",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.discoverySystem",
		example: "Primo",
	},
	{
		key: "patronWebsite",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.patronWebsite",
		example: "https://library.example.ac.uk",
	},
	{
		key: "contact1FirstName",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.contactFirstName",
		example: "Alex",
	},
	{
		key: "contact1LastName",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.contactLastName",
		example: "Morgan",
	},
	{
		key: "contact1Email",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.contactEmail",
		example: "alex.morgan@example.ac.uk",
	},
	{
		key: "contact1Role",
		required: false,
		type: "text",
		descriptionKey: "setup.import.columns.contactRole",
		example: "Library Services Administrator",
	},
	{
		key: "contact1IsPrimary",
		required: false,
		type: "boolean",
		descriptionKey: "setup.import.columns.contactIsPrimary",
		example: "true",
	},
];

/**
 * How big a file this accepts, and why those numbers.
 *
 * The scale constant for a consortium's membership is HUNDREDS - five hundred is the
 * design figure - so a thousand rows is generous headroom and still a number a browser can
 * hold and a person can review. The byte cap is the backstop for a file that is small in
 * rows and enormous in one cell.
 *
 * Both are refused before parsing. An unbounded parse of an arbitrary upload is how a tab
 * locks up, and "the browser froze" is indistinguishable from "the application is broken".
 */
export const LIBRARY_IMPORT_MAX_ROWS = 1000;
export const LIBRARY_IMPORT_MAX_BYTES = 1024 * 1024;

/** What the file picker offers. The parser sniffs the delimiter regardless. */
export const LIBRARY_IMPORT_ACCEPT =
	".csv,.tsv,text/csv,text/tab-separated-values";
