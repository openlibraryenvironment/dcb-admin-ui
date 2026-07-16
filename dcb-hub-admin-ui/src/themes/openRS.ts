import {
	createTheme,
	darken,
	lighten,
	type Theme,
	type ThemeOptions,
} from "@mui/material/styles";
import type {} from "@mui/x-data-grid-premium/themeAugmentation";
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
declare module "@mui/material/styles" {
	interface Palette {
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
	}

	interface PaletteColor {
		attributeTitle?: string;
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
		codeBlockBackground?: string;
		detailsAccordionSummary?: string;
		editableFieldBackground?: string;
		errorBackground?: string;
		exclamationIcon?: string;
		footerArea?: string;
		footerText?: string;
		linkedFooterBackground?: string;
		linkedFooterText?: string;
		header?: string;
		headerText?: string;
		headingColor?: string;
		hitCountText?: string;
		hover?: string;
		hoverOnSelectedPage?: string;
		iconSymbol?: string;
		inactiveBackground?: string;
		link?: string;
		linkText?: string;
		landingBackground?: string;
		landingCard?: string;
		loginCard?: string;
		loginText?: string;
		navigationText?: string;
		navigationTextActive?: string;
		searchResultBackground?: string;
		searchResultTitle?: string;
		selectedText?: string;
		sidebar?: string;
		titleArea?: string;
		pageBackground?: string;
		pageContentBackground?: string;
		loginButtonOutlineColor?: string;
		outlineColor?: string;
		tabsBackground?: string;
	}
	interface PaletteOptions {
		attributeTitle?: string;
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
		codeBlockBackground?: string;
		detailsAccordionSummary?: string;
		editableFieldBackground?: string;
		errorBackground?: string;
		exclamationIcon?: string;
		footerArea?: string;
		footerText?: string;
		linkedFooterBackground?: string;
		linkedFooterText?: string;
		header?: string;
		headerText?: string;
		headingColor?: string;
		hitCountText?: string;
		hover?: string;
		hoverOnSelectedPage?: string;
		iconSymbol?: string;
		inactiveBackground?: string;
		link?: string;
		linkText?: string;
		landingBackground?: string;
		landingCard?: string;
		loginCard?: string;
		loginText?: string;
		navigationText?: string;
		navigationTextActive?: string;
		searchResultBackground?: string;
		searchResultTitle?: string;
		selectedText?: string;
		sidebar?: string;
		titleArea?: string;
		pageBackground?: string;
		pageContentBackground?: string;
		loginButtonOutlineColor?: string;
		outlineColor?: string;
		tabsBackground?: string;
	}

