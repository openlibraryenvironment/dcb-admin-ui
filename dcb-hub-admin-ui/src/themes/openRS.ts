import {
	createTheme,
	darken,
	enhanceHighContrast,
	lighten,
	type Theme,
	type ThemeOptions,
} from "@mui/material/styles";
import type {} from "@mui/x-data-grid-premium/themeAugmentation";
import {
	DEFAULT_FONT,
	fontStack,
	isFontName,
	type FontName,
} from "@themes/fonts";
import {
	DEFAULT_DISPLAY,
	DENSITIES,
	isDisplayValue,
	rootFontSize,
	spacingUnit,
	TEXT_SIZES,
	type ThemeDisplay,
} from "@themes/display";
declare module "@mui/material/Button" {
	interface ButtonPropsSizeOverrides {
		xlarge: true;
	}
}
declare module "@mui/material/IconButton" {
	interface IconButtonPropsSizeOverrides {
		xlarge: true;
	}
}
/**
 * The brand's semantic colour tokens.
 *
 * ONE list. It used to be four byte-identical copies — `Palette`, `PaletteColor`,
 * `PaletteOptions` and `SimplePaletteColorOptions` each spelled out the same forty keys,
 * about 200 lines of this file. A key added to three of the four type-checked and then
 * failed at the call site with a message about whichever interface was missed.
 *
 * WHY THESE LIVE UNDER `primary` AND WHY THAT IS THE WRONG SHAPE. `theme.palette.primary.X`
 * and `sx={{ color: "primary.X" }}` resolve identically in every theme and mode, which is
 * the property the file was after. But `primary` is a `PaletteColor` — an intensity ramp
 * around one hue, whose `light`/`dark`/`contrastText` MUI derives from `main` — and forty
 * unrelated surfaces and inks are now sitting in it. `sx={{ color: "primary.hover" }}`
 * reads as a shade of the brand colour and is a hover ground.
 *
 * MUI's documented pattern for brand keys is a palette node of their own
 * (https://mui.com/material-ui/customization/palette/), which would give the same
 * resolution with none of the collision — `surface.sidebar`, `ink.navigation`. That is a
 * ~240-reference change and is recorded in DCB_ADMIN_2_0_UX_REVIEW.md §2.4 rather than
 * done here. Collapsing the duplication first is what makes it a rename instead of a
 * rewrite.
 */
interface BrandTokens {
	attributeTitle: string;
	breadcrumbs: string;
	buttonForSelectedChildPage: string;
	buttonForSelectedPage: string;
	codeBlockBackground: string;
	detailsAccordionSummary: string;
	editableFieldBackground: string;
	errorBackground: string;
	exclamationIcon: string;
	footerArea: string;
	footerText: string;
	linkedFooterBackground: string;
	linkedFooterText: string;
	header: string;
	headerText: string;
	headingColor: string;
	hitCountText: string;
	hover: string;
	hoverOnSelectedPage: string;
	iconSymbol: string;
	inactiveBackground: string;
	link: string;
	linkText: string;
	landingBackground: string;
	landingCard: string;
	loginCard: string;
	loginText: string;
	navigationText: string;
	navigationTextActive: string;
	searchResultBackground: string;
	searchResultTitle: string;
	selectedText: string;
	sidebar: string;
	titleArea: string;
	pageBackground: string;
	pageContentBackground: string;
	loginButtonOutlineColor: string;
	outlineColor: string;
	tabsBackground: string;
	/**
	 * The bar under the selected tab, and the one place a brand's accent colour is
	 * allowed to be itself.
	 *
	 * It exists because an indicator is a GRAPHICAL OBJECT, not text: WCAG 1.4.11 asks
	 * 3:1 against what sits beside it, where a label would need 4.5:1. FOLIO's coral is
	 * the case in point — 2.88:1 on white, so it can never be ink or a text ground, and
	 * 6.05:1 on the near-black tab bar it now sits on.
	 *
	 * Defaults to the brand's own `main` for every theme that has no separate accent, so
	 * this token changed nothing anywhere except FOLIO.
	 */
	tabIndicator: string;
}

declare module "@mui/material/styles" {
	/*
	 * `no-empty-object-type` is right in general and wrong here. These four are MODULE
	 * AUGMENTATION: TypeScript merges a declaration into MUI's own only through an
	 * `interface`, so the type alias the rule wants would not augment anything. An empty
	 * body is the whole mechanism, not an oversight.
	 */
	/* eslint-disable @typescript-eslint/no-empty-object-type */
	interface Palette extends BrandTokens {}
	interface PaletteColor extends Partial<BrandTokens> {}
	interface PaletteOptions extends Partial<BrandTokens> {}
	interface SimplePaletteColorOptions extends Partial<BrandTokens> {}
	/* eslint-enable @typescript-eslint/no-empty-object-type */

	interface TypographyVariants {
		appTitle?: React.CSSProperties;
		loginCardText?: React.CSSProperties;
		cardActionText?: React.CSSProperties;
		subheading?: React.CSSProperties;
		componentSubheading?: React.CSSProperties;
		attributeTitle?: React.CSSProperties;
		attributeText: React.CSSProperties;
		loginHeader?: React.CSSProperties;
		modalTitle?: React.CSSProperties;
		homePageText?: React.CSSProperties;
		notFoundTitle?: React.CSSProperties;
		notFoundText?: React.CSSProperties;
		linkedFooterTextSize?: React.CSSProperties;
		linkedFooterHeader?: React.CSSProperties;
		loadingText?: React.CSSProperties;
		accordionSummary?: React.CSSProperties;
		subTabTitle?: React.CSSProperties;
		hitCount: React.CSSProperties;
		searchResultTitle: React.CSSProperties;
	}
	interface TypographyVariantsOptions {
		appTitle?: React.CSSProperties;
		loginCardText?: React.CSSProperties;
		cardActionText?: React.CSSProperties;
		subheading?: React.CSSProperties;
		componentSubheading?: React.CSSProperties;
		attributeTitle?: React.CSSProperties;
		attributeText?: React.CSSProperties;
		loginHeader?: React.CSSProperties;
		modalTitle?: React.CSSProperties;
		homePageText?: React.CSSProperties;
		notFoundTitle?: React.CSSProperties;
		notFoundText?: React.CSSProperties;
		linkedFooterTextSize?: React.CSSProperties;
		linkedFooterHeader?: React.CSSProperties;
		loadingText?: React.CSSProperties;
		accordionSummary?: React.CSSProperties;
		subTabTitle?: React.CSSProperties;
		hitCount?: React.CSSProperties;
		searchResultTitle?: React.CSSProperties;
	}
}

declare module "@mui/material/Typography" {
	interface TypographyPropsVariantOverrides {
		appTitle: true;
		loginCardText: true;
		cardActionText: true;
		subheading: true;
		componentSubheading: true;
		attributeTitle: true;
		attributeText: true;
		loginHeader: true;
		modalTitle: true;
		homePageText: true;
		notFoundTitle: true;
		notFoundText: true;
		linkedFooterTextSize: true;
		linkedFooterHeader: true;
		loadingText: true;
		accordionSummary: true;
		subTabTitle: true;
		hitCount: true;
		searchResultTitle: true;
	}
}

declare module "@mui/material/Paper" {
	interface PaperPropsVariantOverrides {
		styled: true;
		dataGrid: true;
		sub: true;
	}
}

