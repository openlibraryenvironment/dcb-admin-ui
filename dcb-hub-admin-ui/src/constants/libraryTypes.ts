/**
 * `Library.type` is free text to dcb-service, which only displays it. The value stored is
 * the English word, so existing records and reports keep reading the same; the label is
 * translated.
 */
export const LIBRARY_TYPE_OPTIONS = [
	{ value: "Academic", labelKey: "libraries.types.academic" },
	{ value: "Public", labelKey: "libraries.types.public" },
	{ value: "Special", labelKey: "libraries.types.special" },
	{ value: "National", labelKey: "libraries.types.national" },
	{ value: "School", labelKey: "libraries.types.school" },
	{ value: "Health", labelKey: "libraries.types.health" },
	{ value: "Other", labelKey: "libraries.types.other" },
] as const;

/** A stored type outside the list, so it can be shown and replaced rather than lost. */
export const isUnlistedLibraryType = (value: string | undefined | null) =>
	!!value && !LIBRARY_TYPE_OPTIONS.some((option) => option.value === value);
