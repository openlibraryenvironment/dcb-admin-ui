import { isConsortiumBrandingEnabled } from "@helpers/featureFlags";
import {
	CONSORTIUM_BRAND_CHROME_FIELDS,
	CONSORTIUM_BRAND_FIELDS,
	CONSORTIUM_BRAND_LEGACY_FIELDS,
} from "@constants/serviceCapabilities";

/**
 * The consortium brand selection, in whichever shape this deployment's dcb-service
 * actually has — R-19.
 *
 * <h2>Why the document changes, and not just the component</h2>
 *
 * dcb-service 9.0.0's migration V9_0_004 replaced `headerImageUrl`/`aboutImageUrl` and
 * their four uploader columns with the merged brand columns. Asking 8.71.0 for
 * `brandLogoUrl` does NOT return null: an unknown field is a GraphQL VALIDATION error
 * and it fails the entire operation. LoadConsortium is fetched in three route loaders
 * via ensureQueryData, so on 8.71.0 those routes render their errorComponent, and
 * LoadConsortiumHeader runs on every page, so the header loses the consortium as well.
 *
 * A flag that hides a component therefore fixes nothing. The selection set itself has
 * to change, which is what this is.
 *
 * <h2>Why legacy mode still selects something</h2>
 *
 * The obvious cheap answer - select nothing before 9.0.0 - visibly REMOVES branding
 * that works in the deployment today, because 8.71.0 holds the same two marks under
 * the pre-migration names. Reading them keeps the header exactly as an administrator
 * on 8.71.0 already sees it.
 *
 * <h2>What legacy mode deliberately does NOT select</h2>
 *
 * `headerImageUploader`, `headerImageUploaderEmail`, `aboutImageUploader` and
 * `aboutImageUploaderEmail`. They are a member of staff's name and email address on a
 * type any authenticated principal can read, which is exactly why 9.0.0 deleted them.
 * A transitional window is not a reason to put PII back in every administrator's
 * browser. Who changed a mark is in dataChangeLog.
 *
 * Both shapes are normalised by readConsortiumBrand in @helpers/consortiumBrand, so
 * nothing downstream has to know which server answered.
 */

/**
 * `chrome` is the header's two marks; `full` is everything the consortium record and
 * the branding form read. Legacy mode answers both with the two columns 8.71.0 has,
 * because the other four have no older equivalent to fall back to.
 */
export type ConsortiumBrandSelectionForm = "chrome" | "full";

export const consortiumBrandSelection = (
	form: ConsortiumBrandSelectionForm,
): string => {
	if (!isConsortiumBrandingEnabled()) {
		return CONSORTIUM_BRAND_LEGACY_FIELDS.join("\n\t\t\t\t");
	}

	return (
		form === "chrome" ? CONSORTIUM_BRAND_CHROME_FIELDS : CONSORTIUM_BRAND_FIELDS
	).join("\n\t\t\t\t");
};

/**
 * The brand keys `UpdateConsortiumInput` only accepts from 9.0.0 onwards.
 *
 * Exported because stripping them from mutation VARIABLES is a separate job from
 * leaving them out of the selection set, and both have to happen: sending
 * `brandLogoUrl: ""` to 8.71.0 is still an unknown input field and still fails
 * validation. See stripUnsupportedConsortiumInput in @helpers/consortiumBrand.
 */
export const CONSORTIUM_BRAND_INPUT_KEYS: readonly string[] =
	CONSORTIUM_BRAND_FIELDS;
