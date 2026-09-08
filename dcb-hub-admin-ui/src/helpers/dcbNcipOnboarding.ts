import type { AxiosInstance } from "axios";

import { adminOrConsortiumAdmin } from "@constants/roles";

const PROFILE_PATH = "/api/v1/dcb-profile-ncip2";

export interface DcbNcipReadinessCheck {
	code: string;
	status: "PASS" | "FAIL";
	message: string;
	remediation?: string | null;
}

export interface DcbNcipReadiness {
	ready: boolean;
	profile: string;
	profileVersion: number;
	dcbBaseUrl?: string | null;
	checks: DcbNcipReadinessCheck[];
}

export interface DcbInvitationPolicyForm {
	hostLmsCode: string;
	agencyCode: string;
	expectedSymbol: string;
	borrowingAllowed: boolean;
	supplyingAllowed: boolean;
	ingestAllowed: boolean;
	authProfile: string;
	allowedAuthProfiles: string;
	maxConsortialLoans: string;
	suppressionRulesetName: string;
	itemSuppressionRulesetName: string;
}

export type DcbInvitationPolicyError =
	| "HOST_LMS_CODE_REQUIRED"
	| "HOST_LMS_CODE_TOO_LONG"
	| "AGENCY_CODE_REQUIRED"
	| "AGENCY_CODE_TOO_LONG"
	| "EXPECTED_SYMBOL_REQUIRED"
	| "PARTICIPATION_ROLE_REQUIRED"
	| "INGEST_REQUIRES_SUPPLYING"
	| "AUTH_PROFILE_REQUIRED"
	| "AUTH_PROFILE_TOO_LONG"
	| "ALLOWED_AUTH_PROFILE_TOO_LONG"
	| "ALLOWED_AUTH_PROFILE_DUPLICATE"
	| "AUTH_PROFILE_DEFAULT_NOT_ALLOWED"
	| "MAX_LOANS_INVALID";

export interface DcbInvitationResponse {
	invitationId: string;
	invitation: string;
	profile: string;
	profileVersion: number;
	expiresAt: string;
	dcbNodeId: string;
	dcbNodeName: string;
	policy: Record<string, unknown>;
}

export function canManageDcbNcipOnboarding(roles: string[]): boolean {
	return roles.some((role) => adminOrConsortiumAdmin.includes(role));
}

export const initialDcbInvitationPolicy = (): DcbInvitationPolicyForm => ({
	hostLmsCode: "",
	agencyCode: "",
	expectedSymbol: "",
	borrowingAllowed: true,
	supplyingAllowed: true,
	ingestAllowed: true,
	authProfile: "BASIC/BARCODE+PIN",
	allowedAuthProfiles: "BASIC/BARCODE+PIN",
	maxConsortialLoans: "",
	suppressionRulesetName: "",
	itemSuppressionRulesetName: "",
});

export function validateDcbInvitationPolicy(
	policy: DcbInvitationPolicyForm,
): DcbInvitationPolicyError[] {
	const errors: DcbInvitationPolicyError[] = [];
	const hostLmsCode = policy.hostLmsCode.trim();
	const agencyCode = policy.agencyCode.trim();
	if (!hostLmsCode) errors.push("HOST_LMS_CODE_REQUIRED");
	if (hostLmsCode.length > 32) errors.push("HOST_LMS_CODE_TOO_LONG");
	if (!agencyCode) errors.push("AGENCY_CODE_REQUIRED");
	if (agencyCode.length > 32) errors.push("AGENCY_CODE_TOO_LONG");
	if (!policy.expectedSymbol.trim()) errors.push("EXPECTED_SYMBOL_REQUIRED");
	if (!policy.borrowingAllowed && !policy.supplyingAllowed) {
		errors.push("PARTICIPATION_ROLE_REQUIRED");
	}
	if (policy.ingestAllowed && !policy.supplyingAllowed) {
		errors.push("INGEST_REQUIRES_SUPPLYING");
	}
	const authProfile = policy.authProfile.trim();
	const allowedAuthProfiles = parseAllowedAuthProfiles(
		policy.allowedAuthProfiles,
	);
	if (!authProfile) errors.push("AUTH_PROFILE_REQUIRED");
	if (authProfile.length > 64) errors.push("AUTH_PROFILE_TOO_LONG");
	if (allowedAuthProfiles.some((profile) => profile.length > 64)) {
		errors.push("ALLOWED_AUTH_PROFILE_TOO_LONG");
	}
	if (new Set(allowedAuthProfiles).size !== allowedAuthProfiles.length) {
		errors.push("ALLOWED_AUTH_PROFILE_DUPLICATE");
	}
	const effectiveAllowedProfiles = allowedAuthProfiles.length
		? allowedAuthProfiles
		: [authProfile];
	if (authProfile && !effectiveAllowedProfiles.includes(authProfile)) {
		errors.push("AUTH_PROFILE_DEFAULT_NOT_ALLOWED");
	}
	if (policy.maxConsortialLoans.trim()) {
		const value = Number(policy.maxConsortialLoans);
		if (!Number.isInteger(value) || value < 1) errors.push("MAX_LOANS_INVALID");
	}
	return errors;
}

export function buildDcbInvitationRequest(policy: DcbInvitationPolicyForm) {
	const optionalText = (value: string) => value.trim() || undefined;
	const allowedAuthProfiles = parseAllowedAuthProfiles(
		policy.allowedAuthProfiles,
	);
	return {
		profile: "DCB-NCIP2.02+",
		profileVersion: 1,
		policy: {
			hostLmsCode: policy.hostLmsCode.trim(),
			agencyCode: policy.agencyCode.trim(),
			expectedSymbol: policy.expectedSymbol.trim(),
			borrowingAllowed: policy.borrowingAllowed,
			supplyingAllowed: policy.supplyingAllowed,
			ingestAllowed: policy.ingestAllowed,
			authProfile: optionalText(policy.authProfile),
			allowedAuthProfiles: allowedAuthProfiles.length
				? allowedAuthProfiles
				: undefined,
			maxConsortialLoans: policy.maxConsortialLoans.trim()
				? Number(policy.maxConsortialLoans)
				: undefined,
			suppressionRulesetName: optionalText(policy.suppressionRulesetName),
			itemSuppressionRulesetName: optionalText(
				policy.itemSuppressionRulesetName,
			),
		},
	};
}

function parseAllowedAuthProfiles(value: string): string[] {
	return value
		.split("\n")
		.map((profile) => profile.trim())
		.filter(Boolean);
}

export async function loadDcbNcipReadiness(
	client: AxiosInstance,
): Promise<DcbNcipReadiness> {
	return (await client.get<DcbNcipReadiness>(`${PROFILE_PATH}/readiness`)).data;
}

export async function issueDcbNcipInvitation(
	client: AxiosInstance,
	policy: DcbInvitationPolicyForm,
): Promise<DcbInvitationResponse> {
	return (
		await client.post<DcbInvitationResponse>(
			`${PROFILE_PATH}/membership-invitations`,
			buildDcbInvitationRequest(policy),
		)
	).data;
}
