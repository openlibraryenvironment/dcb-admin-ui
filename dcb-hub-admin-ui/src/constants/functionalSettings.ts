import type { FunctionalSettingType } from "@generated/graphql";

/**
 * The functional settings offered when a consortium is first created.
 *
 * Deliberately not every value of the schema enum. `SELECT_UNAVAILABLE_ITEMS`
 * and `VIRTUAL_PATRON_NAMES_POLARIS` are situational - the first depends on how
 * a consortium wants resolution to behave once it has real traffic, the second
 * is a Polaris-specific workaround pending group-level settings - so both are
 * left to the functional settings page rather than put in front of someone on
 * day one.
 *
 * `defaultEnabled` is the consortium-wide starting position, not a
 * recommendation the user cannot change: every one of these is a checkbox.
 */
export interface ConsortiumFunctionalSettingOption {
	name: FunctionalSettingType;
	labelKey: string;
	/**
	 * Shown under the checkbox, and the source of the setting's stored
	 * description - so what the consortium reads later is what they were told
	 * when they chose it. See `storedDescription` for why it is a source rather
	 * than the value itself.
	 */
	descriptionKey: string;
	defaultEnabled: boolean;
}

/** FunctionalSetting.description is @Size(max = 200) in dcb-service. */
export const MAX_SETTING_DESCRIPTION_LENGTH = 200;

/**
 * The explainer, cut down to something the column will accept.
 *
 * The on-screen explainer is UI copy and should be as long as it needs to be;
 * the stored description is a database field with a 200 character limit. Tying
 * the two together meant the copy could not be improved without silently
 * risking a constraint violation on create, so the explainer is trimmed here
 * instead - by whole sentences where possible, because a description cut off
 * mid-word reads as corruption.
 */
export const storedDescription = (explainer: string): string => {
	if (explainer.length <= MAX_SETTING_DESCRIPTION_LENGTH) return explainer;

	// Keep whole sentences while they fit.
	const sentences = explainer.match(/[^.!?]+[.!?]+\s*/g) ?? [];
	let kept = "";
	for (const sentence of sentences) {
		if ((kept + sentence).trimEnd().length > MAX_SETTING_DESCRIPTION_LENGTH)
			break;
		kept += sentence;
	}
	if (kept.trim().length > 0) return kept.trim();

	// A single sentence longer than the column: cut at a word boundary.
	const clipped = explainer
		.slice(0, MAX_SETTING_DESCRIPTION_LENGTH - 1)
		.replace(/\s+\S*$/, "");
	return `${clipped}…`;
};

export const CONSORTIUM_FUNCTIONAL_SETTINGS: ConsortiumFunctionalSettingOption[] =
	[
		{
			name: "PICKUP_ANYWHERE",
			labelKey: "consortium.settings.pickup_anywhere",
			descriptionKey: "consortium.settings.explainer.pickup_anywhere",
			defaultEnabled: true,
		},
		{
			name: "RE_RESOLUTION",
			labelKey: "consortium.settings.re_resolution",
			descriptionKey: "consortium.settings.explainer.re_resolution",
			defaultEnabled: true,
		},
		{
			name: "OWN_LIBRARY_BORROWING",
			labelKey: "consortium.settings.own_library_borrowing",
			descriptionKey: "consortium.settings.explainer.own_library_borrowing",
			defaultEnabled: true,
		},
		{
			name: "SELECT_UNAVAILABLE_ITEMS",
			labelKey: "consortium.settings.select_unavailable",
			descriptionKey: "consortium.settings.explainer.select_unavailable",
			defaultEnabled: true,
		},
		{
			name: "TRIGGER_SUPPLIER_RENEWAL",
			labelKey: "consortium.settings.trigger_supplier_renewal",
			descriptionKey: "consortium.settings.explainer.trigger_supplier_renewal",
			defaultEnabled: true,
		},
		{
			name: "VIRTUAL_PATRON_NAMES_VISIBLE",
			labelKey: "consortium.settings.virtual_patron_names_visible",
			descriptionKey:
				"consortium.settings.explainer.virtual_patron_names_visible",
			defaultEnabled: false,
		},
		{
			name: "DENY_LIBRARY_MAPPING_EDIT",
			labelKey: "consortium.settings.deny_library_mapping_edit",
			descriptionKey: "consortium.settings.explainer.deny_library_mapping_edit",
			defaultEnabled: false,
		},
	];

/** The starting state of the picker, keyed by setting name. */
export const defaultFunctionalSettingSelection = (): Record<string, boolean> =>
	Object.fromEntries(
		CONSORTIUM_FUNCTIONAL_SETTINGS.map((setting) => [
			setting.name,
			setting.defaultEnabled,
		]),
	);
