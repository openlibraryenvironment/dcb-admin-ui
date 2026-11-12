export const rulesetKeys = {
	names: () => ["objectRulesets", "names"] as const,
	detail: (name: string) => ["objectRulesets", "detail", name] as const,
};

/** Rulesets change when an administrator edits one, not while a page is open. */
export const RULESET_STALE_TIME = 10 * 60 * 1000;