declare module "@mui/material/Accordion" {
	interface AccordionPropsVariantOverrides {
		styled: true;
		dataGrid: true;
		sub: true;
	}
}

declare module "@mui/material/AccordionDetails" {
	interface AccordionDetailsPropsOverrides {
		sub: true;
		dataGrid: true;
	}
}

declare module "@mui/material/AccordionSummary" {
	interface AccordionSummaryPropsOverrides {
		sub: true;
		dataGrid: true;
	}
}

declare module "@mui/material/Tab" {
	interface TabPropsVariantOverrides {
		secondary: true;
	}
}

// Page-level ink is measured against `pageBackground` (#F9F9F9), not white:
// that is the surface StructuralLayout actually paints. #287BAF reached AA on
// white but only 4.39:1 there, so it is darkened 2%.
const lightPrimary = "#2778AB";
const darkPrimary = "#35B7FF";
const lightDetailsAccordion = "#F6F6F6";
const darkDetailsAccordion = "#424242";

// ---------------------------------------------------------------------------
// Design tokens
//
// Every custom semantic token lives under `primary`, so `theme.palette.primary.X`
// and `sx="primary.X"` resolve identically in every theme and mode. High contrast
// is a light-grounded WCAG 2.2 AAA (>= 7:1) scheme; light/dark target AA (>= 4.5:1).
//
// Themes are separate `createTheme` objects swapped at the provider (see
// `getAppTheme`) rather than custom MUI colour schemes: a custom-named colour
// scheme is not given MUI's default palette baseline, so `createThemeWithVars`
// throws "Cannot read properties of undefined (reading 'background')". Swapping
// whole themes is the supported path for multiple brands + modes.
// ---------------------------------------------------------------------------

// ---- OpenRS (default brand) ----
const openRSLight = {
	main: lightPrimary,
	attributeTitle: "#000000",
	breadcrumbs: "#246F9E",
	buttonForSelectedChildPage: "#707070",
	buttonForSelectedPage: lightPrimary,
	codeBlockBackground: "#F5F5F5",
	detailsAccordionSummary: lightDetailsAccordion,
	editableFieldBackground: "#E2EEF6",
	errorBackground: "#FFDAE1",
	// #999999 gave these icons only 2.85:1 on the page, under the 3:1 non-text
	// minimum. #767676 cleared AA on white but only 4.31:1 on the #F9F9F9 page
	// these actually sit on. Dark mode keeps #999999 (5.85:1 on its own page).
	exclamationIcon: "#727272",
	footerArea: "#FFFFFF",
	footerText: "#000000",
	linkedFooterBackground: "#0C4068",
	linkedFooterText: "#FFFFFF",
	header: "#0C4068",
	headerText: "#FFFFFF",
	headingColor: "#0C4068",
	hitCountText: "#333333",
	hover: "#EEEEEE",
	hoverOnSelectedPage: "#A9A9A9",
	iconSymbol: "#FFFFFF",
	// Carries the white step number in DCBStepIcon, so it is a text ground:
	// #8C8C8C left that number at 3.36:1.
	inactiveBackground: "#757575",
	link: "#0C4068",
	linkText: "#246F9E",
	landingBackground: "#F9F9F9",
	landingCard: "#FFFFFF",
	loginCard: "#E2EEF6",
	loginText: "#0C4068",
	// Page-navigation tabs: soft-blue bar with dark, AAA-contrast text.
	tabsBackground: "#E2EEF6",
	navigationText: "#0C4068",
	navigationTextActive: "#0C4068",
	searchResultBackground: "#F6F9FC",
	searchResultTitle: "#186498",
	selectedText: "#FFFFFF",
	sidebar: "#F6F6F6",
	titleArea: "#FFFFFF",
	pageBackground: "#F9F9F9",
	pageContentBackground: "#FFFFFF",
	loginButtonOutlineColor: "#FFFFFF",
	outlineColor: "#000000",
};

const openRSDark = {
	main: darkPrimary,
	attributeTitle: "#FFFFFF",
	breadcrumbs: "#35B7FF",
	// Ground for `selectedText` (white) in the sidebar: #999999 gave 2.85:1.
	// #707070 matches the light theme and still reads against the dark page.
	buttonForSelectedChildPage: "#707070",
	buttonForSelectedPage: "#287BAF",
	// Lifted one step off the #1E1E1E page so the block reads as inset, not a
	// light panel: white text clears AAA on it.
	codeBlockBackground: "#2A2A2A",
	detailsAccordionSummary: darkDetailsAccordion,
	// Blue-tinted dark echoing the light theme's tint. Must stay dark: the field
	// renders `text.primary` (white) in dark mode.
	editableFieldBackground: "#33414D",
	errorBackground: "transparent",
	exclamationIcon: "#999999",
	footerArea: "#202020",
	footerText: "#FFFFFF",
	linkedFooterBackground: "#000000",
	linkedFooterText: "#FFFFFF",
	header: "#000000",
	headerText: "#FFFFFF",
	headingColor: "#FFFFFF",
	hitCountText: "#FFFFFF",
	hover: "#424242",
	hoverOnSelectedPage: "#424242",
	iconSymbol: "#FFFFFF",
	// Carries the white step number in DCBStepIcon, so it is a text ground:
	// #8C8C8C left that number at 3.36:1.
	inactiveBackground: "#757575",
	link: "#B3E5FC",
	linkText: "#35B7FF",
	landingBackground: "#000000",
	landingCard: "#202020",
	loginCard: "#292929",
	loginText: "#FFFFFF",
	tabsBackground: "#292929",
	navigationText: "#B3E5FC",
	navigationTextActive: "#FFFFFF",
	searchResultBackground: "#424242",
	// Lifted from #63B3ED, which sat at 4.40:1 on the #424242 result card.
	searchResultTitle: "#7FC4F5",
	selectedText: "#FFFFFF",
	sidebar: "#292929",
	titleArea: "#1E1E1E",
	pageBackground: "transparent",
	pageContentBackground: "transparent",
	loginButtonOutlineColor: "#FFFFFF",
	outlineColor: "#FFFFFF",
};

// WCAG 2.2 AAA. Pure white ground, near-black text, one saturated accent that
// clears 7:1 on white, solid outlines. Built by overriding the standard light
// tokens so nothing is left undefined.
const openRSHighContrast = {
	...openRSLight,
	main: "#00407A",
	breadcrumbs: "#00407A",
	// The neutral greys inherited from the light palette are tuned to AA (4.5:1).
	// This scheme promises AAA, so the two that carry white text are deepened to
	// clear 7:1.
	buttonForSelectedChildPage: "#565656",
	inactiveBackground: "#565656",
	buttonForSelectedPage: "#00407A",
	editableFieldBackground: "#FFFFFF",
	errorBackground: "#FFFFFF",
	exclamationIcon: "#000000",
	hitCountText: "#000000",
	hover: "#D9D9D9",
	hoverOnSelectedPage: "#BFBFBF",
	iconSymbol: "#000000",
	linkedFooterBackground: "#000000",
	header: "#000000",
	headingColor: "#000000",
	link: "#00407A",
	linkText: "#00407A",
	landingBackground: "#FFFFFF",
	landingCard: "#FFFFFF",
	loginCard: "#FFFFFF",
	loginText: "#000000",
	tabsBackground: "#FFFFFF",
	navigationText: "#000000",
	navigationTextActive: "#000000",
	searchResultBackground: "#FFFFFF",
	searchResultTitle: "#00407A",
	sidebar: "#FFFFFF",
	pageBackground: "#FFFFFF",
	outlineColor: "#000000",
};

