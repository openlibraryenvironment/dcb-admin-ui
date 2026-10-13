import { describe, it, expect } from "vitest";

import {
	classifyVerificationStatus,
	isIngestTimeout,
} from "./hostLmsVerification";

describe("hostLmsVerification", () => {
	describe("classifyVerificationStatus", () => {
		it.each([
			["Status: OK", "success"],
			["Status: OK (Alma API v1 (PRODUCTION, Example University))", "success"],
			[
				"Status: ERROR (Alma API v1) - The API key was refused for Users (read and write): Forbidden",
				"error",
			],
			[
				"Status: ERROR (POLARIS (version unknown)) - Polaris did not accept the Application Services staff login: HTTP 500",
				"error",
			],
			["Status: Not implemented", "info"],
			["Success: Retrieved chunk with 12 records.", "success"],
			["Ping Failed: connection refused", "error"],
			["Ingest Check Failed: boom", "error"],
			["Skipped: Source does not support chunked retrieval.", "info"],
			[undefined, "info"],
		])("classifies %s as %s", (status, expected) => {
			expect(classifyVerificationStatus(status)).toBe(expected);
		});
	});

	describe("isIngestTimeout", () => {
		it("recognises the Reactor timeout dcb-service wraps at 20 seconds", () => {
			expect(
				isIngestTimeout(
					"Ingest Check Failed: java.util.concurrent.TimeoutException: Did not observe any item or terminal signal within 20000ms",
				),
			).toBe(true);
		});

		it("does not treat a real ingest failure as a timeout", () => {
			// A genuine failure must keep its plain error message: telling the user
			// to go and check the bib records page would be wrong here.
			expect(isIngestTimeout("Ingest Check Failed: 401 Unauthorized")).toBe(
				false,
			);
			expect(isIngestTimeout("Success: Retrieved chunk with 0 records.")).toBe(
				false,
			);
			expect(isIngestTimeout(undefined)).toBe(false);
		});
	});
});
