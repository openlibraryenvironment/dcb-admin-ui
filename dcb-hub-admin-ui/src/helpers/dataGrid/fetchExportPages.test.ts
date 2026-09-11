import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchExportPages } from "./fetchExportPages";
import { ServerGridQueryVars } from "@helpers/dataGrid/utilities";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("graphql-request", () => ({ request }));

const PAGE_SIZE = 1000;
const VARS: ServerGridQueryVars = {
	query: "",
	pageno: 0,
	pagesize: PAGE_SIZE,
	order: "dateCreated",
	orderBy: "DESC",
};

/** A ClientError as graphql-request raises it: the status hangs off `response`. */
const httpError = (status: number) =>
	Object.assign(new Error(`HTTP ${status}`), { response: { status } });

const page = (rows: number, totalSize: number) => ({
	patronRequests: {
		content: Array.from({ length: rows }, (_, i) => ({ id: `row-${i}` })),
		totalSize,
	},
});

const run = (
	overrides: Partial<Parameters<typeof fetchExportPages>[0]> = {},
) => {
	const pages: any[][] = [];
	const progress: Array<[number, number]> = [];
	return {
		pages,
		progress,
		result: fetchExportPages({
			endpoint: "https://dcb.example/graphql",
			query: "query {}",
			coreType: "patronRequests",
			variables: VARS,
			authHeaders: () => ({ Authorization: "Bearer token-1" }),
			renewSession: async () => undefined,
			onPage: (rows) => pages.push(rows),
			onProgress: (fetched, total) => progress.push([fetched, total]),
			signal: new AbortController().signal,
			...overrides,
		}),
	};
};

beforeEach(() => {
	request.mockReset();
});

describe("fetchExportPages", () => {
	it("pages through the whole result set and reports progress", async () => {
		request
			.mockResolvedValueOnce(page(PAGE_SIZE, 2500))
			.mockResolvedValueOnce(page(PAGE_SIZE, 2500))
			.mockResolvedValueOnce(page(500, 2500));

		const { pages, progress, result } = run();

		await expect(result).resolves.toBe(2500);
		expect(pages).toHaveLength(3);
		expect(progress).toEqual([
			[1000, 2500],
			[2000, 2500],
			[2500, 2500],
		]);
		expect(request.mock.calls.map((c) => c[0].variables.pageno)).toEqual([
			0, 1, 2,
		]);
	});

	/**
	 * A server that accepts one token, then ages it out: only a renewed token is
	 * accepted from the second request on. This is the reported 2.0 failure in
	 * miniature - a six-figure export outlives the Keycloak access token.
	 */
	const tokenExpiringAfterFirstPage = () => {
		let serverToken = "token-1";
		let clientToken = "token-1";

		request.mockImplementation(async ({ requestHeaders, variables }: any) => {
			if (requestHeaders.Authorization !== `Bearer ${serverToken}`) {
				throw httpError(401);
			}
			serverToken = "token-2";
			return page(variables.pageno === 2 ? 500 : PAGE_SIZE, 2500);
		});

		return {
			/** Resolved per request, so a renewal reaches the next page. */
			liveHeaders: () => ({ Authorization: `Bearer ${clientToken}` }),
			/** Built once, as the hook used to before this change. */
			capturedHeaders: { Authorization: `Bearer ${clientToken}` },
			renewSession: vi.fn(async () => {
				clientToken = "token-2";
			}),
		};
	};

	it("renews the session and retries the page when the access token expires mid-export", async () => {
		const server = tokenExpiringAfterFirstPage();

		const { pages, result } = run({
			authHeaders: server.liveHeaders,
			renewSession: server.renewSession,
		});

		await expect(result).resolves.toBe(2500);
		expect(server.renewSession).toHaveBeenCalledTimes(1);
		expect(pages).toHaveLength(3);
	});

	it("fails part-way through if the headers are captured once, which was the defect", async () => {
		const server = tokenExpiringAfterFirstPage();

		const { pages, result } = run({
			authHeaders: () => server.capturedHeaders,
			renewSession: server.renewSession,
		});

		// Renewal happens, but the stale header object is sent again and 401s.
		await expect(result).rejects.toMatchObject({ response: { status: 401 } });
		expect(pages).toHaveLength(1);
	});

	it("gives up when the renewal does not produce a working token", async () => {
		request
			.mockResolvedValueOnce(page(PAGE_SIZE, 2000))
			.mockRejectedValue(httpError(401));

		const renewSession = vi.fn(async () => undefined);
		const { result } = run({ renewSession });

		await expect(result).rejects.toMatchObject({ response: { status: 401 } });
		expect(renewSession).toHaveBeenCalledTimes(1);
	});

	it("retries a transient 502 rather than discarding the export", async () => {
		request
			.mockResolvedValueOnce(page(PAGE_SIZE, 2000))
			.mockRejectedValueOnce(httpError(502))
			.mockResolvedValueOnce(page(PAGE_SIZE, 2000));

		const { pages, result } = run();

		await expect(result).resolves.toBe(2000);
		expect(pages).toHaveLength(2);
		expect(request).toHaveBeenCalledTimes(3);
	});

	it("does not retry a 400 - a malformed query will not fix itself", async () => {
		request
			.mockResolvedValueOnce(page(PAGE_SIZE, 2000))
			.mockRejectedValue(httpError(400));

		const { result } = run();

		await expect(result).rejects.toMatchObject({ response: { status: 400 } });
		expect(request).toHaveBeenCalledTimes(2);
	});

	it("stops at the abort signal instead of running to the last page", async () => {
		const controller = new AbortController();
		request.mockImplementation(async ({ variables }: any) => {
			if (variables.pageno === 1) controller.abort();
			return page(PAGE_SIZE, 10000);
		});

		const { result } = run({ signal: controller.signal });

		await expect(result).rejects.toMatchObject({ name: "AbortError" });
	});

	it("stops when the result set shrinks under it and a page comes back empty", async () => {
		request
			.mockResolvedValueOnce(page(PAGE_SIZE, 5000))
			.mockResolvedValueOnce(page(0, 5000));

		const { pages, result } = run();

		await expect(result).resolves.toBe(1000);
		expect(pages).toHaveLength(1);
	});
});