// ---- Evergreen (alternative brand) ----
// Same neutral structure as OpenRS; only the green accent tokens differ, so the
// AA/AAA guarantees of the shared neutrals are preserved.
const evergreenLight = {
	...openRSLight,
	main: "#2E7D32",
	breadcrumbs: "#2E7D32",
	buttonForSelectedPage: "#2E7D32",
	linkedFooterBackground: "#1B5E20",
	header: "#1B5E20",
	headingColor: "#1B5E20",
	link: "#1B5E20",
	linkText: "#2E7D32",
	editableFieldBackground: "#E8F5E9",
	loginCard: "#E8F5E9",
	loginText: "#1B5E20",
	tabsBackground: "#E8F5E9",
	navigationText: "#1B5E20",
	navigationTextActive: "#1B5E20",
	searchResultTitle: "#1B5E20",
};

const evergreenDark = {
	...openRSDark,
	main: "#81C784",
	breadcrumbs: "#81C784",
	buttonForSelectedPage: "#2E7D32",
	link: "#A5D6A7",
	linkText: "#81C784",
	loginCard: "#24312A",
	tabsBackground: "#26332A",
	navigationText: "#A5D6A7",
	searchResultTitle: "#A5D6A7",
};

const evergreenHighContrast = {
	...openRSHighContrast,
	main: "#1B5E20",
	breadcrumbs: "#1B5E20",
	buttonForSelectedPage: "#1B5E20",
	link: "#1B5E20",
	linkText: "#1B5E20",
	searchResultTitle: "#1B5E20",
};

// ---- Koha (ILS theme) ----
// Koha Community Green is #5C8A2E, but it is used both as text on the page and
// as the ground under white text, and both roles reduce to the same test:
// contrast against the #F9F9F9 page. At #5C8A2E that is 3.94:1. Darkening 5% to
// #547D29 clears AA in both directions and stays visually near-indistinguishable
// from the brand green.
const kohaGreen = "#547D29";

const kohaLight = {
	...openRSLight,
	main: kohaGreen,
	breadcrumbs: "#222222",
	buttonForSelectedPage: kohaGreen,
	linkedFooterBackground: kohaGreen,
	header: kohaGreen,
	headingColor: kohaGreen,
	link: kohaGreen,
	linkText: kohaGreen,
	editableFieldBackground: "#F0F4EC",
	loginCard: "#F0F4EC",
	loginText: "#222222",
	// Saturated green bar, so the labels must be white: #222222 only reached
	// 3.89:1 on it, and the active label was the bar's own green (1.00:1 -
	// literally invisible). Active state is carried by the Tabs indicator, so
	// both labels share one colour, as in the OpenRS palette.
	tabsBackground: kohaGreen,
	navigationText: "#FFFFFF",
	navigationTextActive: "#FFFFFF",
	// ...and the indicator has to be visible for that sentence to be true. It was
	// `main`, which here IS kohaGreen - the bar's own colour, 1.00:1, so the selected
	// tab was marked by bold weight and nothing else. Found by the non-text contrast
	// assertion in openRS.contrast.test.ts.
	//
	// White, at 4.84:1, and not the lighter brand green #88B744, which is 2.05:1 on
	// this bar and would have swapped one invisible indicator for another. A white
	// indicator on a brand-coloured bar is the ordinary Material pattern: the labels
	// are white too, and selection reads from the mark's position and the bold weight.
	//
	// The deeper problem is that kohaGreen is a mid-tone doing a text ground's job -
	// the same thing that forced FOLIO's coral to be darkened 20%. Koha is a candidate
	// for the same near-black bar treatment; see DCB_ADMIN_2_0_UX_REVIEW.md.
	tabIndicator: "#FFFFFF",
	searchResultTitle: "#222222",
};

const kohaDark = {
	...openRSDark,
	main: "#88B744",
	breadcrumbs: "#D4D4D4",
	buttonForSelectedPage: kohaGreen,
	link: "#88B744",
	linkText: "#88B744",
	loginCard: "#2D332A",
	tabsBackground: "#2D332A",
	navigationText: "#D4D4D4",
	searchResultTitle: "#D4D4D4",
};

const kohaHighContrast = {
	...openRSHighContrast,
	main: "#2E4A14",
	breadcrumbs: "#000000",
	buttonForSelectedPage: "#2E4A14",
	link: "#2E4A14",
	linkText: "#2E4A14",
	searchResultTitle: "#000000",
};

// ---- FOLIO ----
//
// FOLIO's coral is #FF674C and this theme now uses it, unaltered.
//
// It could not before. As a TEXT GROUND coral gives white 2.88:1 and FOLIO's own dark
// blue 3.32:1 — no ink passes AA on it — so the previous version darkened it 20% to
// #E52300 and painted the header, tab bar and linked footer in that. It cleared the gate
// at 4.59:1 and it was no longer FOLIO's colour: a 20% shift is not a shade, and the one
// thing a brand theme has to get right is the brand.
//
// The fix is to stop asking the accent to carry text. FOLIO's own applications put their
// chrome on a near-black bar and let the coral be an accent on it, and that is what this
// does: #1A1A1A for the header, the tab bar and the linked footer, white labels at
// 17.40:1, and the true coral as the selected-tab indicator at 6.05:1 against that bar.
//
// An indicator may be an accent where a label may not: WCAG 1.4.11 asks 3:1 of a
// graphical object against what sits beside it, against 4.5:1 for text. Coral is 2.88:1
// on white, which is why it appears nowhere on the page itself.
const folioCoral = "#FF674C";
// The chrome. Not pure black: #1A1A1A keeps the bar readable as a surface rather than a
// hole, and still gives white 17.40:1 and the coral 6.05:1.
const folioInk = "#1A1A1A";

const folioLight = {
	...openRSLight,
	main: "#47769C", // FOLIO Bright Blue, 4% darker for 4.60:1 on the #F9F9F9 page
	breadcrumbs: "#47769C",
	// FOLIO Bright Blue #0077C8 reached only 4.46:1 on the page; 1% darker.
	buttonForSelectedPage: "#0075C5",
	header: folioInk,
	headerText: "#FFFFFF",
	linkedFooterBackground: folioInk,
	linkedFooterText: "#FFFFFF",
	tabsBackground: folioInk,
	navigationText: "#FFFFFF",
	navigationTextActive: "#FFFFFF",
	tabIndicator: folioCoral,
	headingColor: "#094970",
	link: "#0075C5",
	linkText: "#0075C5",
	editableFieldBackground: "#EAF4FA",
	loginCard: "#EAF4FA",
	loginText: "#094970",
	searchResultTitle: "#0075C5",
};

const folioDark = {
	...openRSDark,
	main: "#5AB5D4", // FOLIO Cyan
	breadcrumbs: "#5AB5D4",
	buttonForSelectedPage: "#0077C8",
	link: "#5AB5D4",
	linkText: "#5AB5D4",
	loginCard: "#222C33",
	tabsBackground: "#222C33",
	navigationText: "#5AB5D4",
	// The coral reads on the dark tab bar too (4.94:1 on #222C33), so dark mode keeps the
	// brand accent rather than falling back to the cyan the rest of the theme uses.
	tabIndicator: folioCoral,
	// Lifted 2% off the brand cyan: #5AB5D4 gave 4.30:1 on the #424242 card.
	searchResultTitle: "#62B9D6",
};

