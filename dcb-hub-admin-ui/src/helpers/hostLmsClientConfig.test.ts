import { describe, it, expect } from "vitest";

import {
	HOST_LMS_CLASSES,
	HOST_LMS_PROFILES,
	buildClientConfig,
	clientConfigFieldsFor,
	clientConfigToFields,
	getHostLmsProfile,
	hasSharedSystemConflict,
	isAdvancedField,
	missingRecommendedClientConfig,
	missingRequiredClientConfig,
	mergeClientConfigEdit,
	originOf,
} from "./hostLmsClientConfig";
import ADAPTER_DEFAULTS from "../../host-lms-defaults.json";
import application from "@/locales/en-GB/application.json";

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

		it("demands everything HostLmsConfigValidator demands for Alma", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.alma,
				{},
			).map((problem) => problem.name);

			expect([...missing].sort()).toEqual(
				[
					"alma-url",
					"apikey",
					"base-url",
					"default-agency-code",
					"institution-code",
					"request-cancellation-reason",
					"sharing-library-code",
					"virtual-item-library-code",
					"virtual-item-location-code",
				].sort(),
			);
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

		it("accepts a FOLIO config with only what FOLIO requires", () => {
			const config = {
				"base-url": "https://okapi.example.org",
				apikey: "abc",
				"default-agency-code": "EX",
				"record-syntax": "oai_dc",
			};

			expect(
				missingRequiredClientConfig(HOST_LMS_CLASSES.folio, config),
			).toEqual([]);
			expect(
				missingRecommendedClientConfig(HOST_LMS_CLASSES.folio, config),
			).toEqual([]);
		});

		it("never requires the FOLIO harvest settings dcb-service defaults", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.folio,
				{},
			).map((problem) => problem.name);

			expect(missing).not.toContain("record-syntax");
			expect(missing).not.toContain("metadata-prefix");
		});

		it("reports nested Polaris fields by their dotted path", () => {
			const missing = missingRequiredClientConfig(HOST_LMS_CLASSES.polaris, {
				"base-url": "https://polaris.example.org",
			}).map((problem) => problem.name);

			expect(missing).toContain("staff-password");
			expect(missing).not.toContain("base-url");
		});

		it("demands everything HostLmsConfigValidator demands for Polaris", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.polaris,
				{},
			).map((problem) => problem.name);

			expect([...missing].sort()).toEqual(
				[
					"base-url",
					"access-id",
					"access-key",
					"domain-id",
					"logon-branch-id",
					"logon-user-id",
					"staff-username",
					"staff-password",
					"default-agency-code",
					"services.organisation-id",
					"item.ill-location-id",
					"item.fine-code-id",
					"item.history-action-id",
					"item.shelving-scheme-id",
					"item.loan-period-code-id",
					"item.av-loan-period-code-id",
					"item.renewal-limit",
				].sort(),
			);
		});

		it("demands Koha's OAuth pair and virtual item library", () => {
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
			// KohaHostLmsClient.createItem sets the branch and nothing else, so this
			// was required configuration nothing read. Alma's is real and stays.
			expect(missing).not.toContain("virtual-item-location-code");
		});

		/**
		 * Koha is the one ILS needing two URLs: `api-url` for the REST API, commonly
		 * the staff interface, and `base-url` for the OPAC, which is where oai.pl
		 * lives. The form asked for neither `base-url` nor `metadata-prefix`, so every
		 * Koha created through it had a KohaOaiPmhIngestSource that threw on
		 * construction - a Host LMS that pinged and never harvested.
		 */
		it("asks for the OAI keys a Koha harvest cannot be constructed without", () => {
			const paths = clientConfigFieldsFor(HOST_LMS_CLASSES.koha).map((field) =>
				field.path.join("."),
			);

			expect(paths).toContain("base-url");
			expect(paths).toContain("metadata-prefix");
			expect(paths).toContain("oai-set");
			expect(paths).toContain("oai-path");
		});

		it("warns about the Koha OAI keys rather than blocking submission", () => {
			// dcb-service warns rather than rejecting, because a member that only
			// borrows is legitimately created with ingest off.
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.koha,
				{},
			).map((problem) => problem.name);
			const recommended = missingRecommendedClientConfig(
				HOST_LMS_CLASSES.koha,
				{},
			).map((problem) => problem.name);

			expect(missing).not.toContain("base-url");
			expect(missing).not.toContain("metadata-prefix");
			expect(recommended).toContain("base-url");
			expect(recommended).toContain("metadata-prefix");
		});

		it("writes the Koha OAI keys at the top level, not into a nested group", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.koha, {
				"api-url": "https://koha.example.org",
				client_id: "id",
				client_secret: "secret",
				"sharing-library-code": "DCB",
				"virtual-item-library-code": "DCB",
				"base-url": "https://catalogue.example.org",
				"metadata-prefix": "marcxml",
			});

			expect(config["base-url"]).toBe("https://catalogue.example.org");
			expect(config["metadata-prefix"]).toBe("marcxml");
			// The harvesting group is a heading, so it must not appear as a key -
			// dcb-service would store an object no adapter reads.
			expect(config).not.toHaveProperty("kohaConnection");
			// Omitted rather than sent as "": Koha only filters by set when the
			// request carries one, and a blank set would harvest nothing.
			expect(config).not.toHaveProperty("oai-set");
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

		// Mirrors HostLmsConfigValidator.validateFoundation, branch by branch
		it("requires the NCIP endpoint on a Foundation host that speaks NCIP, the default", () => {
			const missing = missingRequiredClientConfig(
				HOST_LMS_CLASSES.foundation,
				{},
			).map((problem) => problem.name);

			expect(missing.sort()).toEqual([
				"default-agency-code",
				"ncip-endpoint-url",
			]);
		});

		it("requires the socket, not the endpoint, on a Foundation host that speaks SIP2", () => {
			const missing = missingRequiredClientConfig(HOST_LMS_CLASSES.foundation, {
				"base-protocol": "SIP2",
			}).map((problem) => problem.name);

			expect(missing.sort()).toEqual([
				"default-agency-code",
				"sip2.host",
				"sip2.port",
			]);
		});

		it("requires the JWT settings only when the appliance requires signed requests", () => {
			const missing = (values: object) =>
				missingRequiredClientConfig(HOST_LMS_CLASSES.orsAppliance, values).map(
					(problem) => problem.name,
				);

			expect(missing({})).not.toContain("ncip-peer-issuer");
			expect(missing({ "ncip-peer-auth-mode": "JWT_REQUIRED" })).toEqual(
				expect.arrayContaining([
					"ncip-peer-issuer",
					"ncip-peer-jwks-url",
					"ncip-peer-audience",
				]),
			);
		});

		it("offers exactly Ex Libris' six regional gateways for Alma", () => {
			const almaUrl = clientConfigFieldsFor(HOST_LMS_CLASSES.alma).find(
				(configField) => configField.path.join(".") === "alma-url",
			);

			expect(almaUrl?.type).toBe("select");
			expect(almaUrl?.options?.map((option) => option.value)).toEqual([
				"https://api-na.hosted.exlibrisgroup.com",
				"https://api-eu.hosted.exlibrisgroup.com",
				"https://api-ap.hosted.exlibrisgroup.com",
				"https://api-aps.hosted.exlibrisgroup.com",
				"https://api-ca.hosted.exlibrisgroup.com",
				"https://api-cn.hosted.exlibrisgroup.com.cn",
			]);
		});

		// HostLmsRepository.findParentsByIds matches these two strings in SQL
		it("offers exactly the two roles the parent and child resolution reads", () => {
			const roles = clientConfigFieldsFor(HOST_LMS_CLASSES.sierra).find(
				(configField) => configField.path.join(".") === "roles",
			);

			expect(roles?.options?.map((option) => option.value)).toEqual([
				"CATALOGUE",
				"CIRCULATION",
			]);
			expect(
				buildClientConfig(HOST_LMS_CLASSES.sierra, { roles: ["CIRCULATION"] })
					.roles,
			).toEqual(["CIRCULATION"]);
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

	/**
	 * A shared Host LMS was unrepresentable through the guided form: there was no
	 * `shared-system` field to set, and `default-agency-code` was unconditionally
	 * required - so the form would not submit without the one key dcb-service returns
	 * 400 for when the flag is set. Both scenarios the flag exists for, a Koha with
	 * sixty members and a Sierra shared with a non-participant, needed the JSON editor.
	 */
	describe("shared systems", () => {
		it("offers the flag on every ILS, because any of them can be shared", () => {
			for (const lmsClientClass of Object.values(HOST_LMS_CLASSES)) {
				const paths = clientConfigFieldsFor(lmsClientClass).map((configField) =>
					configField.path.join("."),
				);

				expect(paths).toContain("shared-system");
				// Layered mappings are how a shared system avoids repeating a mapping
				// per co-tenant. This used to be offered on Polaris alone.
				expect(paths).toContain("contextHierarchy");
			}
		});

		it("stops requiring a default agency once the system is shared", () => {
			const shared = { "shared-system": true };

			for (const lmsClientClass of [
				HOST_LMS_CLASSES.sierra,
				HOST_LMS_CLASSES.koha,
				HOST_LMS_CLASSES.alma,
				HOST_LMS_CLASSES.folio,
				HOST_LMS_CLASSES.polaris,
				HOST_LMS_CLASSES.foundation,
			]) {
				expect(
					missingRequiredClientConfig(lmsClientClass, shared).map(
						(problem) => problem.name,
					),
				).not.toContain("default-agency-code");
			}
		});

		it("still requires a default agency on a dedicated system", () => {
			expect(
				missingRequiredClientConfig(HOST_LMS_CLASSES.koha, {}).map(
					(problem) => problem.name,
				),
			).toContain("default-agency-code");
		});

		it("keeps the appliance's default agency required even when shared", () => {
			// There the key is the agency DCB names in NCIP messages, not a fallback
			// for an unmapped location - dcb-service requires it either way.
			expect(
				missingRequiredClientConfig(HOST_LMS_CLASSES.orsAppliance, {
					"shared-system": true,
				}).map((problem) => problem.name),
			).toContain("default-agency-code");
		});

		it("reports the combination dcb-service refuses", () => {
			expect(
				hasSharedSystemConflict(HOST_LMS_CLASSES.koha, {
					"shared-system": true,
					"default-agency-code": "one-co-tenant",
				}),
			).toBe(true);

			expect(
				hasSharedSystemConflict(HOST_LMS_CLASSES.koha, {
					"shared-system": true,
				}),
			).toBe(false);

			expect(
				hasSharedSystemConflict(HOST_LMS_CLASSES.koha, {
					"default-agency-code": "the-only-library",
				}),
			).toBe(false);

			// Exempt, exactly as HostLmsConfigValidator.hasSharedSystemConflict is
			expect(
				hasSharedSystemConflict(HOST_LMS_CLASSES.orsAppliance, {
					"shared-system": true,
					"default-agency-code": "the-appliance-agency",
				}),
			).toBe(false);
		});

		it("writes the flag into the config as a boolean", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.koha, {
				"api-url": "https://koha.example.org/api/v1",
				client_id: "id",
				client_secret: "secret",
				"sharing-library-code": "DCB",
				"virtual-item-library-code": "DCB",
				"shared-system": true,
				contextHierarchy: "SHARED-KOHA, MOBIUS, GLOBAL",
			});

			expect(config["shared-system"]).toBe(true);
			expect(config["contextHierarchy"]).toEqual([
				"SHARED-KOHA",
				"MOBIUS",
				"GLOBAL",
			]);
			expect(config).not.toHaveProperty("default-agency-code");
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

		// Two keys in it are read by nothing in dcb-service. They get no field, are named
		// as unmapped, and mergeClientConfigEdit keeps them on edit.
		const UNREAD_KEYS = ["staff-ui", "use-new-bib-chunk-ingest"];

		it("has a field for every key dcb-service reads", () => {
			const { unmappedKeys } = clientConfigToFields(
				HOST_LMS_CLASSES.polaris,
				REAL_POLARIS_CONFIG,
			);

			expect(unmappedKeys).toEqual(UNREAD_KEYS);
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
					...Object.fromEntries(
						Object.entries(REAL_POLARIS_CONFIG).filter(
							([key]) => !UNREAD_KEYS.includes(key),
						),
					),
					// A blank value is dropped rather than stored as "".
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
	describe("isAdvancedField", () => {
		const base = {
			path: ["page-size"],
			labelKey: "label",
			descriptionKey: "description",
			requirement: "optional" as const,
			type: "number" as const,
		};

		it("puts a field the adapter defaults behind Advanced", () => {
			expect(isAdvancedField({ ...base, defaultValue: "1000" })).toBe(true);
		});

		it("leaves a field with no default in the main form", () => {
			expect(isAdvancedField(base)).toBe(false);
		});

		it("lets a field say otherwise either way", () => {
			expect(
				isAdvancedField({ ...base, defaultValue: "1000", advanced: false }),
			).toBe(false);
			expect(isAdvancedField({ ...base, advanced: true })).toBe(true);
		});
	});

	describe("adapter defaults", () => {
		// Keys the snapshot lists and the guided form has no field for yet
		const NOT_YET_IN_THE_FORM: string[] = [];

		it("gives every field dcb-service defaults its default, from the snapshot", () => {
			const unmatched: string[] = [];

			for (const [lmsClientClass, defaults] of Object.entries(
				ADAPTER_DEFAULTS as Record<string, Record<string, string>>,
			)) {
				for (const [key, value] of Object.entries(defaults)) {
					const configField = clientConfigFieldsFor(lmsClientClass).find(
						(candidate) => candidate.path.join(".") === key,
					);

					if (!configField) {
						unmatched.push(`${lmsClientClass} ${key}`);
					} else if (configField.requirement !== "required") {
						expect(configField.defaultValue, key).toBe(value);
					}
				}
			}

			expect(unmatched).toEqual(NOT_YET_IN_THE_FORM);
		});

		it("does not default a field the server still requires", () => {
			const pageSize = clientConfigFieldsFor(HOST_LMS_CLASSES.sierra).find(
				(configField) => configField.path.join(".") === "page-size",
			);

			expect(pageSize?.requirement).toBe("required");
			expect(pageSize?.defaultValue).toBeUndefined();
		});

		it("stops calling a defaulted Polaris value a gap", () => {
			const gaps = missingRecommendedClientConfig(
				HOST_LMS_CLASSES.polaris,
				{},
			).map((problem) => problem.name);

			expect(gaps).not.toContain("services.workstation-id");
			expect(gaps).not.toContain("services.site-domain");
			expect(gaps).not.toContain("papi.papi-version");
		});
	});

	describe("settings added under Advanced", () => {
		// ORSApplianceOaiPmhIngestSource uses the endpoint URL when set, and builds the
		// path from the tenant ID otherwise
		it("asks for the appliance tenant, with the endpoint URL as the override", () => {
			const fields = clientConfigFieldsFor(HOST_LMS_CLASSES.orsAppliance);
			const byPath = (path: string) =>
				fields.find((configField) => configField.path.join(".") === path);

			expect(isAdvancedField(byPath("tenant-id")!)).toBe(false);
			expect(isAdvancedField(byPath("oai-endpoint-url")!)).toBe(true);
		});

		it("offers availability concurrency and the polling multiplier on every adapter", () => {
			for (const lmsClass of Object.values(HOST_LMS_CLASSES)) {
				expect(
					clientConfigFieldsFor(lmsClass).map((configField) =>
						configField.path.join("."),
					),
					lmsClass,
				).toContain("availability-concurrency");
				expect(
					clientConfigFieldsFor(lmsClass).map((configField) =>
						configField.path.join("."),
					),
					lmsClass,
				).toContain("polling-multiplier");
			}
		});

		it("offers the virtual patron mailbox on every adapter that sets it", () => {
			for (const lmsClass of [
				HOST_LMS_CLASSES.sierra,
				HOST_LMS_CLASSES.polaris,
				HOST_LMS_CLASSES.koha,
			]) {
				const mailbox = clientConfigFieldsFor(lmsClass).find(
					(configField) =>
						configField.path.join(".") === "virtual-patron-email",
				);
				expect(mailbox?.type, lmsClass).toBe("email");
			}
		});

		it("offers every Polaris key PolarisConfig reads that the form could not set", () => {
			const paths = clientConfigFieldsFor(HOST_LMS_CLASSES.polaris).map(
				(configField) => configField.path.join("."),
			);

			for (const key of [
				"virtual-patron-branch-id",
				"borrower-lending-flow",
				"hold-fetching-delay",
				"hold-fetching-max-retry",
				"harvest-watermark-overlap-minutes",
				"enableDoubleDelete",
				"base-url-qualifier",
			]) {
				expect(paths, key).toContain(key);
			}
		});

		// HostLmsConfigValidator rejects any other value, including UNKNOWN, which is
		// what the adapter assigns, never what a site configures
		it("maps shelf locations to the loan policies the validator accepts", () => {
			const policyMap = clientConfigFieldsFor(HOST_LMS_CLASSES.polaris).find(
				(configField) =>
					configField.path.join(".") === "shelfLocationPolicyMap",
			);

			expect(policyMap?.valueOptions?.map((option) => option.value)).toEqual([
				"GENERAL",
				"SHORT_LOAN",
				"REFERENCE_ONLY",
				"LOCAL_ONLY",
				"NO_LEND",
			]);
			expect(
				buildClientConfig(HOST_LMS_CLASSES.polaris, {
					shelfLocationPolicyMap: { Reference: "REFERENCE_ONLY" },
				}).shelfLocationPolicyMap,
			).toEqual({ Reference: "REFERENCE_ONLY" });
		});
	});

	describe("select fields", () => {
		it("offers the Polaris item agency methods PolarisConfig implements", () => {
			const select = clientConfigFieldsFor(HOST_LMS_CLASSES.polaris).find(
				(configField) =>
					configField.path.join(".") === "item.item-agency-resolution-method",
			);

			expect(select?.type).toBe("select");
			expect(select?.options?.map((option) => option.value)).toEqual([
				"Legacy",
				"LocationId",
			]);
		});

		it("writes the chosen value into the nested item object", () => {
			const config = buildClientConfig(HOST_LMS_CLASSES.polaris, {
				item: { "item-agency-resolution-method": "LocationId" },
			});

			expect(config.item).toEqual({
				"item-agency-resolution-method": "LocationId",
			});
		});

		it("hydrates a stored value back into the select", () => {
			const { values, unmappedKeys } = clientConfigToFields(
				HOST_LMS_CLASSES.polaris,
				{ item: { "item-agency-resolution-method": "Legacy" } },
			);

			expect(values).toMatchObject({
				item: { "item-agency-resolution-method": "Legacy" },
			});
			expect(unmappedKeys).toEqual([]);
		});
	});

	describe("originOf", () => {
		it("keeps the scheme, host and port of a URL", () => {
			expect(
				originOf("https://appliance.example.org:8443/oai/request?x=1"),
			).toBe("https://appliance.example.org:8443");
		});

		it("gives nothing while the text is not a URL yet", () => {
			expect(originOf("https://")).toBe("");
		});
	});

	describe("keys nothing in dcb-service reads", () => {
		it.each([
			[HOST_LMS_CLASSES.folio, "folio-tenant"],
			[HOST_LMS_CLASSES.folio, "user-base-url"],
			[HOST_LMS_CLASSES.polaris, "staff-ui"],
			[HOST_LMS_CLASSES.polaris, "use-new-bib-chunk-ingest"],
		])(
			"are not offered, and a stored %s %s is kept on edit",
			(lmsClientClass, key) => {
				const paths = clientConfigFieldsFor(lmsClientClass).map((configField) =>
					configField.path.join("."),
				);
				expect(paths).not.toContain(key);

				const stored = { [key]: "kept" };
				expect(
					clientConfigToFields(lmsClientClass, stored).unmappedKeys,
				).toEqual([key]);
				expect(mergeClientConfigEdit(stored, lmsClientClass, {})[key]).toBe(
					"kept",
				);
			},
		);
	});

	describe("mergeClientConfigEdit", () => {
		it("keeps keys the guided form has no field for", () => {
			const stored = {
				"base-url": "https://sierra.example.org",
				key: "old-key",
				secret: "old-secret",
				"some-bespoke-flag": "keep me",
				nested: { "also-bespoke": 7 },
			};

			const merged = mergeClientConfigEdit(stored, HOST_LMS_CLASSES.sierra, {
				"base-url": "https://sierra.example.org",
				key: "new-key",
				secret: "new-secret",
			});

			expect(merged.key).toBe("new-key");
			expect(merged["some-bespoke-flag"]).toBe("keep me");
			expect(merged.nested).toEqual({ "also-bespoke": 7 });
		});

		it("clears a guided field the user emptied", () => {
			const merged = mergeClientConfigEdit(
				{ "base-url": "https://sierra.example.org", key: "k", secret: "s" },
				HOST_LMS_CLASSES.sierra,
				{ "base-url": "https://sierra.example.org", key: "", secret: "s" },
			);

			expect("key" in merged).toBe(false);
			expect(merged.secret).toBe("s");
		});

		// dcb-service stopped reading Alma's `shelf-location`, and the form no longer
		// offers it. A record that still has it must keep it on edit, not lose it.
		it("keeps a stored Alma shelf-location the form no longer offers", () => {
			const stored = {
				"alma-url": "https://api-eu.hosted.exlibrisgroup.com",
				"shelf-location": "STACKS",
			};

			expect(
				clientConfigToFields(HOST_LMS_CLASSES.alma, stored).unmappedKeys,
			).toEqual(["shelf-location"]);
			expect(
				mergeClientConfigEdit(stored, HOST_LMS_CLASSES.alma, {
					"alma-url": "https://api-eu.hosted.exlibrisgroup.com",
				})["shelf-location"],
			).toBe("STACKS");
		});

		it("does not mutate the stored config it was given", () => {
			const stored = { key: "old", "some-bespoke-flag": true };
			mergeClientConfigEdit(stored, HOST_LMS_CLASSES.sierra, { key: "new" });

			expect(stored.key).toBe("old");
		});
	});
});

// A label the catalogue lacks renders as its key. Any property ending in "Key", so a
// key-bearing property added later is covered without this test being edited.
describe("every key a profile names is in the en-GB catalogue", () => {
	const keysIn = (node: unknown, out: string[] = []): string[] => {
		if (Array.isArray(node)) node.forEach((item) => keysIn(item, out));
		else if (node && typeof node === "object")
			for (const [name, value] of Object.entries(node))
				if (name.endsWith("Key") && typeof value === "string") out.push(value);
				else keysIn(value, out);
		return out;
	};
	const resolve = (key: string) =>
		key
			.split(".")
			.reduce<unknown>(
				(node, part) => (node as Record<string, unknown> | undefined)?.[part],
				application,
			);

	it.each(
		HOST_LMS_PROFILES.map((profile) => [profile.lmsClientClass, profile]),
	)("%s", (_, profile) => {
		const missing = [...new Set(keysIn(profile))].filter(
			(key) => typeof resolve(key) !== "string",
		);
		expect(missing).toEqual([]);
	});
});
