import { describe, expect, it } from "vitest";
import type { AxiosInstance } from "axios";

import {
	allImportIngestDetailsQueryOptions,
	importIngestDetailsKeys,
	importIngestDetailsQueryOptions,
	processingStateCount,
} from "@helpers/importIngestDetails";

const recordingClient = (body: unknown = []) => {
	let capturedUrl = "";
	const client = {
		get: async (url: string) => {
			capturedUrl = url;
			return { data: body };
		},
	} as unknown as AxiosInstance;
	return { client, url: () => capturedUrl };
};

describe("importIngestDetails wire contract", () => {
	it("reads every Host LMS from the shared count", async () => {
		const { client, url } = recordingClient();

		await allImportIngestDetailsQueryOptions(client).queryFn();

		expect(url()).toBe("/hostlmss/importIngestDetails");
	});

	it("reads one Host LMS by its id", async () => {
		const { client, url } = recordingClient({});

		await importIngestDetailsQueryOptions(client, "h1").queryFn();

		expect(url()).toBe("/hostlmss/importIngestDetails/h1");
	});

	it("never retries: a retry of the shared count joins the count already running", () => {
		const { client } = recordingClient();

		expect(allImportIngestDetailsQueryOptions(client).retry).toBe(false);
		expect(importIngestDetailsQueryOptions(client, "h1").retry).toBe(false);
	});

	it("keeps failures on the page, which says what failed", () => {
		const { client } = recordingClient();

		expect(allImportIngestDetailsQueryOptions(client).throwOnError).toBe(false);
		expect(importIngestDetailsQueryOptions(client, "h1").throwOnError).toBe(
			false,
		);
	});

	it("keys one Host LMS apart from the list, so a refresh does not recount everything", () => {
		expect(importIngestDetailsKeys.detail("h1")).not.toEqual(
			importIngestDetailsKeys.list(),
		);
		expect(importIngestDetailsKeys.detail("h1")).not.toEqual(
			importIngestDetailsKeys.detail("h2"),
		);
	});
});

describe("processingStateCount", () => {
	const details = {
		processStates: [
			{ value: "SUCCESS", count: 7 },
			{ value: "PROCESSING_REQUIRED", count: 2 },
		],
	};

	it("reads the count for a state", () => {
		expect(processingStateCount(details, "PROCESSING_REQUIRED")).toBe(2);
	});

	it("reads an absent state as zero", () => {
		expect(processingStateCount(details, "FAILURE")).toBe(0);
		expect(processingStateCount({}, "SUCCESS")).toBe(0);
		expect(processingStateCount(undefined, "SUCCESS")).toBe(0);
	});
});
