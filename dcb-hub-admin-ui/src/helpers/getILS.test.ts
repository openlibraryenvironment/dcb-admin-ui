import { describe, it, expect } from "vitest";

import { getILS } from "./getILS";
import { HOST_LMS_CLASSES } from "./hostLmsClientConfig";

describe("getILS", () => {
	it.each([
		[HOST_LMS_CLASSES.alma, "Alma"],
		[HOST_LMS_CLASSES.folio, "FOLIO"],
		[HOST_LMS_CLASSES.koha, "Koha"],
		[HOST_LMS_CLASSES.polaris, "Polaris"],
		[HOST_LMS_CLASSES.sierra, "Sierra"],
		[HOST_LMS_CLASSES.foundation, "Foundation"],
		[HOST_LMS_CLASSES.orsAppliance, "OpenRS appliance"],
	])("names %s", (lmsClientClass, expected) => {
		expect(getILS(lmsClientClass)).toBe(expected);
	});

	it("names every class the Host LMS picker offers", () => {
		// A picker entry that renders as "UNKNOWN" everywhere else in the app is
		// the bug this guards against.
		for (const lmsClientClass of Object.values(HOST_LMS_CLASSES)) {
			expect(getILS(lmsClientClass)).not.toBe("UNKNOWN");
		}
	});

	it("still recognises the FOLIO OAI ingest source class", () => {
		expect(
			getILS("org.olf.dcb.core.interaction.folio.FolioOaiPmhIngestSource"),
		).toBe("FOLIO");
	});

	it("falls back to UNKNOWN for anything else", () => {
		expect(getILS("com.example.SomeOtherClient")).toBe("UNKNOWN");
		expect(getILS("")).toBe("UNKNOWN");
		expect(getILS(undefined as unknown as string)).toBe("UNKNOWN");
	});

	it("does not mistake the abstract base class for the appliance", () => {
		// AbstractHostLmsClient is not a usable client, so it must not be given
		// the appliance's name.
		expect(getILS("org.olf.dcb.core.interaction.AbstractHostLmsClient")).toBe(
			"UNKNOWN",
		);
	});
});
