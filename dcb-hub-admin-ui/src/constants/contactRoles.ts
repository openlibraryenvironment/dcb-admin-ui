/**
 * The `value` MUST be the backend RoleName enum constant - the create data
 * fetchers upper-case and match it against RoleName. Sending the translated
 * label breaks for anything the naive coercion cannot reconstruct (e.g.
 * LIBRARY_SERVICES_ADMINISTRATOR).
 *
 * Shared by the library and consortium contact forms: the list had been copied
 * into one of them, which is how the two ended up able to disagree about what a
 * valid role is.
 */
export const CONTACT_ROLE_OPTIONS = [
	{
		value: "IMPLEMENTATION_CONTACT",
		labelKey: "libraries.contacts.roles.implementation",
	},
	{
		value: "LIBRARY_SERVICES_ADMINISTRATOR",
		labelKey: "libraries.contacts.roles.library_service_admin",
	},
	{
		value: "OPERATIONS_CONTACT",
		labelKey: "libraries.contacts.roles.operations",
	},
	{
		value: "SIGN_OFF_AUTHORITY",
		labelKey: "libraries.contacts.roles.sign_off",
	},
	{ value: "SUPPORT", labelKey: "libraries.contacts.roles.support" },
	{
		value: "TECHNICAL_CONTACT",
		labelKey: "libraries.contacts.roles.technical",
	},
] as const;

export const contactRoleLabelKey = (value: string): string =>
	CONTACT_ROLE_OPTIONS.find((option) => option.value === value)?.labelKey ?? "";
