interface Member {
	id?: string | null;
	title?: string | null;
	sourceSystemId?: string | null;
}

interface HostLms {
	id?: string | null;
	name?: string | null;
}

/**
 * "Title · Host LMS" for each member bib, so a reader sees which record and whose it is. A
 * bib the cluster no longer holds is missing from the map and keeps its id.
 */
export const clusterMemberLabels = (
	members: readonly Member[] | null | undefined,
	hostLmss: readonly HostLms[] | null | undefined,
): Map<string, string> => {
	const systems = new Map(
		(hostLmss ?? []).flatMap((system) =>
			system.id && system.name ? [[system.id, system.name] as const] : [],
		),
	);
	return new Map(
		(members ?? []).flatMap((member) => {
			if (!member.id || !member.title) return [];
			const system = member.sourceSystemId
				? systems.get(member.sourceSystemId)
				: undefined;
			return [
				[member.id, system ? `${member.title} · ${system}` : member.title],
			] as const;
		}),
	);
};
