import type { Group } from "@models/Group";

/**
 * A group's Insights scope: the Host LMS codes of its member libraries.
 *
 * Every scoped Insights endpoint takes a comma-separated SET of codes, so a group needs no
 * new query and no new endpoint - only the codes the group query already returns. Two
 * members sharing a Host LMS contribute one code, which is why this de-duplicates: the
 * statistics are filtered by Host LMS, not by library.
 */

export const groupOf = (data: any): Group | undefined =>
	data?.libraryGroups?.content?.[0];

export function groupCodesOf(data: any): string | undefined {
	const codes = new Set<string>();

	for (const member of groupOf(data)?.members ?? []) {
		const code = (member as any)?.library?.agency?.hostLms?.code;
		if (code) codes.add(code);
	}

	return codes.size ? Array.from(codes).join(",") : undefined;
}
