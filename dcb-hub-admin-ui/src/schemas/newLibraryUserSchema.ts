import * as Yup from "yup";

/**
 * Validation for provisioning a DCB Admin for Libraries account.
 *
 * In `src/schemas/` rather than inline in the form, on purpose. `NewContact` inlines its
 * schema, which means the rules cannot be tested without rendering a dialog and cannot be
 * reused by anything else — and a validation rule nobody can test is a validation rule
 * nobody has checked.
 *
 * <h2>These rules are not the security control</h2>
 *
 * The role is constrained four times server-side: the GraphQL enum, `ProvisionableRole`,
 * the Postgres CHECK constraint, and the identity provider's own role-mapping grant. This
 * exists so somebody is told what is wrong before they submit, not to decide what is
 * permitted.
 */

/** The two roles this form may ask for. Matches the server's `ProvisionableRole` enum. */
export const PROVISIONABLE_ROLES = ["LIBRARY_ADMIN", "LIBRARY_READ_ONLY"] as const;

export type ProvisionableRole = (typeof PROVISIONABLE_ROLES)[number];

export interface NewLibraryUserFormData {
	email: string;
	firstName: string;
	lastName: string;
	role: ProvisionableRole;
	reason?: string;
	changeCategory?: string;
	changeReferenceUrl?: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function buildNewLibraryUserSchema(t: Translate) {
	return Yup.object().shape({
		email: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.accounts.email"),
				}),
			)
			// The same shape the contact form uses. Deliberately permissive: an address
			// this rejects but the provider would have accepted is a person who cannot be
			// given an account, and email syntax is not where account security lives.
			.test("is-email", t("ui.validation.invalid_email"), (value) =>
				value ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : true,
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		firstName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.accounts.first_name"),
				}),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
		lastName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.accounts.last_name"),
				}),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
		role: Yup.string()
			.trim()
			.oneOf(
				[...PROVISIONABLE_ROLES],
				t("libraries.accounts.validation.role_not_provisionable"),
			)
			.required(
				t("ui.validation.required", {
					field: t("libraries.accounts.role"),
				}),
			),
		reason: Yup.string().trim().max(255).optional(),
		changeCategory: Yup.string().trim().max(100).optional(),
		changeReferenceUrl: Yup.string().trim().max(200).optional(),
	});
}
