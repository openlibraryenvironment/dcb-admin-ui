import { request } from "graphql-request";
import { ServerGridQueryVars } from "@helpers/dataGrid/utilities";

/** Pages beyond the first are retried this many times before the export fails. */
const MAX_RETRIES = 3;
/** First backoff step; doubled per attempt (500ms, 1s, 2s). */
const RETRY_BASE_DELAY_MS = 500;

export interface FetchExportPagesOptions {
	endpoint: string;
	/** GraphQL document returning the paged connection for this grid. */
	query: any;
	/** Response key holding the paged connection, e.g. "patronRequests". */
	coreType: string;
	/** Page 0's variables; `pageno` is overwritten per page. */
	variables: ServerGridQueryVars;
	/**
	 * Read at call time, never captured: a six-figure export runs for longer than
	 * a Keycloak access token lives, so a header object built once sends an
	 * expired token for every page after the first renewal.
	 */
	authHeaders: () => Record<string, string>;
	/** One silent OIDC renewal, tried once per page against a 401. */
	renewSession: () => Promise<unknown>;
	/** Called with each page's rows; the caller must not retain them. */
	onPage: (rows: any[]) => void;
	onProgress: (fetched: number, totalSize: number) => void;
	signal: AbortSignal;
}

const abortError = (signal: AbortSignal): unknown =>
	signal.reason ?? new DOMException("Export cancelled", "AbortError");

export const isAbortError = (error: any): boolean =>
	error?.name === "AbortError";

const delay = (ms: number, signal: AbortSignal): Promise<void> =>
	new Promise((resolve, reject) => {
		const onAbort = () => {
			clearTimeout(timer);
			reject(abortError(signal));
		};
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		signal.addEventListener("abort", onAbort, { once: true });
	});

/** A transport failure or an overloaded server; a 4xx is the caller's fault. */
const isRetryable = (status?: number): boolean =>
	status === undefined || status === 429 || status >= 500;

/**
 * Pages through a server-driven grid's whole result set, handing each page to
 * `onPage` and retaining nothing. Returns the number of rows fetched.
 *
 * Sequential, token-per-request and retried: docs/large-exports.md has the
 * measurements those three answer to.
 */
export const fetchExportPages = async ({
	endpoint,
	query,
	coreType,
	variables,
	authHeaders,
	renewSession,
	onPage,
	onProgress,
	signal,
}: FetchExportPagesOptions): Promise<number> => {
	const pageSize = variables.pagesize;

	const fetchPage = async (pageno: number): Promise<any> => {
		let renewed = false;

		for (let attempt = 0; ; attempt++) {
			if (signal.aborted) throw abortError(signal);
			try {
				return await request<any>({
					url: endpoint,
					document: query,
					variables: { ...variables, pageno },
					requestHeaders: authHeaders(),
					signal,
				});
			} catch (error: any) {
				if (signal.aborted) throw abortError(signal);
				const status = error?.response?.status;

				// A 401 mid-export is an access token that aged out during the run,
				// not a dead session - the same reasoning as application.tsx's
				// recoverSession, which this path cannot reach because the export
				// deliberately bypasses TanStack Query.
				if (status === 401 && !renewed) {
					renewed = true;
					await renewSession();
					continue;
				}

				if (attempt >= MAX_RETRIES || !isRetryable(status)) throw error;
				await delay(RETRY_BASE_DELAY_MS * 2 ** attempt, signal);
			}
		}
	};

	const initial = await fetchPage(0);
	const totalSize: number = initial?.[coreType]?.totalSize || 0;
	const firstPage: any[] = initial?.[coreType]?.content ?? [];

	onPage(firstPage);
	let fetched = firstPage.length;
	onProgress(fetched, totalSize);

	const totalPages = Math.ceil(totalSize / pageSize);
	for (let page = 1; page < totalPages; page++) {
		const next = await fetchPage(page);
		const rows: any[] = next?.[coreType]?.content ?? [];

		// A short page means the result set shrank under us (requests move between
		// tabs while an export runs). Stop rather than pad the file with blanks.
		if (rows.length === 0) break;

		onPage(rows);
		fetched += rows.length;
		onProgress(fetched, totalSize);
	}

	return fetched;
};