const folioHighContrast = {
	...openRSHighContrast,
	main: "#042D45",
	breadcrumbs: "#042D45",
	buttonForSelectedPage: "#042D45",
	link: "#042D45",
	linkText: "#042D45",
	searchResultTitle: "#042D45",
	// NO CORAL HERE, deliberately. High contrast is a light-grounded AAA scheme and its
	// tab bar is the pale #E2EEF6 inherited from openRS; coral is 2.44:1 on it, under even
	// the 3:1 an indicator needs. A user who has asked for maximum contrast is not the
	// person to spend the brand's last legible margin on, so the indicator stays the deep
	// navy the rest of this scheme uses.
	tabIndicator: "#042D45",
};

// ---- MOBIUS ----
// MOBIUS Light Blue (#0096A7) only reaches 3.42:1 against the #F9F9F9 page, and
// it is used both as text on the page and as the ground under white text.
// Darkened 6% to #007E8C (4.58:1) for both roles in light mode. On the tab bar's
// own tint it needs a touch more (#007886). Dark mode keeps the true brand cyan:
// it clears AA against a proper dark page.
const mobiusCyan = "#007E8C";

const mobiusLight = {
	...openRSLight,
	main: mobiusCyan,
	breadcrumbs: "#003D6A", // MOBIUS Dark Blue
	buttonForSelectedPage: mobiusCyan,
	linkedFooterBackground: "#003D6A",
	header: "#003D6A",
	headingColor: "#003D6A",
	link: "#003D6A",
	linkText: mobiusCyan,
	editableFieldBackground: "#E5F4F6", // Soft 10% tint of the Light Blue
	loginCard: "#E5F4F6",
	loginText: "#003D6A",
	tabsBackground: "#E5F4F6",
	navigationText: "#003D6A",
	navigationTextActive: "#007886",
	searchResultTitle: "#003D6A",
};

const mobiusDark = {
	...openRSDark,
	main: "#0096A7",
	breadcrumbs: "#4DD0E1", // Lightened cyan for dark-mode text legibility
	buttonForSelectedPage: mobiusCyan,
	link: "#4DD0E1",
	linkText: "#4DD0E1",
	loginCard: "#111C24", // Deep blue-grey tint
	tabsBackground: "#111C24",
	navigationText: "#4DD0E1",
	searchResultTitle: "#4DD0E1",
};

const mobiusHighContrast = {
	...openRSHighContrast,
	// Light Blue fails WCAG AAA contrast, so we strictly use Dark Blue here
	main: "#003D6A",
	breadcrumbs: "#003D6A",
	buttonForSelectedPage: "#003D6A",
	link: "#003D6A",
	linkText: "#003D6A",
	searchResultTitle: "#003D6A",
};

// ---- Blue and White (NHS) ----
// Colours taken verbatim from the NHS design system palette
// (https://service-manual.nhs.uk/design-system/styles/colour). Unlike every
// other brand here, no hue needed shifting for AA: NHS Blue #005EB8 gives
// 5.76:1 as ink on this theme's #F0F4F5 page and 6.38:1 as the ground under
// white. NHS Dark Blue #003087 gives 10.70:1 and 11.85:1 respectively, clearing
// AAA, so the high-contrast scheme is pure brand rather than a darkened
// approximation of one.
const nhsBlue = "#005EB8";
const nhsDarkBlue = "#003087";
const nhsBlack = "#212B32"; // NHS text colour
const nhsGrey1 = "#4C6272"; // NHS secondary-text grey
const nhsGrey5 = "#F0F4F5"; // NHS page tint - the "reduce glare" background
// A 10% tint of NHS Blue. Not in the published palette, which offers no blue
// surface tone; derived so the login card and tab bar read as blue-on-white
// rather than grey, and dark enough to be distinguishable from the page.
const nhsPaleBlue = "#E5EFF8";

const nhsLight = {
	...openRSLight,
	main: nhsBlue,
	attributeTitle: nhsBlack,
	breadcrumbs: nhsBlue,
	buttonForSelectedPage: nhsBlue,
	codeBlockBackground: nhsGrey5,
	detailsAccordionSummary: nhsGrey5,
	editableFieldBackground: nhsPaleBlue,
	// NHS grey-1 rather than the base #767676: same role, and it clears the 3:1
	// non-text minimum on the grey-5 page (5.75:1), not just on white.
	exclamationIcon: nhsGrey1,
	footerText: nhsBlack,
	linkedFooterBackground: nhsDarkBlue,
	header: nhsBlue,
	headingColor: nhsDarkBlue,
	hitCountText: nhsBlack,
	hover: nhsGrey5,
	// White text ground, so it is a text test: NHS grey-1 gives 6.37:1.
	inactiveBackground: nhsGrey1,
	link: nhsDarkBlue,
	linkText: nhsBlue,
	landingBackground: nhsGrey5,
	loginCard: nhsPaleBlue,
	loginText: nhsDarkBlue,
	// Pale-blue bar, not an NHS Blue one: the Tabs indicator is `primary.main`,
	// so a solid #005EB8 bar would render the active indicator invisible.
	tabsBackground: nhsPaleBlue,
	navigationText: nhsDarkBlue,
	navigationTextActive: nhsDarkBlue,
	searchResultBackground: nhsGrey5,
	searchResultTitle: nhsBlue,
	sidebar: nhsGrey5,
	pageBackground: nhsGrey5,
	outlineColor: nhsBlack,
};

// The NHS palette is defined for light backgrounds only; it has no dark-mode
// counterpart. NHS Blue is far too dark to sit on a #1E1E1E page (1.98:1), so
// the accents here are lightened blues in the NHS family rather than brand hexes.
const nhsDark = {
	...openRSDark,
	main: "#41B6E6",
	breadcrumbs: "#41B6E6",
	buttonForSelectedPage: nhsBlue,
	link: "#A8D5F0",
	linkText: "#41B6E6",
	loginCard: "#1B2A33",
	tabsBackground: "#1E2B36",
	navigationText: "#A8D5F0",
	// #41B6E6 clears AA on the page (7.19:1) but only reaches 4.34:1 on the
	// #424242 result card. Lifted until it clears there too.
	searchResultTitle: "#5BC3EA",
};

// NHS Dark Blue is already AAA on white in both directions, so the AAA scheme
// keeps the brand colour instead of deepening it.
const nhsHighContrast = {
	...openRSHighContrast,
	main: nhsDarkBlue,
	breadcrumbs: nhsDarkBlue,
	buttonForSelectedPage: nhsDarkBlue,
	link: nhsDarkBlue,
	linkText: nhsDarkBlue,
	searchResultTitle: nhsDarkBlue,
};

// ---------------------------------------------------------------------------
// Shared (colour-agnostic) theme options
// ---------------------------------------------------------------------------

// Typography variants whose colour tracks a palette token. Applied via the
// MuiTypography override below (not baked into the variant) so it follows
// whichever theme/mode is active, and yields to an explicit `color` prop.
const TYPOGRAPHY_COLOUR: Record<string, keyof Theme["palette"]["primary"]> = {
	h1: "headingColor",
	h2: "headingColor",
	h3: "headingColor",
	h4: "headingColor",
	componentSubheading: "headingColor",
	accordionSummary: "headingColor",
	appTitle: "headerText",
	attributeTitle: "attributeTitle",
	hitCount: "hitCountText",
};

