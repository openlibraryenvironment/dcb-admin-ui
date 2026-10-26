import { describe, expect, it } from "vitest";

import { serviceConfigurationFrom } from "./serviceConfiguration";

// The shape a dcb-service on main reports, trimmed to the keys read here
const MAIN_INFO = {
	dcb: {
		index: { backend: { distribution: "opensearch", version: "2.19.1" } },
		requests: {
			"preflight-checks": {
				timeout: "PT55S",
				"duplicate-requests": { enabled: "", "active-window": "" },
			},
			"staff-client-ids": "dcb-admin, dcb-admin-for-libraries",
		},
		branding: { assets: { store: "" } },
		ingest: {
			sources: {
				"Zeta-Library": { enabled: false },
				"Alpha-College": { enabled: true },
			},
		},
	},
};

describe("serviceConfigurationFrom", () => {
	it("reads each setting /info reports", () => {
		expect(serviceConfigurationFrom(MAIN_INFO)).toEqual({
			searchBackend: { distribution: "opensearch", version: "2.19.1" },
			placementCheckTimeoutSeconds: 55,
			staffClientIds: ["dcb-admin", "dcb-admin-for-libraries"],
			duplicateRequestCheck: false,
			brandAssetStore: "database",
			ingestSources: [
				{ key: "Alpha-College", enabled: true },
				{ key: "Zeta-Library", enabled: false },
			],
		});
	});

	it("reads a duplicate check that is switched on", () => {
		const info = {
			dcb: {
				requests: {
					"preflight-checks": { "duplicate-requests": { enabled: "true" } },
				},
			},
		};

		expect(serviceConfigurationFrom(info)?.duplicateRequestCheck).toBe(true);
	});

	it("leaves out what an older dcb-service does not report", () => {
		const config = serviceConfigurationFrom({ dcb: { requests: {} } });

		expect(config).toEqual({
			searchBackend: null,
			placementCheckTimeoutSeconds: null,
			staffClientIds: null,
			duplicateRequestCheck: null,
			brandAssetStore: null,
			ingestSources: [],
		});
	});

	it.each([[null], [undefined], ["text"]])(
		"has nothing to read from %s",
		(info) => {
			expect(serviceConfigurationFrom(info)).toBeNull();
		},
	);
});
