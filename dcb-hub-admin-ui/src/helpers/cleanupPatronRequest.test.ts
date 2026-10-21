import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosHeaders, AxiosInstance } from "axios";
import {
	cleanupPatronRequest,
	isCleanupEligible,
} from "@helpers/cleanupPatronRequest";

vi.mock("axios", async (importOriginal) => ({
	...(await importOriginal<typeof import("axios")>()),
	default: {
		isAxiosError: (error: { isAxiosError?: boolean } | null) =>
			Boolean(error?.isAxiosError),
	},
}));

const post = vi.fn();
const client = { post } as unknown as AxiosInstance;

const httpError = (status: number, data?: unknown) => ({
	isAxiosError: true,
	config: { headers: new AxiosHeaders({ "X-Request-Id": "adm-0123456789ab" }) },
	response: { status, data },
});

const urls = () => post.mock.calls.map((call) => String(call[0]));

describe("which requests cleanup is offered for", () => {
	describe("against 8.71.0, where the server has no guard", () => {
		it("offers the states it has always offered", () => {
			expect(isCleanupEligible({ status: "ERROR" }, false)).toBe(true);
			expect(isCleanupEligible({ status: "RESOLVED" }, false)).toBe(true);
		});

		it("offers an item-out request only once tracking has given up on it", () => {
			// Consortium staff are the only route to clear these, and 8.71.0 will not
			// refuse them - so "too long" is what distinguishes a stuck request from one
			// whose item is simply still out.
			expect(
				isCleanupEligible({ status: "PICKUP_TRANSIT", isTooLong: true }, false),
			).toBe(true);
			expect(
				isCleanupEligible(
					{ status: "PICKUP_TRANSIT", isTooLong: false },
					false,
				),
			).toBe(false);
			expect(isCleanupEligible({ status: "LOANED" }, false)).toBe(false);
		});
	});

	describe("against 9.0.0 and later, where the server decides", () => {
		it("offers anything cleanup could still apply to", () => {
			expect(isCleanupEligible({ status: "PICKUP_TRANSIT" }, true)).toBe(true);
			expect(isCleanupEligible({ status: "ERROR" }, true)).toBe(true);
		});

		it("still hides requests cleanup can never apply to", () => {
			expect(isCleanupEligible({ status: "FINALISED" }, true)).toBe(false);
			expect(isCleanupEligible({ status: "CANCELLED" }, true)).toBe(false);
			expect(isCleanupEligible({ status: undefined }, true)).toBe(false);
		});
	});
});

describe("cleaning up one request", () => {
	beforeEach(() => {
		post.mockReset();
		post.mockResolvedValue({ data: {} });
	});

	it("checks for updates first, then cleans up", async () => {
		const outcome = await cleanupPatronRequest(
			client,
			{
				id: "pr-1",
				status: "PICKUP_TRANSIT",
			},
			{ refreshFirst: true },
		);

		expect(outcome).toEqual({ kind: "cleaned" });
		expect(urls()).toEqual([
			"/patrons/requests/pr-1/update",
			"/patrons/requests/pr-1/transition/cleanup",
		]);
	});

	it("does not poll a status dcb-service will not track", async () => {
		await cleanupPatronRequest(
			client,
			{
				id: "pr-1",
				status: "ERROR",
			},
			{ refreshFirst: true },
		);

		expect(urls()).toEqual(["/patrons/requests/pr-1/transition/cleanup"]);
	});

	it("does not refresh when it is not asked to", async () => {
		await cleanupPatronRequest(client, {
			id: "pr-1",
			status: "PICKUP_TRANSIT",
		});

		expect(urls()).toEqual(["/patrons/requests/pr-1/transition/cleanup"]);
	});

	it("overriding sends force and skips the second poll", async () => {
		await cleanupPatronRequest(
			client,
			{
				id: "pr-1",
				status: "PICKUP_TRANSIT",
			},
			{ override: true, refreshFirst: true },
		);

		expect(urls()).toEqual(["/patrons/requests/pr-1/transition/cleanup"]);
		expect(post.mock.calls[0][2]).toMatchObject({ params: { force: true } });
	});

	it("reports a refusal with the status the server named", async () => {
		post.mockRejectedValueOnce(
			httpError(409, {
				detail:
					"The item for this request is not back at the supplying library.",
				patronRequestStatus: "PICKUP_TRANSIT",
				lastKnownItemOutStatus: "PICKUP_TRANSIT",
			}),
		);

		expect(
			await cleanupPatronRequest(client, {
				id: "pr-1",
				status: "ERROR",
			}),
		).toEqual({
			kind: "refused",
			status: "PICKUP_TRANSIT",
			detail: "The item for this request is not back at the supplying library.",
		});
	});

	it("distinguishes forbidden, missing and broken", async () => {
		post.mockRejectedValueOnce(httpError(403));
		expect(
			await cleanupPatronRequest(client, {
				id: "pr-1",
				status: "ERROR",
			}),
		).toEqual({ kind: "forbidden" });

		post.mockRejectedValueOnce(httpError(404));
		expect(
			await cleanupPatronRequest(client, {
				id: "pr-1",
				status: "ERROR",
			}),
		).toEqual({ kind: "notFound" });

		post.mockRejectedValueOnce(httpError(500, { detail: "Cleanup failed" }));
		expect(
			await cleanupPatronRequest(client, {
				id: "pr-1",
				status: "ERROR",
			}),
		).toEqual({
			kind: "failed",
			detail: "Cleanup failed",
			reference: "adm-0123456789ab",
		});
	});
});
