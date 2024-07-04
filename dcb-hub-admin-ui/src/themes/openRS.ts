import { createTheme } from "@mui/material/styles";
import baseTheme from "./baseTheme";
import { mergeThemeStyles } from "src/helpers/mergeThemeStyles";

// only supply colours in this file. For changes to font, or components, use baseTheme.ts.

const openRSLight = createTheme({
	...baseTheme,
	palette: {
		contrastThreshold: 4.5,
		mode: "light",
		primary: {
			main: "#287BAF",
			breadcrumbs: "#246F9E",
			buttonForSelectedChildPage: "#707070",
			buttonForSelectedPage: "#287BAF",
			detailsAccordionSummary: "#F6F6F6",
			exclamationIcon: "#999999",
			footerArea: "#FFFFFF",
			footerText: "#000000",
			linkedFooterBackground: "#0C4068",
			linkedFooterText: "#FFFFFF",
			header: "#0C4068",
			headerText: "#FFFFFF",
			hover: "#EEEEEE",
			hoverOnSelectedPage: "#A9A9A9",
			link: "#0C4068",
			linkText: "#246F9E",
			landingBackground: "#F9F9F9",
			landingCard: "#FFFFFF",
			loginCard: "#E2EEF6",
			loginText: "#0C4068",
			selectedText: "#FFFFFF",
			sidebar: "#F6F6F6",
			titleArea: "#FFFFFF",
			pageBackground: "#F9F9F9",
			pageContentBackground: "#FFFFFF",
			loginButtonOutlineColor: "#FFFFFF",
		},
		// Currently not defining secondary palette. When we do we need to define all colours.
		// Otherwise you can run into type issues.
		// secondary: {
		// 	main: "#0C4068",
		// 	detailsAccordionSummary: "#F6F6F6",
		// },
		background: {
			default: "#FFFFFF",
		},
	},
	// Supply only the font colours for the light mode here.
	typography: mergeThemeStyles(baseTheme.typography, {
		appTitle: {
			color: "#0C4068",
		},
		h1: {
			color: "#0C4068",
		},
		h2: {
			color: "#0C4068",
		},
		h3: {
			color: "#0C4068",
		},
		h4: {
			color: "#0C4068",
		},
		componentSubheading: {
			color: "#0C4068",
		},
		accordionSummary: {
			color: "#0C4068",
		},
	}),
	components: mergeThemeStyles(baseTheme.components, {
		MuiButton: {
			styleOverrides: {
				root: {
					"&.Mui-focusVisible": {
						outlineColor: "#000000",
					},
				},
			},

			// Probably best to do overrides if it needs to be different on a per theme basis: doing the below will cause all other styles to be disapplied
			// REDUNDANT
			// // important: the order in which the variants are specified, affect which styles are applied
			// // e.g. the fontSize of xlarge will override the fontSize in contained, because it is specified after
			// variants: [
			// 	{
			// 		props: { variant: "contained" },
			// 		style: {
			// 			":active": {
			// 				outline: "#75BEDB",
			// 			},
			// 		},
			// 	},
			// 	{
			// 		props: { variant: "outlined" },
			// 		style: {
			// 			":active": {
			// 				outline: "#75BEDB",
			// 			},
			// 		},
			// 	},
			// ],
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					"&.Mui-focusVisible": {
						borderColor: "#000000",
					},
				},
			},
		},
		MuiAccordionSummary: {
			styleOverrides: {
				root: {
					"&:focus": {
						borderColor: "#000000",
					},
					"&.Mui-focusVisible": {
						borderColor: "#000000",
					},
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: "#808080",
				},
				arrow: {
					color: "#808080", // Arrow color to match the tooltip background
				},
			},
		},
	}),
});

const openRSDark = createTheme({
	...baseTheme,
	palette: {
		contrastThreshold: 4.5,
		mode: "dark",
		primary: {
			main: "#35B7FF",
			breadcrumbs: "#35B7FF",
			buttonForSelectedChildPage: "#999999",
			buttonForSelectedPage: "#287BAF",
			detailsAccordionSummary: "#424242",
			exclamationIcon: "#999999",
			footerArea: "#202020",
			footerText: "#FFFFFF",
			linkedFooterBackground: "#000000",
			linkedFooterText: "#FFFFFF",
			header: "#000000",
			headerText: "#FFFFFF",
			hover: "#424242",
			hoverOnSelectedPage: "#424242",
			link: "#B3E5FC",
			linkText: "#35B7FF",
			landingBackground: "#000000",
			landingCard: "#202020",
			loginCard: "#292929",
			loginText: "#FFFFFF",
			selectedText: "#FFFFFF",
			sidebar: "#292929",
			titleArea: "#1E1E1E",
			loginButtonOutlineColor: "#FFFFFF",
		},
		// secondary: {
		// 	main: "#75BEDB",
		// 	detailsAccordionSummary: "#424242",
		// },
		background: {
			default: "#1E1E1E",
		},
	},
	// Supply only the font colours for the dark mode here.
	typography: mergeThemeStyles(baseTheme.typography, {
		appTitle: {
			color: "#FFFFFF",
		},
		h1: {
			color: "#FFFFFF",
		},
		h2: {
			color: "#FFFFFF",
		},
		componentSubheading: {
			color: "#FFFFFF",
		},
	}),
	components: mergeThemeStyles(baseTheme.components, {
		MuiButton: {
			styleOverrides: {
				root: {
					"&.Mui-focusVisible": {
						outlineColor: "#FFFFFF",
					},
				},
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					"&.Mui-focusVisible": {
						borderColor: "#FFFFFF",
					},
				},
			},
		},
		MuiAccordionSummary: {
			styleOverrides: {
				root: {
					"&:focus": {
						borderColor: "#FFFFFF",
					},
					"&.Mui-focusVisible": {
						borderColor: "#FFFFFF",
					},
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: "#808080",
				},
				arrow: {
					color: "#808080", // Arrow color to match the tooltip background
				},
			},
		},
	}),
});

export { openRSLight, openRSDark };
