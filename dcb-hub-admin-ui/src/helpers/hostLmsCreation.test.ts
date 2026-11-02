import { describe, expect, it, vi } from "vitest";
import type { GraphQLClient } from "graphql-request";

import { createHostLmsRecord } from "./hostLmsCreation";
import { HOST_LMS_CLASSES } from "./hostLmsClientConfig";

const created = {
	createHostLms: {
		hostLms: { id: "h1", code: "TEST", name: "Test", lmsClientClass: "" },
		pingStatus: "Status: OK",
		ingestStatus: "Success",
		warnings: [],
	},
};

/** Answers the create, then each later request with `next` (or throws it). */
const clientAnswering = (next: () => unknown) => {
	const request = vi
		.fn()
		.mockResolvedValueOnce(created)
		.mockImplementation(async () => next());
	return { client: { request } as unknown as GraphQLClient, request };
};

const input = (lmsClientClass: string) => ({
	code: "TEST",
	lmsClientClass,
	reason: "Adding a library",
	changeCategory: "New member",
});

describe("createHostLmsRecord", () => {
	it("stores a Sierra's ingest source class with an update after the create", async () => {
		const { client, request } = clientAnswering(() => ({ updateHostLms: {} }));

		const result = await createHostLmsRecord(
			client,
			input(HOST_LMS_CLASSES.sierra),
		);

		expect(request).toHaveBeenCalledTimes(2);
		expect(request.mock.calls[1][1]).toEqual({
			input: {
				id: "h1",
				ingestSourceClass: HOST_LMS_CLASSES.sierra,
				reason: "Adding a library",
				changeCategory: "New member",
			},
		});
		expect(result.ingestSourceMissing).toBe(false);
		expect(result.createHostLms?.pingStatus).toBe("Status: OK");
	});

	it("makes no second call for an ILS createHostLms gets right itself", async () => {
		const { client, request } = clientAnswering(() => ({ updateHostLms: {} }));

		await createHostLmsRecord(client, input(HOST_LMS_CLASSES.alma));

		expect(request).toHaveBeenCalledTimes(1);
	});

	it("reports a failed follow-up instead of throwing, because the Host LMS exists", async () => {
		const { client } = clientAnswering(() => {
			throw new Error("Unavailable");
		});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const result = await createHostLmsRecord(
			client,
			input(HOST_LMS_CLASSES.polaris),
		);

		expect(result.ingestSourceMissing).toBe(true);
		expect(result.createHostLms?.hostLms?.id).toBe("h1");
	});
});
