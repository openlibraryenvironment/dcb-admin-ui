import i18n from "@/i18n";

/**
 * The reason a create form starts with, so the audit field can be required without
 * being a box to retype "new location" into on every create.
 *
 * `nameKey` is the entity's i18n noun - the key ENTITY_REGISTRY already carries as
 * `nameKey`. Lowercased because the catalogue cases those nouns inconsistently and this
 * sentence needs them mid-phrase, as buildDeleteAction does.
 *
 * Reads the i18n singleton because two callers are module-scope constants, not
 * components. A default value is captured once, so no re-render is needed.
 */
export const defaultCreationReason = (nameKey: string): string =>
	i18n.t("data_change_log.reason_default", {
		entity: i18n.t(nameKey).toLowerCase(),
	});
