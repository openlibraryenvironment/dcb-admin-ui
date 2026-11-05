import { describe, expect, it, vi } from "vitest";
import { AxiosError, type AxiosInstance, type AxiosResponse } from "axios";

import {
	availableSupplierActions,
	runSupplierAction,
} from "./supplierRequestActions";

const ID = "5a5a5a5a-1111-5111-9111-111111111111";

const clientReturning = (data: unknown) => {
	const post = vi.fn().mockResolvedValue({ data });
	const patch = vi.fn().mockResolvedValue({ data });
	return { client: { post, patch } as unknown as AxiosInstance, post, patch };
};

const clientFailing = (status: number, data: unknown = {}) => {
	const error = new AxiosError("failed", String(status), undefined, undefined, {
		status,
		data,
	} as AxiosResponse);
	const reject = vi.fn().mockRejectedValue(error);
	return { post: reject, patch: reject } as unknown as AxiosInstance;
};

describe("availableSupplierActions", () => {
	it("offers skip and cancel only while the supplier is active", () => {
		expect(availableSupplierActions({ isActive: true })).toEqual([
			"skip",
			"cancel",
		]);
	});

	it("offers reactivate only once it is not", () => {
		expect(availableSupplierActions({ isActive: false })).toEqual([
			"reactivate",
		]);
	});

	it("offers nothing without a supplier", () => {
		expect(availableSupplierActions(undefined)).toEqual([]);
	});
});

describe("runSupplierAction", () => {
	it("skips with a bodiless POST", async () => {
		const { client, post } = clientReturning({ message: "ignored" });

		expect(await runSupplierAction(client, "skip", ID)).toEqual({
			kind: "skipped",
		});
		expect(post).toHaveBeenCalledWith(`/suppliers/requests/${ID}/skip`);
	});

	it("reports a cancel the supplier did not confirm as not paused", async () => {
		const { client, post } = clientReturning({
			paused: false,
			supplierStatus: "PLACED",
		});

		expect(await runSupplierAction(client, "cancel", ID)).toEqual({
			kind: "cancelled",
			paused: false,
			supplierStatus: "PLACED",
		});
		expect(post).toHaveBeenCalledWith(`/suppliers/requests/${ID}/cancel`, {});
	});

	// dcb-service reads a missing `active` as false, which would pause the supplier
	it("reactivates by sending active: true", async () => {
		const { client, patch } = clientReturning({ activeNow: true });

		expect(await runSupplierAction(client, "reactivate", ID)).toEqual({
			kind: "reactivated",
			activeNow: true,
		});
		expect(patch).toHaveBeenCalledWith(`/suppliers/requests/${ID}/active`, {
			active: true,
		});
	});

	it.each([
		[403, { kind: "forbidden" }],
		[404, { kind: "notFound" }],
	])("maps %i", async (status, outcome) => {
		expect(await runSupplierAction(clientFailing(status), "skip", ID)).toEqual(
			outcome,
		);
	});

	it("carries the server's message on any other failure", async () => {
		const outcome = await runSupplierAction(
			clientFailing(502, { message: "Supplier unreachable" }),
			"cancel",
			ID,
		);

		expect(outcome).toMatchObject({
			kind: "failed",
			message: "Supplier unreachable",
		});
	});
});
