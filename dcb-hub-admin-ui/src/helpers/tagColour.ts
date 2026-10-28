/**
 * The theme palette names a request tag can be shown in. Names, not colour values, so a
 * tag follows the theme in use and its chip keeps the theme's contrast. docs/request-tags.md
 */
export const TAG_COLOURS = [
	"default",
	"primary",
	"secondary",
	"info",
	"success",
	"warning",
	"error",
] as const;

export type TagColour = (typeof TAG_COLOURS)[number];

// The five tags dcb-service seeds. Its request tag colour migration seeds these same names,
// so a starter tag looks the same before and after a deployment begins storing colours.
const STARTER_COLOURS: Readonly<Record<string, TagColour>> = {
	DAMAGED: "error",
	MISSING_PIECES: "warning",
	PATRON_CONTACTED: "info",
	RETURN_DISPUTED: "secondary",
	SLOW_TO_SHIP: "primary",
};

export const isTagColour = (value: unknown): value is TagColour =>
	typeof value === "string" &&
	(TAG_COLOURS as readonly string[]).includes(value);

/** The colour a tag is shown in: its own where it has one, else its starter colour, else default. */
export const tagColour = (code: string, stored?: string | null): TagColour =>
	isTagColour(stored) ? stored : (STARTER_COLOURS[code] ?? "default");