// EVERY SIZE IN `rem`, AND THAT IS LOAD-BEARING.
//
// Eleven of these were bare numbers (rendered as px) or explicit "14px"/"18px". At the
// browser default root of 16px each value below renders identically to the literal it
// replaces - 32px is 2rem, 12px is 0.75rem - so nothing about today's appearance moves.
//
// What changes is that they can now be scaled. The text-size preference works by setting
// the ROOT font size (see `rootFontSize` in display.ts): `rem` follows the root, px does
// not. Left as px, raising the text size would have scaled MUI's own body variants and
// left every heading and the whole custom scale exactly where they were - a setting that
// half works, which is worse than one that does not exist.
//
// So: no px in this object. A new variant added in px is a variant that silently opts out
// of the text-size preference.
const typography: ThemeOptions["typography"] = {
	fontFamily: fontStack(DEFAULT_FONT),
	h1: { fontSize: "2rem", fontWeight: 400 },
	h2: { fontSize: "1.5rem", fontWeight: 400 },
	h3: { fontSize: "1.125rem" },
	h4: { fontSize: "1.125rem" },
	appTitle: { fontSize: "1.25rem" },
	loginCardText: { fontSize: "1.125rem" },
	cardActionText: { fontSize: "1rem" },
	subheading: { fontSize: "1.3rem" },
	componentSubheading: { fontSize: "1.3rem" },
	attributeTitle: { fontWeight: "bold" },
	attributeText: { wordBreak: "break-word", textWrap: "wrap" },
	loginHeader: { fontSize: "2rem", fontWeight: "bold" },
	modalTitle: { textAlign: "center", fontWeight: "bold" },
	homePageText: { fontSize: "1.1rem" },
	notFoundTitle: { fontSize: "3rem" },
	notFoundText: { fontSize: "1.5rem" },
	linkedFooterTextSize: { fontSize: "0.875rem" },
	linkedFooterHeader: { fontSize: "1.125rem", fontWeight: "bold" },
	loadingText: { fontSize: "2rem", fontWeight: 400, textAlign: "center" },
	accordionSummary: { fontSize: "1.25rem", fontWeight: 700 },
	subTabTitle: { fontSize: "0.75rem" },
	hitCount: { fontWeight: "bold" },
	searchResultTitle: { fontSize: "1.3rem" },
};

