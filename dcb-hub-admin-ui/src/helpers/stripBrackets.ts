/**
 * Strips the square brackets a barcode can arrive wrapped in ("[26060]"), which
 * is how a host LMS list value reaches the UI.
 *
 * Copying is not decoration here: staff paste these straight into the staff
 * request and expedited checkout forms, and both reject any value containing
 * "[" or "]" ("Please remove any brackets from the barcode"). A copy that keeps
 * the brackets just moves the retyping one step later.
 *
 * Every bracket goes, not just a wrapping pair: the forms reject the character
 * anywhere in the value, so a half-stripped barcode would still fail to paste.
 */
export const stripBrackets = (value: string): string =>
	value.replace(/[[\]]/g, "").trim();
