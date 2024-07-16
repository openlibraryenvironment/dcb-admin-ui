import localFont from "next/font/local";
import { ThemeOptions, darken, lighten } from "@mui/material/styles";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";

// We have switched to using Next local fonts due to Next.js having issues fetching Google Fonts that were causing strange behaviour in dev mode
// See here https://github.com/vercel/next.js/issues/45080
// Define the local font configuration
const roboto = localFont({
	src: [
		{ path: "./fonts/Roboto-LightItalic.ttf", weight: "300", style: "italic" },
		{ path: "./fonts/Roboto-Light.ttf", weight: "300", style: "normal" },
		{ path: "./fonts/Roboto-Regular.ttf", weight: "400", style: "normal" },
		{ path: "./fonts/Roboto-Italic.ttf", weight: "400", style: "italic" },
		{ path: "./fonts/Roboto-Medium.ttf", weight: "500", style: "normal" },
		{ path: "./fonts/Roboto-MediumItalic.ttf", weight: "500", style: "italic" },
		{ path: "./fonts/Roboto-Bold.ttf", weight: "700", style: "normal" },
		{ path: "./fonts/Roboto-BoldItalic.ttf", weight: "700", style: "italic" },
	],
});

// Shared component styles
const baseTheme: ThemeOptions = {
	typography: {
		fontFamily: roboto.style.fontFamily,
		appTitle: {
			fontSize: 20,
		},
		h1: {
			fontSize: 32,
			fontWeight: 400,
		},
		h2: {
			fontSize: 24,
			fontWeight: 400,
		},
		h3: {
			fontSize: 18,
		},
		h4: {
			fontSize: 18,
		},
		loginCardText: {
			fontSize: 18,
		},
		cardActionText: {
			fontSize: "1rem",
		},
		subheading: {
			fontSize: "1.3rem",
		},
		componentSubheading: {
			fontSize: "1.3rem",
		},
		attributeTitle: {
			fontWeight: "bold",
		},
		attributeText: {
			wordBreak: "break-word",
			textWrap: "wrap",
		},
		loginHeader: {
			fontSize: 32,
			fontWeight: "bold",
		},
		modalTitle: {
			textAlign: "center",
			fontWeight: "bold",
		},
		homePageText: {
			fontSize: "1.1rem",
		},
		notFoundTitle: {
			fontSize: "3rem",
		},
		notFoundText: {
			fontSize: "1.5rem",
		},
		linkedFooterTextSize: {
			fontSize: "14px",
		},
		linkedFooterHeader: {
			fontSize: "18px",
			fontWeight: "bold",
		},
		loadingText: {
			fontSize: 32,
			fontWeight: 400,
			textAlign: "center",
		},
		accordionSummary: {
			fontSize: 20,
			fontWeight: 700,
		},
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					"&.Mui-focusVisible": {
						outline: "2px solid", // For keyboard focus
					},
				},
			},
			// important: the order in which the variants are specified, affect which styles are applied
			// e.g. the fontSize of xlarge will override the fontSize in contained, because it is specified after
			variants: [
				{
					props: { variant: "contained" },
					style: ({ theme }) => ({
						textTransform: "none",
						fontSize: "0.95rem",
						":hover": {
							backgroundColor:
								theme.palette.mode == "light"
									? darken(theme.palette.primary.main, 0.08)
									: lighten(theme.palette.primary.main, 0.08),
						},
						":active": {
							outline: "1px solid #75BEDB", // Adds a 1px solid outline
							backgroundColor:
								theme.palette.mode == "light"
									? darken(theme.palette.primary.main, 0.16)
									: lighten(theme.palette.primary.main, 0.16),
						},
					}),
				},
				{
					props: { variant: "outlined" },
					style: ({ theme }) => ({
						textTransform: "none",
						fontSize: "0.95rem",
						":hover": {
							backgroundColor:
								theme.palette.mode == "light"
									? darken(theme.palette.background.default, 0.08)
									: lighten(theme.palette.background.default, 0.08),
						},
						":active": {
							border: "1px solid #75BEDB", // Adds a 1px solid border
							outline: "1px solid #75BEDB", // Adds a 1px solid outline
							backgroundColor:
								theme.palette.mode == "light"
									? darken(theme.palette.background.default, 0.16)
									: lighten(theme.palette.background.default, 0.16),
						},
					}),
				},
				{
					props: { variant: "text" },
					style: ({ theme }) => ({
						":hover": {
							backgroundColor:
								theme.palette.mode == "light"
									? darken(theme.palette.background.default, 0.08)
									: lighten(theme.palette.background.default, 0.08),
						},
						":active": {
							backgroundColor:
								theme.palette.mode == "light"
									? darken(theme.palette.background.default, 0.16)
									: lighten(theme.palette.background.default, 0.16),
						},
					}),
				},
				{
					props: { size: "xlarge" },
					style: {
						padding: "14px 28px",
						fontSize: "1.3rem",
					},
				},
			],
		},
		MuiButtonBase: {
			defaultProps: {
				disableRipple: true, // Disable ripple effect for all buttons
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: ({ theme }) => ({
					"&.Mui-focusVisible": {
						outline: "2px solid", // For keyboard focus
					},
					":hover": {
						backgroundColor:
							theme.palette.mode == "light"
								? darken(theme.palette.background.default, 0.08)
								: lighten(theme.palette.background.default, 0.08),
					},
					":active": {
						backgroundColor:
							theme.palette.mode == "light"
								? darken(theme.palette.background.default, 0.16)
								: lighten(theme.palette.background.default, 0.16),
					},
				}),
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					"&.Mui-focusVisible": {
						border: "2px solid", // For keyboard focus
						boxSizing: "border-box",
					},
				},
			},
		},
		MuiDataGrid: {
			styleOverrides: {
				// focus styles
				cell: {
					"&:focus": {
						outline: "none",
					},
					":focus-visible": {
						outline: "2px solid",
					},
				},
				cellCheckbox: {
					"&:focus-within": {
						outline: "2px solid",
						outlineOffset: "-3px",
					},
				},
				columnHeaderCheckbox: {
					"&:focus-within": {
						outline: "2px solid",
						outlineOffset: "-3px",
					},
				},
				columnHeader: {
					"&:focus": {
						outline: "none",
					},
					":focus-visible": {
						outline: "2px solid",
					},
				},
			},
		},
		MuiTooltip: {
			defaultProps: {
				arrow: true,
			},
		},
		MuiAccordionSummary: {
			styleOverrides: {
				root: ({ theme }) => ({
					"&.Mui-focusVisible": {
						border: "2px solid", // For keyboard focus
						borderColor: theme.palette.primary.outlineColor,
						boxSizing: "border-box",
					},
					backgroundColor: theme.palette.primary.detailsAccordionSummary,
					":hover": {
						backgroundColor:
							theme.palette.mode == "light"
								? darken(theme.palette.primary.detailsAccordionSummary, 0.08)
								: lighten(theme.palette.primary.detailsAccordionSummary, 0.08),
					},
					":active": {
						backgroundColor:
							theme.palette.mode == "light"
								? darken(theme.palette.primary.detailsAccordionSummary, 0.16)
								: lighten(theme.palette.primary.detailsAccordionSummary, 0.16),
					},
				}),
			},
		},
	},
};

export default baseTheme;
