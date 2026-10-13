import { describe, it, expect } from "vitest";

import { HOST_LMS_CLASSES } from "@helpers/hostLmsClientConfig";
import {
	authProfileOptions,
	isAuthProfileFixed,
	isUnsupportedAuthProfile,
	resolveAuthProfile,
} from "./authProfiles";

describe("authProfiles", () => {
	it("defaults to the first profile the ILS offers", () => {
		expect(resolveAuthProfile(HOST_LMS_CLASSES.sierra, "")).toBe(
			"BASIC/BARCODE+PIN",
		);
		expect(resolveAuthProfile(HOST_LMS_CLASSES.alma, "")).toBe(
			"BASIC/BARCODE+PASSWORD",
		);
		expect(resolveAuthProfile(HOST_LMS_CLASSES.folio, "")).toBe(
			"BASIC/BARCODE+PIN",
		);
	});

	it("keeps a profile the user chose", () => {
		expect(
			resolveAuthProfile(HOST_LMS_CLASSES.sierra, "BASIC/UNIQUE-ID+NAME"),
		).toBe("BASIC/UNIQUE-ID+NAME");
	});

	it("sends Koha's fixed profile whatever was stored", () => {
		expect(isAuthProfileFixed(HOST_LMS_CLASSES.koha)).toBe(true);
		expect(resolveAuthProfile(HOST_LMS_CLASSES.koha, "")).toBe(
			"BASIC/BARCODE+PASSWORD",
		);
		expect(resolveAuthProfile(HOST_LMS_CLASSES.koha, "anything")).toBe(
			"BASIC/BARCODE+PASSWORD",
		);
	});

	it("flags a stored profile the ILS will refuse, but not a blank one", () => {
		expect(
			isUnsupportedAuthProfile(HOST_LMS_CLASSES.polaris, "BASIC/BARCODE+NAME"),
		).toBe(true);
		expect(isUnsupportedAuthProfile(HOST_LMS_CLASSES.polaris, "")).toBe(false);
		expect(
			isUnsupportedAuthProfile(HOST_LMS_CLASSES.polaris, "BASIC/BARCODE+PIN"),
		).toBe(false);
	});

	it("leaves a system with no known vocabulary to free text", () => {
		expect(authProfileOptions(HOST_LMS_CLASSES.orsAppliance)).toBeUndefined();
		expect(
			isUnsupportedAuthProfile(HOST_LMS_CLASSES.orsAppliance, "ANY/THING"),
		).toBe(false);
		expect(resolveAuthProfile(HOST_LMS_CLASSES.orsAppliance, "")).toBe("");
	});
});
