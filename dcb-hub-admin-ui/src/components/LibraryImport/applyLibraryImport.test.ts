import { describe, expect, it, vi } from "vitest";
import type { GraphQLClient } from "graphql-request";

import { applyLibraryImport } from "./applyLibraryImport";
import type { LibraryImportRow } from "@helpers/libraryImport";

const row: LibraryImportRow = {
	line: 2,
	values: { agencyCode: "alpha", fullName: "Alpha" },
	verdict: "create",
	problems: [],
	changes: [],
	selected: true,
};

const failingWith = (failure: unknown) =>
	({ request: vi.fn().mockRejectedValue(failure) }) as unknown as GraphQLClient;

describe("applyLibraryImport - a failed row's reason", () => {
	it("is the server's message when the server gave one", async () => {
		const [outcome] = await applyLibraryImport(
			failingWith({ response: { errors: [{ message: "Agency code taken" }] } }),
			[row],
			{ unknownError: "Unbekannter Fehler" },
		);

		expect(outcome.ok).toBe(false);
		expect(outcome.error).toBe("Agency code taken");
	});

	it("is the caller's translated wording when nothing better is known", async () => {
		const [outcome] = await applyLibraryImport(failingWith({}), [row], {
			unknownError: "Unbekannter Fehler",
		});

		expect(outcome.error).toBe("Unbekannter Fehler");
	});
});
