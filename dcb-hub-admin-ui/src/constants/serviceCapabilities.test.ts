import { describe, expect, it, afterEach, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { buildSchema, type GraphQLSchema } from "graphql";

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

/**
 * The registry has to be TRUE, not merely tidy — R-19.
 *
 * `since: "9.0.0"` is a claim about a dcb-service release. If it is wrong nothing else
 * catches it: the flag gets switched on at the upgrade and the feature fails in an
 * environment, which is the expensive place to find out. So the claim is checked against
 * the schemas of the releases themselves, committed next to this application.
 *
 * This is what makes the mechanism extendable rather than a one-off. To gate the next
 * feature — the local-holds work waiting on a dcb-service after 9.0.0, say — add a row
 * with its `fields`, commit that release's schema as `schema.v<version>.graphqls`, and
 * these tests either agree with you or fail.
 */

/** Every release schema committed here, oldest first. */
const SUPPORTED_RELEASES = ["8.71.0", "9.0.0"] as const;

const schemaFile = (version: string) =>
	path.resolve(process.cwd(), `schema.v${version}.graphqls`);

const schemaFor = (version: string): GraphQLSchema | null =>
	existsSync(schemaFile(version))
		? buildSchema(readFileSync(schemaFile(version), "utf8"))
		: null;

/** The newest schema this app targets. See schema.graphqls's own header. */
const MAIN = buildSchema(
	readFileSync(path.resolve(process.cwd(), "schema.graphqls"), "utf8"),
);

/** Whether `schema` declares `field` on `type`, for object and input types alike. */
const declaresField = (
	schema: GraphQLSchema,
	type: string,
	field: string,
): boolean => {
	const named = schema.getType(type) as
		{ getFields?: () => Record<string, unknown> } | null | undefined;

	return Boolean(named?.getFields && field in named.getFields());
};

/** The newest committed release strictly older than `version`. */
const releaseBefore = (version: string): string | null => {
	const index = SUPPORTED_RELEASES.indexOf(
		version as (typeof SUPPORTED_RELEASES)[number],
	);
	return index > 0 ? SUPPORTED_RELEASES[index - 1] : null;
};

describe("every capability names a release that really has its fields", () => {
	it.each(SUPPORTED_RELEASES)("schema.v%s.graphqls is committed", (version) => {
		// Guards the guard: without the file every assertion below skips silently and
		// the registry goes back to being unchecked prose.
		expect(schemaFor(version), schemaFile(version)).not.toBeNull();
	});

	const withFields = SERVICE_CAPABILITIES.filter(
		(entry) => Object.keys(entry.fields).length > 0,
	);

	/** Capabilities a committed release actually serves. */
	const released = withFields.filter((entry) => entry.since !== null);

	it("there is something to check", () => {
		expect(withFields.length).toBeGreaterThan(0);
		expect(released.length).toBeGreaterThan(0);
	});

	it.each(released)("$id: since names a release we hold", (entry) => {
		expect(SUPPORTED_RELEASES as readonly string[]).toContain(entry.since);
	});

	it.each(released)("$id: its fields exist in that release", (entry) => {
		const schema = schemaFor(entry.since!)!;

		for (const [type, fields] of Object.entries(entry.fields)) {
			for (const field of fields) {
				expect(
					declaresField(schema, type, field),
					`${type}.${field} is not in dcb-service ${entry.since}`,
				).toBe(true);
			}
		}
	});

	it.each(released)(
		"$id: its fields are absent from the release before",
		(entry) => {
			// The half that catches a threshold set too LATE - a capability gated behind a
			// release newer than the one that actually serves it stays hidden on deployments
			// that could run it, which is a silent loss rather than a failure.
			const previous = releaseBefore(entry.since!);
			if (previous === null) return;

			const schema = schemaFor(previous)!;

			for (const [type, fields] of Object.entries(entry.fields)) {
				for (const field of fields) {
					expect(
						declaresField(schema, type, field),
						`${type}.${field} already exists in dcb-service ${previous}`,
					).toBe(false);
				}
			}
		},
	);

	it.each(withFields)(
		"$id: its fields still exist in the target schema",
		(entry) => {
			// A field renamed again server-side would otherwise leave this capability
			// switched on and failing against the NEWEST deployment we build for - the same
			// defect in the other direction.
			for (const [type, fields] of Object.entries(entry.fields)) {
				for (const field of fields) {
					expect(
						declaresField(MAIN, type, field),
						`${type}.${field} is no longer in the target schema`,
					).toBe(true);
				}
			}
		},
	);

	it.each(released)(
		"$id: its fallback exists in the older release",
		(entry) => {
			if (!entry.fallback) return;
			const previous = releaseBefore(entry.since!);
			if (previous === null) return;

			const schema = schemaFor(previous)!;

			for (const [type, fields] of Object.entries(entry.fallback)) {
				for (const field of fields) {
					expect(
						declaresField(schema, type, field),
						`fallback ${type}.${field} is not in dcb-service ${previous} either`,
					).toBe(true);
				}
			}
		},
	);
});

/**
 * The half that makes `since: null` mean something.
 *
 * A capability waiting on an unmerged dcb-service branch — the DCB Admin for Libraries
 * account provisioning API, today — is the case the flags exist for: on in a dev
 * environment tracking that branch, off everywhere else, switched with an environment
 * variable rather than a release. `since: null` is what tells the Service Info panel to
 * say "no release serves this yet", and it has to stay true.
 *
 * So it is checked from both sides. The fields must be in the schema this app targets,
 * which catches a typo or a server-side rename in the ordinary way; and they must be in
 * NONE of the releases we hold, which is the interesting half. Committing the schema of
 * the release that finally ships one of these turns that assertion red, and the failure
 * names the capability whose `since` has to be filled in. Without it the flag would stay
 * marked "unreleased" indefinitely and the panel would keep telling operators not to
 * switch on a feature their deployment could already serve.
 */
describe("every unreleased capability really is unreleased", () => {
	const unreleased = SERVICE_CAPABILITIES.filter(
		(entry) => entry.since === null && Object.keys(entry.fields).length > 0,
	);

	it("there is something to check", () => {
		expect(unreleased.length).toBeGreaterThan(0);
	});

	it.each(unreleased)("$id: its fields exist in the target schema", (entry) => {
		for (const [type, fields] of Object.entries(entry.fields)) {
			for (const field of fields) {
				expect(
					declaresField(MAIN, type, field),
					`${type}.${field} is not in schema.graphqls — see its header for which ref that is`,
				).toBe(true);
			}
		}
	});

	it.each(unreleased)("$id: no release we hold serves them yet", (entry) => {
		for (const version of SUPPORTED_RELEASES) {
			const schema = schemaFor(version)!;

			for (const [type, fields] of Object.entries(entry.fields)) {
				for (const field of fields) {
					expect(
						declaresField(schema, type, field),
						`${type}.${field} IS in dcb-service ${version}: set ${entry.id}'s since to it`,
					).toBe(false);
				}
			}
		}
	});
});
