import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import type { QueryFunctionContext } from "@tanstack/react-query";

import { trackingBacklogQuery } from "./trackingBacklog";

const clientAnswering = (byName: Record<string, unknown>) =>
	({
		get: vi.fn(async (_url: string, config: { params: { name: string } }) => ({
			data: byName[config.params.name],
		})),
	}) as unknown as AxiosInstance;

const run = (client: AxiosInstance) =>
	trackingBacklogQuery(client).queryFn!({
		signal: new AbortController().signal,
	} as QueryFunctionContext<string[]>);

describe("trackingBacklogQuery", () => {
	it("joins the two counts by status, reading their string totals as numbers", async () => {
		const client = clientAnswering({
			trackingAwaiting: {
				hits: [
					{ Status: "REQUEST_PLACED_AT_SUPPLYING_AGENCY", Total: "120" },
					{ Status: "LOANED", Total: "40" },
				],
			},
			trackingNow: {
				hits: [{ Status: "LOANED", Total: "7" }],
			},
		});

		expect(await run(client)).toEqual([
			{ status: "LOANED", scheduled: 40, overdue: 7 },
			{
				status: "REQUEST_PLACED_AT_SUPPLYING_AGENCY",
				scheduled: 120,
				overdue: 0,
			},
		]);
	});

	// GenericSelectService reports a failed query as a 200 with an error field
	it("fails on a 200 that carries an error", async () => {
		const client = clientAnswering({
			trackingAwaiting: { error: "Unable to obtain sql" },
			trackingNow: { hits: [] },
		});

		await expect(run(client)).rejects.toThrow("trackingAwaiting");
	});
});
