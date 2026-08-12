import { describe, it, expect } from "vitest";

import {
	HOST_LMS_CLASSES,
	buildClientConfig,
	clientConfigFieldsFor,
	clientConfigToFields,
	getHostLmsProfile,
	missingRecommendedClientConfig,
	missingRequiredClientConfig,
} from "./hostLmsClientConfig";

/**
 * These assertions are the frontend half of a contract that lives in
 * dcb-service's HostLmsConfigValidator. If that class gains or drops a required
 * key, one of these fails - which is the point.
 */
describe("hostLmsClientConfig", () => {
	describe("required fields per ILS", () => {
		it("demands everything HostLmsConfigValidator demands for Sierra", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.sierra,
				{},
			).map((problem) => problem.name);

			expect(missing).toEqual([
				"base-url",
				"key",
				"secret",
				"default-agency-code",
				"page-size",
			]);
		});

		it("demands both Alma URLs and the institution code", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.alma,
				{},
			).map((problem) => problem.name);

			expect(missing).toContain("base-url");
			expect(missing).toContain("alma-url");
			expect(missing).toContain("institution-code");
			expect(missing).toContain("apikey");
		});

		// Alma's sections are headings, not nested objects like Polaris' `papi`.
		// If one is ever marked required, buildClientConfig would start writing an
		// empty `almaConnection: {}` into the config dcb-service stores.
		it("keeps Alma's grouping out of the config it builds", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.alma, {
				"alma-url": "https://api-na.hosted.exlibrisgroup.com",
				"base-url": "https://example.alma.exlibrisgroup.com",
				apikey: "key",
				"institution-code": "01ABC_DEF",
				"default-agency-code": "example",
				"oai-set": "openrs-example",
				"metadata-prefix": "marc21",
			});

			expect(Object.keys(config)).toEqual([
				"alma-url",
				"base-url",
				"apikey",
				"default-agency-code",
				"institution-code",
				"oai-set",
				"metadata-prefix",
			]);
		});

		it("treats FOLIO's folio-tenant as a warning, not a blocker", () => {
			const config = {
				"base-url": "https://okapi.example.org",
				apikey: "abc",
				"default-agency-code": "EX",
			};

			expect(
				missingRequiredClientConfig(HOST_LMS_CLASSES.folio, config),
			).toEqual([]);
			expect(
				missingRecommendedClientConfig(HOST_LMS_CLASSES.folio, config).map(
					(problem) => problem.name,
				),
			).toContain("folio-tenant");
		});

		it("reports nested Polaris fields by their dotted path", () => {
			const missing = missingRequiredClientConfig(HOST_LMS_CLASSES.polaris, {
				"base-url": "https://polaris.example.org",
			}).map((problem) => problem.name);

			expect(missing).toContain("staff-password");
			expect(missing).not.toContain("base-url");
		});

		it("demands Koha's OAuth pair and virtual item codes", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.koha,
				{},
			).map((problem) => problem.name);

			// KohaClientConfig reads "api-url", not "base-url" like every other ILS.
			expect(missing).toContain("api-url");
			expect(missing).not.toContain("base-url");
			expect(missing).toContain("client_id");
			expect(missing).toContain("client_secret");
			expect(missing).toContain("sharing-library-code");
			expect(missing).toContain("virtual-item-library-code");
			expect(missing).toContain("virtual-item-location-code");
		});

		it("demands the NCIP endpoint and system id for an OpenRS appliance", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.orsAppliance,
				{},
			).map((problem) => problem.name);

			expect(missing).toContain("ncip-endpoint-url");
			expect(missing).toContain("ncip-system-id");
			// Defaults to the system id server-side, so it warns rather than blocks.
			expect(missing).not.toContain("ncip-agency-id");
		});

		it("does not force a protocol branch on the Foundation connector", () => {
			// base-protocol decides whether NCIP or SIP2 keys apply, and the form
			// cannot know which before the user picks - the backend validates the
			// branch the config selects.
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.foundation,
				{},
			).map((problem) => problem.name);

			expect(missing).toEqual(["default-agency-code"]);
		});

		it("points the OpenRS appliance at the concrete client class", () => {
			// The picker used to offer AbstractHostLmsClient, which is abstract and
			// could never have produced a working client.
			expect(HOST_LMS_CLASSES.orsAppliance).toBe(
				"org.olf.dcb.request.lifecycle.ncip.ORSApplianceHostLMS",
			);
			expect(getHostLmsProfile(HOST_LMS_CLASSES.orsAppliance)).toBeDefined();
		});

		it("has a profile for every class the picker offers", () => {
			for (const lmsClientClass of Object.values(HOST_LMS_CLASSES)) {
				expect(getHostLmsProfile(lmsClientClass)).toBeDefined();
			}
		});
	});

	describe("buildClientConfig", () => {
		it("coerces numbers and booleans, and trims strings", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.sierra, {
				"base-url": "  https://sierra.example.org  ",
				key: "k",
				secret: "s",
				"default-agency-code": "EX",
				"page-size": "100",
				ingest: true,
			});

			expect(config).toMatchObject({
				"base-url": "https://sierra.example.org",
				"page-size": 100,
				ingest: true,
			});
		});

		it("drops blank fields rather than sending empty strings", () => {
			// dcb-service treats a blank value as missing anyway, and a stored ""
			// is worse than an absent key.
			const config = buildClientConfig(HOST_LMS_CLASSES.sierra, {
				"base-url": "https://sierra.example.org",
				"patron-search-tag": "   ",
			});

			expect(config).not.toHaveProperty("patron-search-tag");
		});

		it("nests Polaris papi/services/item values", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.polaris, {
				"base-url": "https://polaris.example.org",
				papi: { "app-id": "1" },
			});

			expect(config.papi).toEqual({ "app-id": "1" });
		});

		it("emits the required nested objects even when left empty", () => {
			// The validator checks `config.get("papi") instanceof Map`, so the key
			// has to exist whether or not anything was filled in.
			const config = buildClientConfig(HOST_LMS_CLASSES.polaris, {
				"base-url": "https://polaris.example.org",
			});

			expect(config).toHaveProperty("papi");
			expect(config).toHaveProperty("services");
			expect(config).toHaveProperty("item");
		});

		it("returns an empty object for an unknown client class", () => {
			expect(buildClientConfig("com.example.Nope", { a: 1 })).toEqual({});
		});

		it("turns a comma-separated list into an array of strings", () => {
			// `roles` is shared across every ILS, so this holds wherever it is set.
			const config = buildClientConfig(HOST_LMS_CLASSES.sierra, {
				roles: "CATALOGUE, CIRCULATION",
			});

			expect(config.roles).toEqual(["CATALOGUE", "CIRCULATION"]);
		});

		it("drops blank entries from a list rather than storing empty strings", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.polaris, {
				contextHierarchy: "SLOUC, , POLARIS,",
			});

			expect(config.contextHierarchy).toEqual(["SLOUC", "POLARIS"]);
		});

		it("parses a JSON object field into a real object", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.polaris, {
				shelfLocationPolicyMap: '{"Reference Desk": "REFERENCE"}',
			});

			expect(config.shelfLocationPolicyMap).toEqual({
				"Reference Desk": "REFERENCE",
			});
		});

		it("omits a JSON object field that does not parse", () => {
			// Sending broken JSON would be stored verbatim as a string the backend
			// cannot read.
			const config = buildClientConfig(HOST_LMS_CLASSES.polaris, {
				shelfLocationPolicyMap: "{not json",
			});

			expect(config).not.toHaveProperty("shelfLocationPolicyMap");
		});
	});

	describe("the shared fields", () => {
		it("offers roles and ingest on every ILS", () => {
			for (const lmsClientClass of Object.values(HOST_LMS_CLASSES)) {
				const names = clientConfigFieldsFor(lmsClientClass).map((configField) =>
					configField.path.join("."),
				);
				expect(names, lmsClientClass).toContain("roles");
				expect(names, lmsClientClass).toContain("ingest");
			}
		});

		it("never makes a shared field required", () => {
			// They are conveniences, not part of any validator's contract.
			for (const lmsClientClass of Object.values(HOST_LMS_CLASSES)) {
				const required = missingRequiredClientConfig(lmsClientClass, {}).map(
					(problem) => problem.name,
				);
				expect(required).not.toContain("roles");
				expect(required).not.toContain("ingest");
			}
		});
	});

	describe("the Polaris profile against a real configuration", () => {
		// Taken from a working St Louis County Polaris host. Every key in it must
		// have a home in the guided form, or switching out of the JSON editor
		// silently discards it.
		const REAL_POLARIS_CONFIG = {
			item: {
				"fine-code-id": "1",
				"renewal-limit": "2",
				"barcode-prefix": "",
				"ill-location-id": 74,
				"history-action-id": "6",
				"shelving-scheme-id": "3",
				"loan-period-code-id": "8",
				"av-loan-period-code-id": "7",
			},
			papi: {
				"app-id": "100",
				"org-id": "1",
				"lang-id": "1033",
				"papi-version": "v1",
			},
			roles: ["CATALOGUE", "CIRCULATION"],
			ingest: true,
			"base-url": "https://stlouis-training.polarislibrary.com",
			services: {
				language: "eng",
				"product-id": "19",
				"site-domain": "polaris",
				"workstation-id": "1",
				"organisation-id": "37",
				"services-version": "v1",
				"patron-barcode-prefix": "OpenRs-",
			},
			"staff-ui":
				"https://stlouis-training.polarislibrary.com/leapwebappexternal/staff/default",
			"access-id": "an-access-id",
			"domain-id": "STLOUIS",
			"page-size": 100,
			"access-key": "an-access-key",
			"logon-user-id": "1",
			"staff-password": "a-password",
			"staff-username": "a-username",
			"logon-branch-id": "74",
			contextHierarchy: ["SLOUC", "MOBIUS-POLARIS", "POLARIS", "GLOBAL"],
			"default-agency-code": "6slou",
			shelfLocationPolicyMap: {
				Closed: "NO_LEND",
				Oversize: "REFERENCE",
				"Reference Desk": "REFERENCE",
			},
			"use-new-bib-chunk-ingest": true,
		};

		it("has a field for every key in it", () => {
			const { unmappedKeys } = clientConfigToFields(
				HOST_LMS_CLASSES.polaris,
				REAL_POLARIS_CONFIG,
			);

			expect(unmappedKeys).toEqual([]);
		});

		/**
		 * Scalars compared as text.
		 *
		 * PolarisConfig types the item and services values as `Object` and its
		 * `getT` helper coerces String<->Integer in both directions, so `"74"`
		 * and `74` are the same value to dcb-service. The guarantee worth making
		 * - and the one this asserts - is that a round trip through the guided
		 * form loses no key and changes no value's meaning.
		 */
		const asText = (node: any): any => {
			if (Array.isArray(node)) return node.map(asText);
			if (node && typeof node === "object")
				return Object.fromEntries(
					Object.entries(node).map(([key, value]) => [key, asText(value)]),
				);
			return typeof node === "boolean" ? node : String(node);
		};

		it("round-trips it without losing a key or changing a value", () => {
			const { values } = clientConfigToFields(
				HOST_LMS_CLASSES.polaris,
				REAL_POLARIS_CONFIG,
			);
			const rebuilt = buildClientConfig(HOST_LMS_CLASSES.polaris, values);

			expect(asText(rebuilt)).toEqual(
				asText({
					...REAL_POLARIS_CONFIG,
					// The one deliberate loss: a blank value is dropped rather than
					// stored as "".
					item: Object.fromEntries(
						Object.entries(REAL_POLARIS_CONFIG.item).filter(
							([key]) => key !== "barcode-prefix",
						),
					),
				}),
			);
		});

		it("keeps the types the backend is strict about", () => {
			const { values } = clientConfigToFields(
				HOST_LMS_CLASSES.polaris,
				REAL_POLARIS_CONFIG,
			);
			const rebuilt = buildClientConfig(HOST_LMS_CLASSES.polaris, values);

			// page-size is a declared Integer, ingest a Boolean, roles a
			// List<String> and shelfLocationPolicyMap a Map - unlike the item and
			// services values, these are not coerced on read.
			expect(rebuilt["page-size"]).toBe(100);
			expect(rebuilt.ingest).toBe(true);
			expect(rebuilt["use-new-bib-chunk-ingest"]).toBe(true);
			expect(rebuilt.roles).toEqual(["CATALOGUE", "CIRCULATION"]);
			expect(rebuilt.contextHierarchy).toEqual([
				"SLOUC",
				"MOBIUS-POLARIS",
				"POLARIS",
				"GLOBAL",
			]);
			expect(rebuilt.shelfLocationPolicyMap).toEqual(
				REAL_POLARIS_CONFIG.shelfLocationPolicyMap,
			);
		});

		it("accepts it as a complete configuration", () => {
			expect(
				missingRequiredClientConfig(
					HOST_LMS_CLASSES.polaris,
					REAL_POLARIS_CONFIG,
				),
			).toEqual([]);
		});
	});

	describe("clientConfigToFields", () => {
		it("round-trips a guided config back into form values", () => {
			const original = buildClientConfig(HOST_LMS_CLASSES.sierra, {
				"base-url": "https://sierra.example.org",
				key: "k",
				secret: "s",
				"default-agency-code": "EX",
				"page-size": "100",
			});

			const { values } = clientConfigToFields(
				HOST_LMS_CLASSES.sierra,
				original,
			);

			expect(buildClientConfig(HOST_LMS_CLASSES.sierra, values)).toEqual(
				original,
			);
		});

		it("names keys the guided form has no field for", () => {
			const { unmappedKeys } = clientConfigToFields(HOST_LMS_CLASSES.sierra, {
				"base-url": "https://sierra.example.org",
				"some-bespoke-flag": true,
			});

			expect(unmappedKeys).toEqual(["some-bespoke-flag"]);
		});
	});
});
