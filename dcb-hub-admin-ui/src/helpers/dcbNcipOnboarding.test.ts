import { describe, expect, it } from "vitest";

import {
	buildDcbInvitationRequest,
	canManageDcbNcipOnboarding,
	initialDcbInvitationPolicy,
	validateDcbInvitationPolicy,
} from "./dcbNcipOnboarding";

describe("DCB NCIP onboarding access", () => {
	it("permits only DCB administrative roles", () => {
		expect(canManageDcbNcipOnboarding(["ADMIN"])).toBe(true);
		expect(canManageDcbNcipOnboarding(["CONSORTIUM_ADMIN"])).toBe(true);
		expect(canManageDcbNcipOnboarding(["LIBRARY_ADMIN"])).toBe(false);
		expect(canManageDcbNcipOnboarding([])).toBe(false);
	});
});

describe("DCB NCIP onboarding policy", () => {
	it("rejects missing identity and participation", () => {
		const policy = initialDcbInvitationPolicy();
		policy.borrowingAllowed = false;
		policy.supplyingAllowed = false;
		policy.ingestAllowed = false;

		expect(validateDcbInvitationPolicy(policy)).toEqual([
			"HOST_LMS_CODE_REQUIRED",
			"AGENCY_CODE_REQUIRED",
			"EXPECTED_SYMBOL_REQUIRED",
			"PARTICIPATION_ROLE_REQUIRED",
		]);
	});

	it("requires supplying when ingest is enabled", () => {
		const policy = initialDcbInvitationPolicy();
		policy.hostLmsCode = "HOST";
		policy.agencyCode = "AGENCY";
		policy.expectedSymbol = "symbol";
		policy.supplyingAllowed = false;

		expect(validateDcbInvitationPolicy(policy)).toEqual([
			"INGEST_REQUIRES_SUPPLYING",
		]);
	});

	it("rejects malformed present optional numbers", () => {
		const policy = initialDcbInvitationPolicy();
		policy.hostLmsCode = "HOST";
		policy.agencyCode = "AGENCY";
		policy.expectedSymbol = "symbol";
		policy.maxConsortialLoans = "1.5";

		expect(validateDcbInvitationPolicy(policy)).toEqual(["MAX_LOANS_INVALID"]);
	});

	it("normalizes text and omits empty optional fields", () => {
		const policy = initialDcbInvitationPolicy();
		policy.hostLmsCode = " HOST ";
		policy.agencyCode = " AGENCY ";
		policy.expectedSymbol = " symbol ";
		policy.authProfile = "";

		expect(buildDcbInvitationRequest(policy)).toEqual({
			profile: "DCB-NCIP2.02+",
			profileVersion: 1,
			policy: {
				hostLmsCode: "HOST",
				agencyCode: "AGENCY",
				expectedSymbol: "symbol",
				borrowingAllowed: true,
				supplyingAllowed: true,
				ingestAllowed: true,
				authProfile: undefined,
				maxConsortialLoans: undefined,
				suppressionRulesetName: undefined,
				itemSuppressionRulesetName: undefined,
			},
		});
	});
});
