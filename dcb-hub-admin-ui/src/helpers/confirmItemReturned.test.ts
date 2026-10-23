import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
	confirmItemReturned,
	isConfirmReturnEligible,
} from "@helpers/confirmItemReturned";

vi.mock("axios", () => ({
	default: {
		post: vi.fn(),
		isAxiosError: (error: any) => Boolean(error?.isAxiosError),
	},
}));

const post = axios.post as unknown as ReturnType<typeof vi.fn>;

const httpError = (status: number, data?: unknown) => ({
	isAxiosError: true,
	response: { status, data },
});

describe("which requests can be confirmed returned", () => {
	it("offers only a request waiting for its item to come back", () => {
		expect(isConfirmReturnEligible("AWAITING_RETURN_TO_SUPPLIER")).toBe(true);
		expect(isConfirmReturnEligible("RETURN_TRANSIT")).toBe(true);
	});

	it("does not offer a request whose item has not started home", () => {
		expect(isConfirmReturnEligible("PICKUP_TRANSIT")).toBe(false);
		expect(isConfirmReturnEligible("READY_FOR_PICKUP")).toBe(false);
		expect(isConfirmReturnEligible("LOANED")).toBe(false);
		expect(isConfirmReturnEligible("FINALISED")).toBe(false);
		expect(isConfirmReturnEligible(undefined)).toBe(false);
	});
});

describe("confirming an item is back", () => {
	beforeEach(() => {
		post.mockReset();
	});

	it("posts to the request's confirm-returned transition", async () => {
		post.mockResolvedValue({ data: "id" });

		const outcome = await confirmItemReturned("https://dcb", "token", "pr-1");

		expect(outcome).toEqual({ kind: "confirmed" });
		expect(post).toHaveBeenCalledWith(
			"https://dcb/patrons/requests/pr-1/transition/confirm-returned",
			{},
			{ headers: { Authorization: "Bearer token" } },
		);
	});

	it("reports a refusal with the status the server named", async () => {
		post.mockRejectedValue(
			httpError(409, {
				detail: "This request is LOANED.",
				patronRequestStatus: "LOANED",
			}),
		);

		expect(await confirmItemReturned("https://dcb", "token", "pr-1")).toEqual({
			kind: "refused",
			status: "LOANED",
			detail: "This request is LOANED.",
		});
	});

	it("tells a library that is not the supplier from a missing request", async () => {
		post.mockRejectedValueOnce(httpError(403));
		post.mockRejectedValueOnce(httpError(404));

		expect(await confirmItemReturned("https://dcb", "t", "pr-1")).toEqual({
			kind: "forbidden",
		});
		expect(await confirmItemReturned("https://dcb", "t", "pr-1")).toEqual({
			kind: "notFound",
		});
	});

	it("reports any other failure, with the server's detail", async () => {
		post.mockRejectedValue(httpError(500, { detail: "still parked" }));

		expect(await confirmItemReturned("https://dcb", "t", "pr-1")).toEqual({
			kind: "failed",
			detail: "still parked",
		});
	});
});
