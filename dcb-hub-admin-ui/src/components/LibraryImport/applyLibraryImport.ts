import { GraphQLClient } from "graphql-request";

import { createLibraryMutation } from "@mutations/createLibrary";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import { addLibraryToGroup } from "@mutations/addLibraryToGroup";
import { mapWithConcurrency } from "@helpers/mapWithConcurrency";
import type { LibraryImportRow } from "@helpers/libraryImport";

/**
 * Writing the rows the user selected — W-10.
 *
 * <h2>Why this is client-side, and what that costs</h2>
 *
 * The plan proposed a `POST /uploadedLibraries` endpoint in dcb-service, mirroring
 * `UploadedMappingsController`, so one request replaced N mutations. This does it from the
 * browser instead, against mutations that already exist. The reasons, so that a reviewer
 * can overturn the decision knowingly rather than discover it:
 *
 *  - It adds NO new authenticated endpoint, and therefore no new attack surface to
 *    document, secure and rate-limit. A new route is a security decision; not needing one
 *    is the cheaper answer to the same requirement.
 *  - It does not couple this feature to a dcb-service release.
 *  - `dcb-service/scripts/libraries_setup.sh` already creates libraries exactly this way,
 *    one mutation per row, so the write path is the proven one.
 *
 * What it costs is atomicity. There is no transaction across rows, so a failure partway
 * leaves the rows before it applied. That is made survivable rather than ignored: nothing
 * is written until the user has approved a per-row verdict, each row reports its own
 * outcome, and a re-run of the same file finds the applied rows as `update` and leaves
 * them deselected. It is NOT made invisible - the result summary names what failed.
 *
 * <h2>Scale</h2>
 *
 * Bounded at four rows in flight. The bound is not decorative: a 500-library consortium
 * uploading its whole membership would otherwise hand 500 mutations to the browser in one
 * tick and dcb-service would see the entire consortium arrive as a burst - the failure
 * mode the onboarding grid was fixed for. Four is below that grid's six because each of
 * these is a WRITE plus an agency resolution, not a count.
 */

const APPLY_CONCURRENCY = 4;

export interface ImportOutcome {
	line: number;
	agencyCode: string;
	ok: boolean;
	/** Present when `ok` is false. The server's words, not ours. */
	error?: string;
}

export interface ApplyOptions {
	/** The consortium's own group, so imported libraries are members from the start. */
	consortiumGroupId?: string | null;
	/** Called after each row settles, for the progress readout. */
	onProgress?: (done: number, total: number) => void;
}

const text = (value: string | undefined): string => (value ?? "").trim();

const optionalText = (value: string | undefined): string | undefined => {
	const trimmed = text(value);
	return trimmed.length > 0 ? trimmed : undefined;
};

const optionalNumber = (value: string | undefined): number | undefined => {
	const trimmed = text(value);
	if (trimmed.length === 0) return undefined;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * The row's contacts, as `PersonInput`s.
 *
 * `LibraryInput.contacts` is `[PersonInput]!` - the LIST is non-null, its elements are
 * not - so a library with no contact in the sheet sends an empty array rather than being
 * refused. The New Library wizard requires a contact; a bulk import does not, because the
 * onboarding grid will report the omission and "finish setup" will collect it.
 */
const contactsOf = (values: Record<string, string>) => {
	const email = text(values.contact1Email);
	const firstName = text(values.contact1FirstName);
	const lastName = text(values.contact1LastName);
	if (!email && !firstName && !lastName) return [];

	return [
		{
			firstName,
			lastName,
			email,
			role: text(values.contact1Role),
			// A spreadsheet writes "TRUE", "true" and "1" for the same thing.
			isPrimaryContact: /^(true|yes|1)$/i.test(text(values.contact1IsPrimary)),
		},
	];
};

export async function applyLibraryImport(
	gqlClient: GraphQLClient,
	rows: readonly LibraryImportRow[],
	{ consortiumGroupId, onProgress }: ApplyOptions = {},
): Promise<ImportOutcome[]> {
	const selected = rows.filter((row) => row.selected);
	let done = 0;

	return mapWithConcurrency(selected, APPLY_CONCURRENCY, async (row) => {
		const values = row.values;
		const agencyCode = text(values.agencyCode);

		try {
			if (row.verdict === "update" && row.existingId) {
				// UpdateLibraryInput is a different and much smaller type than
				// LibraryInput - sending the create shape here is a defect the New
				// Library wizard already shipped once. Only the fields that exist on
				// it are sent.
				await gqlClient.request<any>(updateLibraryMutation, {
					input: {
						id: row.existingId,
						fullName: text(values.fullName),
						shortName: text(values.shortName),
						abbreviatedName: text(values.abbreviatedName),
						address: text(values.address),
						type: text(values.type),
						longitude: optionalNumber(values.longitude),
						latitude: optionalNumber(values.latitude),
						backupDowntimeSchedule: optionalText(values.backupDowntimeSchedule),
						supportHours: optionalText(values.supportHours),
						discoverySystem: optionalText(values.discoverySystem),
						patronWebsite: optionalText(values.patronWebsite),
						reason: "Bulk library import",
						changeCategory: "Initial setup",
					},
				});
			} else {
				const created = await gqlClient.request<any>(createLibraryMutation, {
					input: {
						agencyCode,
						fullName: text(values.fullName),
						shortName: text(values.shortName),
						abbreviatedName: text(values.abbreviatedName),
						address: text(values.address),
						type: text(values.type),
						hostLmsCode: text(values.hostLmsCode),
						longitude: optionalNumber(values.longitude),
						latitude: optionalNumber(values.latitude),
						backupDowntimeSchedule: optionalText(values.backupDowntimeSchedule),
						supportHours: optionalText(values.supportHours),
						discoverySystem: optionalText(values.discoverySystem),
						patronWebsite: optionalText(values.patronWebsite),
						contacts: contactsOf(values),
						reason: "Bulk library import",
						changeCategory: "Initial setup",
					},
				});

				// Membership is part of being imported into a consortium, not a
				// separate errand to remember afterwards - the New Library wizard makes
				// the same call for the same reason. A failure here is reported against
				// the row rather than swallowed: a library that exists but belongs to
				// nothing is exactly the half-configured state onboarding chases.
				const libraryId = created?.createLibrary?.id;
				if (consortiumGroupId && libraryId) {
					await gqlClient.request<any>(addLibraryToGroup, {
						input: { library: libraryId, libraryGroup: consortiumGroupId },
					});
				}
			}

			return { line: row.line, agencyCode, ok: true };
		} catch (failure: any) {
			// Reported, never swallowed. A bulk import that says "12 of 14 succeeded"
			// and cannot say which two is not a result, it is a rumour.
			console.error(`Library import failed on line ${row.line}:`, failure);
			return {
				line: row.line,
				agencyCode,
				ok: false,
				error:
					failure?.response?.errors?.[0]?.message ??
					failure?.message ??
					"Unknown error",
			};
		} finally {
			done += 1;
			onProgress?.(done, selected.length);
		}
	});
}
