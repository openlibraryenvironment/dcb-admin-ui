import { unsupportedInputKeys } from "@helpers/capabilityFields";

/**
 * Reading and writing the consortium brand across two dcb-service shapes — R-19.
 *
 * The selection set is chosen in @fragments/consortiumBrand; this is the other half.
 * Callers read through readConsortiumBrand and write through
 * stripUnsupportedConsortiumInput, and none of them needs to know which server
 * answered.
 */

/** The two marks DCB Admin's own chrome renders, whichever columns carried them. */
export interface ConsortiumChromeBrand {
	/** The square app-bar mark and favicon. `brandHeaderIconUrl`, or 8.71.0's `headerImageUrl`. */
	headerIconUrl: string;
	/** The larger lockup. `brandLogoUrl`, or 8.71.0's `aboutImageUrl`. */
	logoUrl: string;
}

/**
 * The consortium's marks, from whichever pair of columns the response carries.
 *
 * `??` rather than `||` on each side: an explicitly cleared mark is the empty string
 * and must stay cleared, not fall through to the other shape's column. In practice
 * only one pair is ever present - the document asked for one or the other - but a
 * response carrying both (a deployment mid-upgrade, a mock that over-specifies) must
 * resolve to the 9.0.0 columns, which are the ones the migration wrote last.
 */
export const readConsortiumBrand = (
	consortium: Record<string, any> | null | undefined,
): ConsortiumChromeBrand => ({
	headerIconUrl:
		consortium?.brandHeaderIconUrl ?? consortium?.headerImageUrl ?? "",
	logoUrl: consortium?.brandLogoUrl ?? consortium?.aboutImageUrl ?? "",
});

/**
 * The variables for updateConsortium, with every key this deployment's dcb-service
 * cannot accept removed.
 *
 * Blanking them is NOT enough. `brandLogoUrl: ""` is still a field that
 * UpdateConsortiumInput does not declare before 9.0.0, so the mutation fails
 * validation and NOTHING on the consortium form saves - name, description and website
 * included. The key has to be absent.
 *
 * The key list comes from the capability registry rather than from one capability's
 * constant, because there is now more than one threshold on this input type: the brand
 * needs 9.0.0 and `supportUrl` needs a release that does not exist yet (V-11.1). A
 * per-capability branch here would have to grow a line every time, and the line nobody
 * adds is the one that breaks the form.
 *
 * Returns a new object; the caller's input is never mutated.
 */
export const stripUnsupportedConsortiumInput = <T extends Record<string, any>>(
	input: T,
): Partial<T> => {
	const unsupported = unsupportedInputKeys();
	if (unsupported.size === 0) return { ...input };

	return Object.fromEntries(
		Object.entries(input).filter(([key]) => !unsupported.has(key)),
	) as Partial<T>;
};