	interface SimplePaletteColorOptions {
		attributeTitle?: string;
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
		codeBlockBackground?: string;
		detailsAccordionSummary?: string;
		editableFieldBackground?: string;
		errorBackground?: string;
		exclamationIcon?: string;
		footerArea?: string;
		footerText?: string;
		linkedFooterBackground?: string;
		linkedFooterText?: string;
		header?: string;
		headerText?: string;
		headingColor?: string;
		hitCountText?: string;
		hover?: string;
		hoverOnSelectedPage?: string;
		iconSymbol?: string;
		inactiveBackground?: string;
		link?: string;
		linkText?: string;
		landingBackground?: string;
		landingCard?: string;
		loginCard?: string;
		loginText?: string;
		navigationText?: string;
		navigationTextActive?: string;
		searchResultBackground?: string;
		searchResultTitle?: string;
		selectedText?: string;
		sidebar?: string;
		titleArea?: string;
		pageBackground?: string;
		pageContentBackground?: string;
		loginButtonOutlineColor?: string;
		outlineColor?: string;
		tabsBackground?: string;
	}

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

const lightPrimary = "#287BAF";
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
	buttonForSelectedPage: "#287BAF",
	codeBlockBackground: "#F5F5F5",
	detailsAccordionSummary: lightDetailsAccordion,
	editableFieldBackground: "#E2EEF6",
	errorBackground: "#FFDAE1",
	// #999999 gave these icons only 2.85:1 on the white page, under the 3:1
	// non-text minimum. Dark mode keeps #999999 (5.85:1 on its own page).
	exclamationIcon: "#767676",
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

// ---- It's Coming Home (England World Cup theme) ----
const itsComingHomeLight = {
	...openRSLight,
	main: "#CE1126", // St. George's Cross Red
	breadcrumbs: "#00247D", // Deep England Blue
	buttonForSelectedPage: "#CE1126",
	linkedFooterBackground: "#00247D",
	header: "#00247D",
	headingColor: "#00247D",
	link: "#00247D",
	linkText: "#CE1126",
	editableFieldBackground: "#F5F6F8",
	loginCard: "#F5F6F8",
	loginText: "#00247D",
	tabsBackground: "#F5F6F8",
	navigationText: "#00247D",
	navigationTextActive: "#CE1126",
	searchResultTitle: "#00247D",
};

const itsComingHomeDark = {
	...openRSDark,
	main: "#FF4D4D",
	breadcrumbs: "#4B8BFF",
	buttonForSelectedPage: "#CE1126",
	link: "#4B8BFF",
	linkText: "#FF4D4D",
	loginCard: "#2A2E35",
	tabsBackground: "#2A2E35",
	// #4B8BFF clears AA on the page itself but not on the grey surfaces it sits
	// on here: 4.18:1 on the tab bar and 3.08:1 on the #424242 result card.
	navigationText: "#81AEFF",
	searchResultTitle: "#81AEFF",
};

const itsComingHomeHighContrast = {
	...openRSHighContrast,
	main: "#9E0013",
	breadcrumbs: "#00164D",
	buttonForSelectedPage: "#9E0013",
	link: "#00164D",
	linkText: "#00164D",
	searchResultTitle: "#00164D",
};

// ---- Koha (ILS theme) ----
// Koha Community Green is #5C8A2E, but it is used both as text on the white page
// and as the ground under white text, and both roles are the same test: contrast
// against white. At #5C8A2E that is 4.09:1. Darkening 2% to #57822B clears AA in
// both directions and is visually near-indistinguishable from the brand green.
const kohaGreen = "#57822B";

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
// FOLIO coral (#FF674C) is a mid-tone: as a text ground it gives white only
// 2.88:1 and the brand's dark blue only 3.32:1 - no ink passes AA on it. It is
// darkened 20% here, the largest brand shift in this file, so that the header,
// footer, and tab bar can carry white text. This is a visible change to FOLIO's
// coral; a shared decision if FOLIO branding is contractual.
const folioCoral = "#E52300";

const folioLight = {
	...openRSLight,
	main: "#4A7BA2", // FOLIO Bright Blue, 1% darker for 4.52:1 on the white page
	breadcrumbs: "#4A7BA2",
	buttonForSelectedPage: "#0077C8",
	linkedFooterBackground: folioCoral,
	header: folioCoral,
	headingColor: "#094970",
	link: "#0077C8",
	linkText: "#0077C8",
	editableFieldBackground: "#EAF4FA",
	loginCard: "#EAF4FA",
	loginText: "#094970",
	// White labels on the coral bar: the previous dark-blue pair sat at 3.32:1,
	// and the active label at 1.63:1.
	tabsBackground: folioCoral,
	navigationText: "#FFFFFF",
	navigationTextActive: "#FFFFFF",
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
};

// ---- MOBIUS ----
// MOBIUS Light Blue (#0096A7) only reaches 3.55:1 against white, and it is used
// both as text on the page and as the ground under white text. Darkened 4.5% to
// #008190 (4.62:1) for both roles in light mode. On the tab bar's own tint it
// needs a touch more (#007886). Dark mode keeps the true brand cyan: it clears
// AA against a proper dark page.
const mobiusCyan = "#008190";

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

const typography: ThemeOptions["typography"] = {
	fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
	h1: { fontSize: 32, fontWeight: 400 },
	h2: { fontSize: 24, fontWeight: 400 },
	h3: { fontSize: 18 },
	h4: { fontSize: 18 },
	appTitle: { fontSize: 20 },
	loginCardText: { fontSize: 18 },
	cardActionText: { fontSize: "1rem" },
	subheading: { fontSize: "1.3rem" },
	componentSubheading: { fontSize: "1.3rem" },
	attributeTitle: { fontWeight: "bold" },
	attributeText: { wordBreak: "break-word", textWrap: "wrap" },
	loginHeader: { fontSize: 32, fontWeight: "bold" },
	modalTitle: { textAlign: "center", fontWeight: "bold" },
	homePageText: { fontSize: "1.1rem" },
	notFoundTitle: { fontSize: "3rem" },
	notFoundText: { fontSize: "1.5rem" },
	linkedFooterTextSize: { fontSize: "14px" },
	linkedFooterHeader: { fontSize: "18px", fontWeight: "bold" },
	loadingText: { fontSize: 32, fontWeight: 400, textAlign: "center" },
	accordionSummary: { fontSize: 20, fontWeight: 700 },
	subTabTitle: { fontSize: 12 },
	hitCount: { fontWeight: "bold" },
	searchResultTitle: { fontSize: "1.3rem" },
};

const components: ThemeOptions["components"] = {
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
				backgroundColor: theme.palette.primary.main,
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
// Theme registry. These could be separated into other files if needed, leave for now though
// ---------------------------------------------------------------------------

type PrimaryTokens = typeof openRSLight;

const buildTheme = (
	primary: PrimaryTokens,
	secondaryMain: string,
	backgroundDefault: string,
	mode: "light" | "dark",
	highContrast = false,
): Theme =>
	createTheme({
		palette: {
			mode,
			contrastThreshold: highContrast ? 7 : 4.5,
			primary,
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
		typography,
		components,
	});

const THEMES = {
	openRS: {
		light: buildTheme(openRSLight, "#1e7ebf", "#FFFFFF", "light"),
		dark: buildTheme(openRSDark, "#75BEDB", "#1E1E1E", "dark"),
		highContrast: buildTheme(
			openRSHighContrast,
			"#00407A",
			"#FFFFFF",
			"light",
			true,
		),
	},
	evergreen: {
		light: buildTheme(evergreenLight, "#2E7D32", "#FFFFFF", "light"),
		dark: buildTheme(evergreenDark, "#81C784", "#1E1E1E", "dark"),
		highContrast: buildTheme(
			evergreenHighContrast,
			"#1B5E20",
			"#FFFFFF",
			"light",
			true,
		),
	},
	itsComingHome: {
		light: buildTheme(itsComingHomeLight, "#00247D", "#FFFFFF", "light"),
		dark: buildTheme(itsComingHomeDark, "#4B8BFF", "#1E1E1E", "dark"),
		highContrast: buildTheme(
			itsComingHomeHighContrast,
			"#00164D",
			"#FFFFFF",
			"light",
			true,
		),
	},
	koha: {
		light: buildTheme(kohaLight, "#88B744", "#FFFFFF", "light"),
		dark: buildTheme(kohaDark, "#A5D25C", "#1E1E1E", "dark"),
		highContrast: buildTheme(
			kohaHighContrast,
			"#1F330D",
			"#FFFFFF",
			"light",
			true,
		),
	},
	folio: {
		light: buildTheme(folioLight, "#5AB5D4", "#FFFFFF", "light"),
		dark: buildTheme(folioDark, "#87CEEB", "#1E1E1E", "dark"),
		highContrast: buildTheme(
			folioHighContrast,
			"#021B2A",
			"#FFFFFF",
			"light",
			true,
		),
	},
	mobius: {
		light: buildTheme(mobiusLight, "#003D6A", "#FFFFFF", "light"),
		// #585353 was a mid-grey, not a dark ground: it alone pushed the brand cyan
		// to 2.13:1 and the links to 4.11:1. #1E1E1E matches every other brand.
		dark: buildTheme(mobiusDark, "#4DD0E1", "#1E1E1E", "dark"),
		highContrast: buildTheme(
			mobiusHighContrast,
			"#002A4A", // A slightly darker shade for the secondary active states
			"#FFFFFF",
			"light",
			true,
		),
	},
};

export type ThemeName = keyof typeof THEMES;
export type ThemeMode = keyof (typeof THEMES)["openRS"];

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];
export const THEME_MODES: ThemeMode[] = ["light", "dark", "highContrast"];

export const getAppTheme = (name: ThemeName, mode: ThemeMode): Theme =>
	THEMES[name]?.[mode] ?? THEMES.openRS.light;

// Back-compat default export used as the initial theme.
export const openRSTheme = THEMES.openRS.light;
