import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
	chunkReloadGuardKey,
	clearChunkReloadGuard,
	handleChunkPreloadError,
} from "./chunkReload";

// A Storage stand-in whose data keys are its only enumerable own properties, matching
// clearAppStorage.test.ts so both files fake storage the same way.
const makeStorage = () => {
	const data: Record<string, string> = {};
	Object.defineProperties(data, {
		getItem: { value: (k: string) => data[k] ?? null },
		setItem: {
			value: (k: string, v: string) => {
				data[k] = v;
			},
		},
		removeItem: {
			value: (k: string) => {
				delete data[k];
			},
		},
	});
	return data as unknown as Storage & Record<string, string>;
};

let session: ReturnType<typeof makeStorage>;
let reload: ReturnType<typeof vi.fn>;

const preloadError = () => {
	const prevented = { value: false };
	return {
		event: {
			preventDefault: () => {
				prevented.value = true;
			},
		} as unknown as Event,
		prevented,
	};
};

beforeEach(() => {
	session = makeStorage();
	reload = vi.fn();
	vi.stubGlobal("sessionStorage", session);
	vi.stubGlobal("window", { location: { reload } });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("chunk reload guard", () => {
	it("reloads once when a lazy chunk is missing, and swallows the error", () => {
		const { event, prevented } = preloadError();

		expect(handleChunkPreloadError(event)).toBe(true);

		expect(reload).toHaveBeenCalledTimes(1);
		expect(prevented.value).toBe(true);
		expect(session.getItem(chunkReloadGuardKey())).toBe("1");
	});

	// The reason the guard exists. Without it a shell that is itself broken refreshes
	// forever, and the user cannot read an error, open devtools or navigate away.
	it("does not reload a second time, and lets the error reach the route boundary", () => {
		handleChunkPreloadError(preloadError().event);
		reload.mockClear();

		const second = preloadError();
		expect(handleChunkPreloadError(second.event)).toBe(false);

		expect(reload).not.toHaveBeenCalled();
		// NOT prevented: the error must propagate so defaultErrorComponent renders a
		// translated page rather than the tab sitting blank.
		expect(second.prevented.value).toBe(false);
	});

	it("gives the next deploy its own single attempt once a navigation has resolved", () => {
		handleChunkPreloadError(preloadError().event);
		reload.mockClear();

		clearChunkReloadGuard();

		expect(handleChunkPreloadError(preloadError().event)).toBe(true);
		expect(reload).toHaveBeenCalledTimes(1);
	});

	// Sibling OpenRS apps share one sessionStorage when they are mounted under path
	// prefixes on one origin, so an unnamespaced key is one two apps can both claim.
	it("namespaces its key", () => {
		expect(chunkReloadGuardKey()).toMatch(/:chunk-reload-attempted$/);
	});
});
