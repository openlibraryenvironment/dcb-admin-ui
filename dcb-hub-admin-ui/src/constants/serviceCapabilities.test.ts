import { describe, expect, it, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
	SERVICE_CAPABILITIES,
	capabilityStatus,
	meetsServiceVersion,
	parseServiceVersion,
} from "@constants/serviceCapabilities";

afterEach(() => {
	vi.unstubAllGlobals();
});

const withFlags = (flags: Record<string, string>) =>
	vi.stubGlobal("window", { __APP_ENV__: flags });

const capability = (id: string) =>
	SERVICE_CAPABILITIES.find((entry) => entry.id === id)!;

describe("parseServiceVersion", () => {
	it("reads a plain release", () => {
		expect(parseServiceVersion("9.0.0")).toEqual([9, 0, 0]);
		expect(parseServiceVersion("8.71.0")).toEqual([8, 71, 0]);
	});

	it("reads a development build without pretending the suffix is a version", () => {
		expect(parseServiceVersion("9.1.0-SNAPSHOT")).toEqual([9, 1, 0]);
		expect(parseServiceVersion("v9.0.0")).toEqual([9, 0, 0]);
	});

	it("refuses to guess at anything else", () => {
		// A wrong comparison shown next to a flag is worse than none, because
		// somebody would act on it.
		for (const value of [null, undefined, "", "Unknown", "main", "9.0"]) {
			expect(parseServiceVersion(value)).toBeNull();
		}
	});
});

describe("meetsServiceVersion", () => {
	it("is inclusive of the named release", () => {
		expect(meetsServiceVersion("9.0.0", "9.0.0")).toBe(true);
	});

	it("orders by component, not by string", () => {
		// The reason this is not a string compare: "8.71.0" > "8.9.0" lexically.
		expect(meetsServiceVersion("8.71.0", "9.0.0")).toBe(false);
		expect(meetsServiceVersion("9.0.1", "9.0.0")).toBe(true);
		expect(meetsServiceVersion("8.71.0", "8.9.0")).toBe(true);
	});

	it("answers null when the version cannot be read", () => {
		expect(meetsServiceVersion("Unknown", "9.0.0")).toBeNull();
		expect(meetsServiceVersion(null, "9.0.0")).toBeNull();
	});

	it("is false, not null, for a capability no release serves", () => {
		expect(meetsServiceVersion("9.0.0", null)).toBe(false);
	});
});

describe("capabilityStatus", () => {
	const branding = () => capability("consortium_branding");

	it("reports the switch as due once the service is new enough", () => {
		withFlags({ VITE_FEATURE_CONSORTIUM_BRANDING: "false" });
		expect(capabilityStatus(branding(), "9.0.0")).toBe("available");
	});

	it("reports a flag switched on ahead of the upgrade", () => {
		// The state in which a feature fails in ways that look like a bug, and the
		// state nothing else in the application would report.
		withFlags({ VITE_FEATURE_CONSORTIUM_BRANDING: "true" });
		expect(capabilityStatus(branding(), "8.71.0")).toBe("premature");
	});

	it("reports the ordinary before-and-after states", () => {
		withFlags({ VITE_FEATURE_CONSORTIUM_BRANDING: "false" });
		expect(capabilityStatus(branding(), "8.71.0")).toBe("unavailable");

		withFlags({ VITE_FEATURE_CONSORTIUM_BRANDING: "true" });
		expect(capabilityStatus(branding(), "9.0.0")).toBe("ready");
	});

	it("asserts nothing when the version could not be read", () => {
		withFlags({ VITE_FEATURE_CONSORTIUM_BRANDING: "true" });
		expect(capabilityStatus(branding(), null)).toBe("unknown");
	});
});

describe("the matrix describes every flag, and only real ones", () => {
	const declared = readFileSync(
		path.resolve(process.cwd(), "src/helpers/featureFlags.ts"),
		"utf8",
	);

	const declaredFlags = [
		...declared.matchAll(/readFlag\(\s*"([A-Z0-9_]+)"\s*\)/g),
	].map((match) => match[1]);

	it("finds the flags", () => {
		expect(declaredFlags.length).toBeGreaterThan(0);
	});

	it("lists every declared flag", () => {
		// A flag added without a row here is a feature whose version threshold nobody
		// can look up, which is the thing this panel exists to prevent.
		expect(SERVICE_CAPABILITIES.map((entry) => entry.flag).sort()).toEqual(
			declaredFlags.slice().sort(),
		);
	});

	it("gives every capability a translated label", () => {
		const strings = readFileSync(
			path.resolve(process.cwd(), "src/locales/en-GB/application.json"),
			"utf8",
		);
		const copy = JSON.parse(strings).service_capabilities;

		for (const entry of SERVICE_CAPABILITIES) {
			expect(copy.feature, entry.id).toHaveProperty(entry.id);
		}
	});
});
