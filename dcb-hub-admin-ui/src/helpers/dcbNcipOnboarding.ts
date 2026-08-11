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
	if (policy.maxConsortialLoans.trim()) {
		const value = Number(policy.maxConsortialLoans);
		if (!Number.isInteger(value) || value < 1) errors.push("MAX_LOANS_INVALID");
	}
	return errors;
}

export function buildDcbInvitationRequest(policy: DcbInvitationPolicyForm) {
	const optionalText = (value: string) => value.trim() || undefined;
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
