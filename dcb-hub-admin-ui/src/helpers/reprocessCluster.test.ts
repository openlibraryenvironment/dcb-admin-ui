import { describe, expect, it, vi } from "vitest";
import { AxiosError, type AxiosInstance, type AxiosResponse } from "axios";

import { reprocessCluster } from "./reprocessCluster";

const ID = "7c7c7c7c-2222-5222-9222-222222222222";

const failing = (status: number) => {
	const error = new AxiosError("failed", String(status), undefined, undefined, {
		status,
		data: {},
	} as AxiosResponse);
	return {
		post: vi.fn().mockRejectedValue(error),
	} as unknown as AxiosInstance;
};

describe("reprocessCluster", () => {
	it("posts to the cluster's own reprocess endpoint, without a body", async () => {
		const post = vi.fn().mockResolvedValue({ status: 202, data: "" });

		expect(
			await reprocessCluster({ post } as unknown as AxiosInstance, ID),
		).toEqual({ kind: "started" });
		expect(post).toHaveBeenCalledWith(`/clusters/${ID}/reprocess`);
	});

	it("maps a 403 to forbidden", async () => {
		expect(await reprocessCluster(failing(403), ID)).toEqual({
			kind: "forbidden",
		});
	});

	it("reports any other failure as failed", async () => {
		expect(await reprocessCluster(failing(500), ID)).toMatchObject({
			kind: "failed",
		});
	});
});
