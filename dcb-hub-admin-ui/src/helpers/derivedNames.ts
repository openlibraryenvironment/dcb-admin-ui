const MINOR_WORDS = new Set(["of", "the", "and", "for", "at", "in", "&"]);

/** "University of Colorado Boulder" -> "UCB": the initials of the words that carry the name. */
export const abbreviationOf = (fullName: string): string =>
	fullName
		.split(/\s+/)
		.filter(
			(word) => /^\p{L}/u.test(word) && !MINOR_WORDS.has(word.toLowerCase()),
		)
		.map((word) => word[0].toUpperCase())
		.join("");

export const DERIVED_NAMES = {
	shortName: (fullName: string) => fullName.trim(),
	abbreviatedName: abbreviationOf,
} as const;

/**
 * The names to update when the full name changes: each one still empty or still equal to
 * what the old full name gave. One the user has changed is left alone.
 */
export const namesFollowingFullName = (
	previousFullName: string,
	nextFullName: string,
	current: Record<keyof typeof DERIVED_NAMES, string | undefined>,
): Partial<Record<keyof typeof DERIVED_NAMES, string>> => {
	const updates: Partial<Record<keyof typeof DERIVED_NAMES, string>> = {};

	for (const [name, derive] of Object.entries(DERIVED_NAMES) as [
		keyof typeof DERIVED_NAMES,
		(fullName: string) => string,
	][]) {
		const value = current[name] ?? "";
		if (value === "" || value === derive(previousFullName)) {
			updates[name] = derive(nextFullName);
		}
	}

	return updates;
};
