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

type Derivations<K extends string> = Record<K, (source: string) => string>;

/**
 * The values to update when their source changes: each one still empty or still equal to
 * what the old source gave. One the user has changed is left alone.
 */
export const valuesFollowing = <K extends string>(
	derivations: Derivations<K>,
	previousSource: string,
	nextSource: string,
	current: Partial<Record<K, string | undefined>>,
): Partial<Record<K, string>> => {
	const updates: Partial<Record<K, string>> = {};

	for (const name of Object.keys(derivations) as K[]) {
		const derive = derivations[name];
		const value = current[name] ?? "";
		if (value === "" || value === derive(previousSource)) {
			updates[name] = derive(nextSource);
		}
	}

	return updates;
};

export const LIBRARY_NAMES = {
	shortName: (fullName: string) => fullName.trim(),
	abbreviatedName: abbreviationOf,
};

/** groupCode is at most five characters, which dcb-service and the form both enforce. */
export const CONSORTIUM_NAMES = {
	displayName: (name: string) => name.trim(),
	groupName: (name: string) => name.trim(),
	groupCode: (name: string) => abbreviationOf(name).slice(0, 5),
};
