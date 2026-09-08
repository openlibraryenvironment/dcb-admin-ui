import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { DEFAULT_DISPLAY } from "@themes/display";
import { DEFAULT_FONT } from "@themes/fonts";
import { storageKey } from "@helpers/appBase";

// A Storage stand-in whose data keys are its only enumerable own properties, matching
// clearAppStorage.test.ts so every file here fakes storage the same way.
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

let local: ReturnType<typeof makeStorage>;

/**
 * Load the store fresh against a seeded localStorage.
 *
 * Zustand's `persist` reads storage at MODULE EVALUATION, so a stored value has to be in
 * place before the import - which is why this resets the module registry rather than
 * calling a setter. That is also the code path the tolerance below actually protects: the
 * setters never run for a value that arrives from storage.
 */
async function loadStoreWith(persisted: unknown) {
	if (persisted !== undefined) {
		local.setItem(
			storageKey("dcb-admin-theme"),
			JSON.stringify({ state: persisted, version: 0 }),
		);
	}
	vi.resetModules();
	const { useThemeStore } = await import("./useThemeStore");
	// Returned as the STORE, never as a getState() snapshot. Hydration REPLACES the
	// state object, so a snapshot taken at import time is the pre-hydration one, and
	// every assertion would read the defaults it is meant to be checking against.
	return useThemeStore;
}

beforeEach(() => {
	local = makeStorage();
	vi.stubGlobal("localStorage", local);
	vi.stubGlobal("sessionStorage", makeStorage());
	// zustand's persist defaults to `createJSONStorage(() => WINDOW.localStorage)` - not
	// the bare global. With no `window` it catches the ReferenceError, treats storage as
	// unavailable and silently degrades to an unpersisted store, so every assertion here
	// would pass against defaults and prove nothing.
	vi.stubGlobal("window", { localStorage: local });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe("theme preference defaults", () => {
	it("starts with no mode chosen, so the device decides", () => {
		// NOT "light", and not a value sampled from prefers-color-scheme at module
		// scope. That is what this replaces: the old store wrote a concrete mode on the
		// first render, after which the OS switching to dark at sunset did nothing, and
		// prefers-contrast was never consulted at all.
		return loadStoreWith(undefined).then((store) => {
			expect(store.getState().mode).toBeNull();
			expect(store.getState().themeName).toBe("openRS");
			expect(store.getState().fontName).toBe(DEFAULT_FONT);
			expect(store.getState().textSize).toBe(DEFAULT_DISPLAY.textSize);
			expect(store.getState().density).toBe(DEFAULT_DISPLAY.density);
			expect(store.getState().motion).toBe(DEFAULT_DISPLAY.motion);
		});
	});
});

describe("rehydrating a stored preference", () => {
	it("keeps an existing user's mode rather than resetting them to the device", async () => {
		// Every current user has "light" or "dark" persisted by the old seeding. It is
		// honoured as a choice: they keep what they were seeing, and one visit to the
		// picker puts them on "match my device". The other direction would change the
		// appearance of every deployment on upgrade.
		const store = await loadStoreWith({ themeName: "mobius", mode: "dark" });

		expect(store.getState().mode).toBe("dark");
		expect(store.getState().themeName).toBe("mobius");
	});

	it("fills in settings that did not exist when the preference was written", async () => {
		const store = await loadStoreWith({ themeName: "openRS", mode: "light" });

		expect(store.getState().textSize).toBe("normal");
		expect(store.getState().density).toBe("comfortable");
		expect(store.getState().motion).toBe("system");
	});

	it("falls back rather than putting an unknown value into a CSS declaration", async () => {
		// A preference written by a later build, or edited by hand. No setter has run on
		// any of this, so `merge` is the only thing that can catch it.
		const store = await loadStoreWith({
			mode: "neon",
			fontName: "comic",
			textSize: "enormous",
			density: "airy",
			motion: "spinny",
		});

		expect(store.getState().mode).toBeNull();
		expect(store.getState().fontName).toBe(DEFAULT_FONT);
		expect(store.getState().textSize).toBe("normal");
		expect(store.getState().density).toBe("comfortable");
		expect(store.getState().motion).toBe("system");
	});
});

describe("setters and reset", () => {
	it("stores null when asked to follow the device", async () => {
		const store = await loadStoreWith({ mode: "dark" });

		store.getState().setMode(null);
		expect(store.getState().mode).toBeNull();
	});

	it("refuses a mode it does not ship rather than storing it", async () => {
		const store = await loadStoreWith(undefined);

		store.getState().setMode("neon" as never);
		expect(store.getState().mode).toBeNull();
	});

	it("resets the display settings and the typeface, but not the brand", async () => {
		// The brand is a deployment's identity rather than an accessibility setting, and
		// resetting it would surprise somebody who only wanted their text size back.
		const store = await loadStoreWith({ themeName: "koha" });

		store.getState().setTextSize("largest");
		store.getState().setDensity("compact");
		store.getState().setFontName("lexend");
		store.getState().resetDisplay();

		expect(store.getState().textSize).toBe("normal");
		expect(store.getState().density).toBe("comfortable");
		expect(store.getState().motion).toBe("system");
		expect(store.getState().fontName).toBe(DEFAULT_FONT);
		expect(store.getState().themeName).toBe("koha");
	});
});
