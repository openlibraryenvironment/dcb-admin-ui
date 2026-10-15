/**
 * What the reader may scope the dashboard to, and what the figures are then asked for.
 *
 * Pure, and here rather than beside the selector, because the ROUTE resolves the scope
 * before anything renders: the URL carries `group:<id>,library:<id>` and the statistics
 * endpoints take Host LMS codes, so something has to turn one into the other in a loader
 * as well as in a component. A function exported alongside a component also breaks fast
 * refresh.
 */

export type ScopeOption = {
	kind: "group" | "library";
	id: string;
	label: string;
	/** The Host LMS codes this option resolves to. */
	codes: string[];
};

/** The stable id a URL carries for one option: its kind and its own id, never its codes. */
export const scopeId = (option: ScopeOption) => `${option.kind}:${option.id}`;

/**
 * The selectable scopes, from the shared library list.
 *
 * Groups are derived from library membership rather than fetched: the list already
 * carries each library's groups, and a group is only worth offering for the members it
 * actually resolves to.
 */
export function scopeOptionsFrom(data: unknown): ScopeOption[] {
	const libraries: any[] = (data as any)?.libraries?.content ?? [];

	const libraryOptions: ScopeOption[] = libraries
		.filter((library) => library.agency?.hostLms?.code)
		.map((library) => ({
			kind: "library" as const,
			id: library.id,
			label: library.fullName,
			codes: [library.agency.hostLms.code],
		}));

	const groups = new Map<string, { label: string; codes: Set<string> }>();
	for (const library of libraries) {
		const code = library.agency?.hostLms?.code;
		for (const membership of library.membership ?? []) {
			const group = membership.libraryGroup;
			if (!group) continue;
			if (!groups.has(group.id)) {
				groups.set(group.id, { label: group.name, codes: new Set() });
			}
			if (code) groups.get(group.id)!.codes.add(code);
		}
	}

	const groupOptions: ScopeOption[] = Array.from(groups.entries()).map(
		([id, group]) => ({
			kind: "group" as const,
			id,
			label: group.label,
			codes: Array.from(group.codes),
		}),
	);

	return [...groupOptions, ...libraryOptions];
}

/** The options a URL's scope names, in the order the list offers them. */
export const selectedScope = (options: ScopeOption[], scope: string[]) =>
	options.filter((option) => scope.includes(scopeId(option)));

/**
 * The `libraryCode` parameter for a set of chosen scopes: the union of their Host LMS
 * codes as the CSV the endpoints take, and undefined for the whole consortium.
 *
 * Undefined rather than an empty string because that is the difference between "every
 * library" and "no library", and `cleanParams` drops the parameter entirely.
 */
export function scopeCodes(selected: ScopeOption[]): string | undefined {
	const codes = new Set<string>();
	for (const option of selected) {
		for (const code of option.codes) codes.add(code);
	}
	return codes.size > 0 ? Array.from(codes).join(",") : undefined;
}