const components: ThemeOptions["components"] = {
	/**
	 * The SELECTED state of a toggle button — found by the axe gate, W-1.
	 *
	 * MUI's default paints a selected `color="primary"` toggle as the primary hue on a
	 * 12%-alpha wash of the same hue. Against a white ground that composites to roughly
	 * the primary colour on near-white, which fails 4.5:1 for every brand in this
	 * registry whose primary is a mid-tone blue or green - and the control it is used
	 * for is the theme and mode picker, so the first thing a user with low vision meets
	 * is a control they cannot read telling them how to make things readable.
	 *
	 * A filled selected state fixes it properly rather than nudging the alpha: the pair
	 * is `primary.main` against `primary.contrastText`, which MUI derives to meet the
	 * palette's own contrastThreshold - 4.5 normally, 7 in high contrast.
	 *
	 * An app-wide defect, so an app-wide override, not an `sx` on one component: the
	 * same default is behind the Host LMS step's toggles and the Insights range picker.
	 */
	MuiToggleButton: {
		styleOverrides: {
			root: ({ theme }) => ({
				"&.Mui-selected": {
					backgroundColor: theme.palette.primary.main,
					color: theme.palette.primary.contrastText,
					"&:hover": {
						backgroundColor: theme.palette.primary.dark,
						color: theme.palette.primary.contrastText,
					},
				},
			}),
		},
	},
	MuiTypography: {
		styleOverrides: {
			root: ({ theme, ownerState }) => {
				const key = TYPOGRAPHY_COLOUR[ownerState.variant as string];
				// Yield to an explicit `color` prop (e.g. error red on invalid fields).
				if (!key || ownerState.color) return {};
				return { color: theme.palette.primary[key] };
			},
		},
	},
	MuiAccordion: {
		defaultProps: {
			slotProps: { transition: { timeout: 400, unmountOnExit: true } },
		},
		styleOverrides: {
			root: ({ theme }) => ({
				boxShadow: "none",
				border: `1px solid ${theme.palette.divider}`,
				"&:not(:last-child)": { borderBottom: 0 },
				"&:before": { display: "none" },
				"&.Mui-expanded": { margin: "0" },
			}),
		},
		variants: [
			{
				props: { variant: "styled" },
				style: {
					borderBottom: "0px",
					borderLeft: "0px",
					borderRight: "0px",
					"&::before": { display: "none" },
				},
			},
			{
				props: { variant: "dataGrid" },
				style: ({ theme }) => ({
					boxShadow: "none",
					backgroundColor: "transparent",
					"&:before": { display: "none" },
					"&:first-of-type": {
						borderTop: `2px solid ${theme.palette.divider}`,
					},
				}),
			},
			{
				props: { variant: "sub" },
				style: {
					borderBottom: "0px",
					borderLeft: "0px",
					borderRight: "0px",
					marginTop: "16px",
					"&::before": { display: "none" },
				},
			},
		],
	},
	MuiAccordionSummary: {
		styleOverrides: {
			root: {
				variants: [
					{
						props: { variant: "dataGrid" },
						style: ({ theme }) => ({
							backgroundColor: "transparent",
							flexDirection: "row-reverse",
							minHeight: "auto",
							"&.Mui-expanded": {
								minHeight: "auto",
							},
							"& .MuiAccordionSummary-content": {
								marginLeft: theme.spacing(1),
							},
						}),
					},
					{
						props: { variant: "sub" },
						style: {
							backgroundColor: "transparent",
							"&.Mui-focusVisible": {
								outline: "2px solid", // For keyboard focus
							},
						},
					},
				],
			},
		},
	},
	MuiAccordionDetails: {
		styleOverrides: {
			root: {
				variants: [
					{
						props: { variant: "dataGrid" },
						style: {
							marginTop: "16px",
						},
					},
					{
						props: { variant: "sub" },
						style: {
							marginTop: "0px",
						},
					},
				],
			},
		},
	},
	MuiTabs: {
		styleOverrides: {
			root: ({ theme }) => ({
				backgroundColor: theme.palette.primary.tabsBackground,
				borderRadius: 4,
			}),
			indicator: ({ theme }) => ({
				// The brand's accent, which for five of the six themes IS `main` - see the
				// token's default in buildTheme. FOLIO is the exception and the reason the
				// token exists: its coral cannot be ink anywhere, but it can be this.
				backgroundColor: theme.palette.primary.tabIndicator,
				height: 3,
			}),
		},
	},
	MuiTab: {
		styleOverrides: {
			root: ({ theme }) => ({
				textTransform: "none",
				color: theme.palette.primary.navigationText,
				"&.Mui-selected": {
					fontWeight: "bold",
					color: theme.palette.primary.navigationTextActive,
				},
				"&.Mui-focusVisible": {
					outline: "2px solid",
					boxSizing: "border-box",
					borderColor: theme.palette.primary.outlineColor,
					outlineOffset: "-2px",
				},
			}),
		},
	},
	MuiButton: {
		defaultProps: { disableRipple: true },
		styleOverrides: {
			root: ({ theme }) => ({
				"&.Mui-focusVisible": {
					outline: "2px solid",
					outlineColor: theme.palette.primary.outlineColor,
				},
				/*
				 * A BORDER IN WINDOWS HIGH CONTRAST MODE, which `enhanceHighContrast` does
				 * not add — it gives MuiButtonBase a focus outline and nothing else.
				 *
				 * Measured under `forced-colors: active`: a contained button computed to
				 * background white, colour black, `border: 0px none` — pixel-identical to
				 * the page body beside it. The fill MUI relies on to say "this is a
				 * control" is exactly what forced colours discards, so the primary action
				 * on every form was a bare run of text with no boundary. WCAG 1.4.11 wants
				 * 3:1 for a component's boundary; there was no boundary to measure.
				 *
				 * `ButtonBorder` is a CSS system colour keyword, so the browser guarantees
				 * it contrasts with the button face whatever theme the user is running.
				 * Outside forced colours this rule does not apply and nothing changes.
				 */
				"@media (forced-colors: active)": {
					border: "1px solid ButtonBorder",
				},
				"&.MuiButton-contained": {
					"&:disabled": {
						background: "#E0E0E0",
						color: "#7E7E7E",
						border: "none",
					},
				},
				"&.MuiButton-outlined": {
					"&:disabled": {
						background: "#E0E0E0",
						color: "#7E7E7E",
						border: "none",
					},
				},
				...theme.applyStyles("dark", {
					"&.MuiButton-contained": {
						"&:disabled": {
							background: "#444444",
							color: "#8c8c8c",
							border: "none",
						},
					},
					"&.MuiButton-outlined": {
						"&:disabled": {
							background: "#444444",
							color: "#8c8c8c",
							border: "none",
						},
					},
				}),
			}),
		},
		variants: [
			{
				props: { variant: "contained" },
				style: ({ theme }) => ({
					textTransform: "none",
					fontSize: "0.95rem",
					":hover": {
						backgroundColor: darken(theme.palette.primary.main, 0.08),
					},
					":active": {
						outline: `1px solid ${theme.palette.primary.light}`,
						backgroundColor: darken(theme.palette.primary.main, 0.16),
					},
					...theme.applyStyles("dark", {
						":hover": {
							backgroundColor: lighten(theme.palette.primary.main, 0.08),
						},
						":active": {
							outline: `1px solid ${theme.palette.primary.light}`,
							backgroundColor: lighten(theme.palette.primary.main, 0.16),
						},
					}),
				}),
			},
			{
				props: { variant: "outlined" },
				style: ({ theme }) => ({
					textTransform: "none",
					fontSize: "0.95rem",
					":hover": {
						backgroundColor: darken(theme.palette.background.default, 0.08),
					},
					":active": {
						border: `1px solid ${theme.palette.primary.light}`,
						outline: `1px solid ${theme.palette.primary.light}`,
						backgroundColor: darken(theme.palette.background.default, 0.16),
					},
					...theme.applyStyles("dark", {
						":hover": {
							backgroundColor: lighten(theme.palette.background.default, 0.08),
						},
						":active": {
							border: `1px solid ${theme.palette.primary.light}`,
							outline: `1px solid ${theme.palette.primary.light}`,
							backgroundColor: lighten(theme.palette.background.default, 0.16),
						},
					}),
				}),
			},
			{
				props: { variant: "text" },
				style: ({ theme }) => ({
					":hover": {
						backgroundColor: darken(theme.palette.background.default, 0.08),
					},
					":active": {
						backgroundColor: darken(theme.palette.background.default, 0.16),
					},
					...theme.applyStyles("dark", {
						":hover": {
							backgroundColor: lighten(theme.palette.background.default, 0.08),
						},
						":active": {
							backgroundColor: lighten(theme.palette.background.default, 0.16),
						},
					}),
				}),
			},
			{
				props: { size: "xlarge" },
				style: { padding: "14px 28px", fontSize: "1.3rem" },
			},
		],
	},
	MuiIconButton: {
		defaultProps: { disableRipple: true },
		styleOverrides: {
			root: ({ theme }) => ({
				"&.Mui-focusVisible": { outline: "2px solid" },
				":hover": {
					backgroundColor: darken(theme.palette.background.default, 0.08),
				},
				":active": {
					backgroundColor: darken(theme.palette.background.default, 0.16),
				},
				...theme.applyStyles("dark", {
					":hover": {
						backgroundColor: lighten(theme.palette.background.default, 0.08),
					},
					":active": {
						backgroundColor: lighten(theme.palette.background.default, 0.16),
					},
				}),
			}),
		},
	},
	MuiListItemButton: {
		defaultProps: { disableRipple: true },
		styleOverrides: {
			root: ({ theme }) => ({
				"&.Mui-focusVisible": {
					border: "2px solid",
					borderColor: theme.palette.primary.outlineColor,
					boxSizing: "border-box",
				},
			}),
		},
	},
	MuiDataGrid: {
		styleOverrides: {
			cell: {
				"&:focus": { outline: "none" },
				":focus-visible": { outline: "2px solid" },
				// A cell put into edit mode is focused programmatically (from the Edit
				// action button), and :focus-visible does not match a programmatic
				// focus that followed a mouse click - so the cell being edited drew no
				// indicator at all. Outline whatever holds focus, as the checkbox
				// cells below already do. WCAG 2.2 SC 2.4.7.
				"&:focus-within": { outline: "2px solid", outlineOffset: "-2px" },
			},
			cellCheckbox: {
				"&:focus-within": { outline: "2px solid", outlineOffset: "-3px" },
			},
			columnHeaderCheckbox: {
				"&:focus-within": { outline: "2px solid", outlineOffset: "-3px" },
			},
			columnHeader: {
				"&:focus": { outline: "none" },
				":focus-visible": { outline: "2px solid" },
			},
		},
	},
	/**
	 * A scrollable region a keyboard user can actually scroll — WCAG 2.1.1.
	 *
	 * `TableContainer` is `overflow: auto`, and eleven of the twelve in this application
	 * also cap their height. So they scroll, and without a tab stop the only way to scroll
	 * one is a pointer: a keyboard-only user reaches the table and cannot see past the
	 * rows that happen to fit.
	 *
	 * Found by the `narrow` Playwright project on its first run, as a SERIOUS
	 * `scrollable-region-focusable` on the consortium insights page at 320px. It is not a
	 * narrow-viewport problem though — the height caps make it true at any width, and the
	 * desktop run simply had no test on a page with one of these tables.
	 *
	 * A theme default rather than twelve props: the next TableContainer someone adds is
	 * covered without their having to know this rule exists. The cost is a tab stop on a
	 * container that is not currently overflowing, which is what MUI's own guidance
	 * accepts - the alternative is measuring overflow at runtime to decide focusability,
	 * and nobody maintains that.
	 */
	MuiTableContainer: {
		defaultProps: {
			tabIndex: 0,
		},
	},

	MuiTooltip: {
		defaultProps: { arrow: true },
		styleOverrides: {
			// Neutral dark ground in both modes: #808080 gave white tooltip text only
			// 3.95:1, below AA. #424242 takes it to 10.1:1 and matches the existing
			// dark-mode neutrals (`hover`, `searchResultBackground`).
			tooltip: { backgroundColor: "#424242", color: "#FFFFFF" },
			arrow: { color: "#424242" },
		},
	},
	MuiAlertTitle: {
		styleOverrides: { root: { fontSize: "1.2rem" } },
	},
	MuiTextField: {
		styleOverrides: {
			root: ({ theme }) => ({
				...theme.applyStyles("dark", {
					":active": { background: "#424242" },
				}),
			}),
		},
	},
	MuiAlert: {
		styleOverrides: {
			root: {
				variants: [
					{
						props: { variant: "standard", color: "success" },
						style: ({ theme }) => ({
							backgroundColor: "#D5EBDF",
							color: "#274E13",
							"& .MuiAlert-icon": { color: "#274E13", paddingTop: 8 },
							outline: "2px solid #274E13",
							...theme.applyStyles("dark", {
								backgroundColor: "transparent",
								color: "inherit",
								"& .MuiAlert-icon": { color: "#D5EBDF" },
								outline: "1px solid #D5EBDF",
							}),
						}),
					},
					{
						props: { variant: "standard", color: "error" },
						style: ({ theme }) => ({
							backgroundColor: "#FFDAE1",
							color: "#660000",
							"& .MuiAlert-icon": { color: "#660000", paddingTop: 8 },
							outline: "2px solid #660000",
							...theme.applyStyles("dark", {
								backgroundColor: "transparent",
								color: "inherit",
								"& .MuiAlert-icon": { color: "#FFDAE1" },
								outline: "1px solid #FFDAE1",
							}),
						}),
					},
					{
						props: { variant: "standard", color: "warning" },
						style: ({ theme }) => ({
							backgroundColor: "#FFE4B2",
							color: "#664200",
							"& .MuiAlert-icon": { color: "#664200", paddingTop: 8 },
							outline: "2px solid #664200",
							...theme.applyStyles("dark", {
								backgroundColor: "transparent",
								color: "inherit",
								"& .MuiAlert-icon": { color: "#FFE4B2" },
								outline: "1px solid #FFE4B2",
							}),
						}),
					},
					{
						props: { variant: "standard", color: "info" },
						style: ({ theme }) => ({
							backgroundColor: "#E2EEF6",
							color: "#0C4068",
							"& .MuiAlert-icon": { color: "#0C4068", paddingTop: 8 },
							outline: "2px solid #0C4068",
							...theme.applyStyles("dark", {
								backgroundColor: "transparent",
								color: "#E2EEF6",
								"& .MuiAlert-icon": { color: "#E2EEF6" },
								outline: "1px solid #E2EEF6",
							}),
						}),
					},
				],
			},
		},
	},
};

