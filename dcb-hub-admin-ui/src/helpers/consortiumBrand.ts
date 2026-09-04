import { CONSORTIUM_BRAND_INPUT_KEYS } from "@fragments/consortiumBrand";
import { isConsortiumBrandingEnabled } from "@helpers/featureFlags";

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
 * The variables for updateConsortium, with the brand keys removed when this
 * deployment's dcb-service cannot accept them.
 *
 * Blanking them is NOT enough. `brandLogoUrl: ""` is still a field that
 * UpdateConsortiumInput does not declare before 9.0.0, so the mutation fails
 * validation and NOTHING on the consortium form saves - name, description and website
 * included. The key has to be absent.
 *
 * Returns a new object; the caller's input is never mutated.
 */
export const stripUnsupportedConsortiumInput = <T extends Record<string, any>>(
	input: T,
): Partial<T> => {
	if (isConsortiumBrandingEnabled()) {
		return { ...input };
	}

	return Object.fromEntries(
		Object.entries(input).filter(
			([key]) => !CONSORTIUM_BRAND_INPUT_KEYS.includes(key),
		),
	) as Partial<T>;
};