// ---------------------------------------------------------------------------
// Theme registry.
//
// TOKEN SETS, NOT BUILT THEMES. This used to prebuild 6 brands x 3 modes at module scope
// and overlay the typeface onto the built object. That worked for a font family and does
// not generalise, because `createTheme(builtTheme, overrides)` DEEP-MERGES and does not
// re-derive - which the typeface overlay learned the hard way, and which two of the three
// display preferences would have hit again, differently and worse:
//
//   `typography.fontSize` - MUI derives its variants from it once, at build time. Merging
//   a new value over a built theme changes a field nothing reads. (Text size sidesteps
//   this entirely by scaling the ROOT font size instead; see display.ts.)
//
//   `spacing` - `theme.spacing` is a FUNCTION. Deep-merging `{ spacing: 6 }` over it
//   replaces the function with a number, after which every `sx={{ p: 2 }}` in the
//   application throws.
//
// So the registry holds descriptors and `getAppTheme` builds. Measured at ~0.26ms per
// theme, which is why this is affordable and why nothing is prebuilt: a session touches a
// handful of combinations, not all of them.
//
// `withFontFamily` is gone with the overlay. Building fresh means `createTypography`
// applies the family to every variant it owns, which is what that function existed to
// simulate.
// ---------------------------------------------------------------------------

type PrimaryTokens = typeof openRSLight;

type BrandDescriptor = {
	primary: PrimaryTokens;
	secondaryMain: string;
	backgroundDefault: string;
	mode: "light" | "dark";
	highContrast?: boolean;
};

/**
 * Reduced motion, as two global rules rather than a theme property.
 *
 * `system` is the default and needs no attribute: the media query alone answers it, before
 * any JavaScript has run. An explicit choice stamps `data-motion` on `<html>` (see
 * `useMotionPreference`), and `:not([data-motion="full"])` is what lets a user who has
 * asked for motion override an OS setting that is not theirs - a shared or borrowed
 * machine is exactly where that matters.
 *
 * `!important` IS CORRECT HERE, and this is the only place in the application where that
 * is true. MUI's transition components (Fade, Grow, Collapse, Drawer, Accordion) write
 * `transition-duration` as an INLINE style at runtime. No stylesheet rule beats an inline
 * declaration by specificity; `!important` is the only mechanism that does. A
 * reduced-motion rule without it does nothing to the components that actually animate.
 *
 * 0.01ms rather than 0: a zero duration skips the transitionend event, and code waiting on
 * it - MUI's own transition callbacks included - then never runs.
 */
const REDUCE_MOTION_DECLARATIONS = {
	animationDuration: "0.01ms !important",
	animationIterationCount: "1 !important",
	transitionDuration: "0.01ms !important",
	scrollBehavior: "auto !important",
} as const;

const NOT_FULL = 'html:not([data-motion="full"])';
const FORCED = 'html[data-motion="reduced"]';

const reduceMotionFor = (root: string) => ({
	[`${root}, ${root} *, ${root} *::before, ${root} *::after`]:
		REDUCE_MOTION_DECLARATIONS,
});

const motionStyles = {
	"@media (prefers-reduced-motion: reduce)": reduceMotionFor(NOT_FULL),
	...reduceMotionFor(FORCED),
};

const buildTheme = (
	{
		primary,
		secondaryMain,
		backgroundDefault,
		mode,
		highContrast = false,
	}: BrandDescriptor,
	fontName: FontName,
	display: ThemeDisplay,
): Theme => {
	const theme = createTheme({
		palette: {
			mode,
			contrastThreshold: highContrast ? 7 : 4.5,
			// `tabIndicator` falls back to the brand's own `main`, so a brand that has no
			// separate accent looks exactly as it did before the token existed. Only FOLIO
			// sets it, because only FOLIO has an accent it cannot use as ink.
			primary: { tabIndicator: primary.main, ...primary },
			secondary: { main: secondaryMain },
			background: { default: backgroundDefault, paper: backgroundDefault },
			...(highContrast
				? {
						divider: mode === "dark" ? "#FFFFFF" : "#000000",
						text:
							mode === "dark"
								? { primary: "#FFFFFF", secondary: "#FFFFFF" }
								: { primary: "#000000", secondary: "#000000" },
					}
				: {}),
		},
		spacing: spacingUnit(display.density),
		typography: { ...typography, fontFamily: fontStack(fontName) },
		components: {
			...components,
			MuiCssBaseline: {
				styleOverrides: {
					html: {
						// The text-size preference. Every size in `typography` is in `rem`
						// so that this one declaration moves the whole scale together.
						fontSize: rootFontSize(display.textSize),
						// WCAG 2.2 2.4.11 Focus Not Obscured. The AppBar is position:fixed
						// at 70px, and the browser scrolls a focused element to the top of
						// the scrollport knowing nothing about what is painted over it.
						// True whether the document or an inner box is the scroller, which
						// this layout has changed before.
						scrollPaddingTop: "70px",
					},
					...motionStyles,
				},
			},
		},
	});

	/*
	 * WINDOWS HIGH CONTRAST MODE, which is NOT the `highContrast` argument above.
	 *
	 * That argument picks one of OUR palettes - a scheme a user opts into from /settings.
	 * This is the operating system's `forced-colors: active`, where the OS throws away
	 * author colours wholesale and substitutes its own, and which many low-vision users run
	 * permanently. Nothing this file chooses about colour reaches them. What reaches them is
	 * whether a control still has a BOUNDARY once its background has been discarded - and
	 * without this, a contained MUI Button in forced colours is text on a canvas with no
	 * edge at all.
	 *
	 * The enhancer adds `@media (forced-colors: active)` rules to 21 components: borders on
	 * buttons and inputs, `forced-color-adjust` on the marks that must keep their own
	 * colour, system keywords for selected and disabled states. It COMPOSES rather than
	 * replaces - each slot becomes `[ourOverride, itsHcmRule]` so Emotion emits two rules and
	 * the cascade resolves them - which is why the four components we already style
	 * (ToggleButton, AccordionSummary, ListItemButton, Tooltip) keep everything said above.
	 *
	 * Applied to every brand and mode, because forced colours are orthogonal to which
	 * palette was chosen. The default tokens are kept: they must be CSS system colour
	 * keywords, and those are the only values a browser guarantees contrast between.
	 *
	 * It takes a BUILT theme and returns an enhanced one, so it wraps createTheme rather
	 * than living inside it.
	 */
	return enhanceHighContrast(theme);
};

const THEME_TOKENS = {
	openRS: {
		light: {
			primary: openRSLight,
			secondaryMain: "#1e7ebf",
			backgroundDefault: "#FFFFFF",
			mode: "light",
		},
		dark: {
			primary: openRSDark,
			secondaryMain: "#75BEDB",
			backgroundDefault: "#1E1E1E",
			mode: "dark",
		},
		highContrast: {
			primary: openRSHighContrast,
			secondaryMain: "#00407A",
			backgroundDefault: "#FFFFFF",
			mode: "light",
			highContrast: true,
		},
	},
	evergreen: {
		light: {
			primary: evergreenLight,
			secondaryMain: "#2E7D32",
			backgroundDefault: "#FFFFFF",
			mode: "light",
		},
		dark: {
			primary: evergreenDark,
			secondaryMain: "#81C784",
			backgroundDefault: "#1E1E1E",
			mode: "dark",
		},
		highContrast: {
			primary: evergreenHighContrast,
			secondaryMain: "#1B5E20",
			backgroundDefault: "#FFFFFF",
			mode: "light",
			highContrast: true,
		},
	},
	koha: {
		light: {
			primary: kohaLight,
			secondaryMain: "#88B744",
			backgroundDefault: "#FFFFFF",
			mode: "light",
		},
		dark: {
			primary: kohaDark,
			secondaryMain: "#A5D25C",
			backgroundDefault: "#1E1E1E",
			mode: "dark",
		},
		highContrast: {
			primary: kohaHighContrast,
			secondaryMain: "#1F330D",
			backgroundDefault: "#FFFFFF",
			mode: "light",
			highContrast: true,
		},
	},
	folio: {
		light: {
			primary: folioLight,
			secondaryMain: "#5AB5D4",
			backgroundDefault: "#FFFFFF",
			mode: "light",
		},
		dark: {
			primary: folioDark,
			secondaryMain: "#87CEEB",
			backgroundDefault: "#1E1E1E",
			mode: "dark",
		},
		highContrast: {
			primary: folioHighContrast,
			secondaryMain: "#021B2A",
			backgroundDefault: "#FFFFFF",
			mode: "light",
			highContrast: true,
		},
	},
	blueAndWhite: {
		light: {
			primary: nhsLight,
			secondaryMain: nhsDarkBlue,
			backgroundDefault: "#FFFFFF",
			mode: "light",
		},
		dark: {
			primary: nhsDark,
			secondaryMain: "#A8D5F0",
			backgroundDefault: "#1E1E1E",
			mode: "dark",
		},
		highContrast: {
			primary: nhsHighContrast,
			secondaryMain: nhsDarkBlue,
			backgroundDefault: "#FFFFFF",
			mode: "light",
			highContrast: true,
		},
	},
	mobius: {
		light: {
			primary: mobiusLight,
			secondaryMain: "#003D6A",
			backgroundDefault: "#FFFFFF",
			mode: "light",
		},
		dark: {
			primary: mobiusDark,
			secondaryMain: "#4DD0E1",
			// #585353 was a mid-grey, not a dark ground: it alone pushed the brand cyan
			// to 2.13:1 and the links to 4.11:1. #1E1E1E matches every other brand.
			backgroundDefault: "#1E1E1E",
			mode: "dark",
		},
		highContrast: {
			primary: mobiusHighContrast,
			// A slightly darker shade for the secondary active states.
			secondaryMain: "#002A4A",
			backgroundDefault: "#FFFFFF",
			mode: "light",
			highContrast: true,
		},
	},
} as const satisfies Record<string, Record<string, BrandDescriptor>>;

export type ThemeName = keyof typeof THEME_TOKENS;
export type ThemeMode = keyof (typeof THEME_TOKENS)["openRS"];

export const THEME_NAMES = Object.keys(THEME_TOKENS) as ThemeName[];
export const THEME_MODES: ThemeMode[] = ["light", "dark", "highContrast"];

/**
 * Built themes, kept so the object handed to ThemeProvider is stable across renders. An
 * unstable theme identity re-renders the entire tree on every unrelated state change.
 *
 * The key space is THEME_NAMES x THEME_MODES x FONT_NAMES x TEXT_SIZES x DENSITIES: five
 * fixed vocabularies, 720 combinations, and no user input can add a 721st. Motion is
 * deliberately absent from the key - it is CSS on the root element, not a theme property.
 *
 * In practice a session builds one theme and then one more per preference change, because
 * a user picks a combination and stays in it. 720 is the ceiling that makes a plain Map
 * defensible here, not an expectation.
 */
const themeCache = new Map<string, Theme>();

export const getAppTheme = (
	name: ThemeName,
	mode: ThemeMode,
	fontName: FontName = DEFAULT_FONT,
	display: ThemeDisplay = DEFAULT_DISPLAY,
): Theme => {
	// Every input is tolerated on read, like every other stored preference: a brand, mode,
	// typeface or step written by a later release must render the default rather than
	// white-screen an administrator or put `undefined` into a CSS declaration.
	const descriptor = THEME_TOKENS[name]?.[mode] ?? THEME_TOKENS.openRS.light;
	const font = isFontName(fontName) ? fontName : DEFAULT_FONT;
	const textSize = isDisplayValue(TEXT_SIZES, display?.textSize)
		? display.textSize
		: DEFAULT_DISPLAY.textSize;
	const density = isDisplayValue(DENSITIES, display?.density)
		? display.density
		: DEFAULT_DISPLAY.density;

	const key = `${name}:${mode}:${font}:${textSize}:${density}`;
	const cached = themeCache.get(key);
	if (cached) return cached;

	const built = buildTheme(descriptor, font, { textSize, density });
	themeCache.set(key, built);
	return built;
};

// Back-compat default export used as the initial theme.
export const openRSTheme = getAppTheme("openRS", "light");
