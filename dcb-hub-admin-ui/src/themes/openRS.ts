import { createTheme, darken, lighten } from "@mui/material/styles";
import type {} from "@mui/x-data-grid-premium/themeAugmentation";
declare module "@mui/material/Button" {
	interface ButtonPropsSizeOverrides {
		xlarge: true;
	}
}
declare module "@mui/material/styles" {
	interface Palette {
		attributeTitle: string;
		breadcrumbs: string;
		buttonForSelectedChildPage: string;
		buttonForSelectedPage: string;
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
	}

	interface PaletteColor {
		attributeTitle?: string;
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
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
	}
	interface PaletteOptions {
		attributeTitle?: string;
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
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
	}

	interface SimplePaletteColorOptions {
		attributeTitle?: string;
		breadcrumbs?: string;
		buttonForSelectedChildPage?: string;
		buttonForSelectedPage?: string;
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
const lightBg = "#FFFFFF";
const darkBg = "#1E1E1E";
const lightDetailsAccordion = "#F6F6F6";
const darkDetailsAccordion = "#424242";

export const openRSTheme = createTheme({
	cssVariables: true,

	colorSchemes: {
		light: {
			palette: {
				contrastThreshold: 4.5,
				mode: "light",
				primary: {
					main: lightPrimary,
					attributeTitle: "#000000",
					breadcrumbs: "#246F9E",
					buttonForSelectedChildPage: "#707070",
					buttonForSelectedPage: "#287BAF",
					detailsAccordionSummary: lightDetailsAccordion,
					editableFieldBackground: "#E2EEF6",
					errorBackground: "#FFDAE1",
					exclamationIcon: "#999999",
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
					inactiveBackground: "#8C8C8C",
					link: "#0C4068",
					linkText: "#246F9E",
					landingBackground: "#F9F9F9",
					landingCard: "#FFFFFF",
					loginCard: "#E2EEF6",
					loginText: "#0C4068",
					navigationText: "#E2EEF6",
					navigationTextActive: "#FFFFFF",
					searchResultBackground: "#F6F9FC",
					searchResultTitle: "#186498",
					selectedText: "#FFFFFF",
					sidebar: "#F6F6F6",
					titleArea: "#FFFFFF",
					pageBackground: "#F9F9F9",
					pageContentBackground: "#FFFFFF",
					loginButtonOutlineColor: "#FFFFFF",
					outlineColor: "#000000",
				},
				secondary: { main: "#1e7ebf" },
				background: { default: lightBg },
			},
		},
		dark: {
			palette: {
				contrastThreshold: 4.5,
				mode: "dark",
				primary: { main: darkPrimary },
				secondary: {
					main: "#75BEDB",
					attributeTitle: "#FFFFFF",
					breadcrumbs: "#35B7FF",
					buttonForSelectedChildPage: "#999999",
					buttonForSelectedPage: "#287BAF",
					detailsAccordionSummary: darkDetailsAccordion,
					editableFieldBackground: "#E2EEF6",
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
					inactiveBackground: "#8C8C8C",
					link: "#B3E5FC",
					linkText: "#35B7FF",
					landingBackground: "#000000",
					landingCard: "#202020",
					loginCard: "#292929",
					loginText: "#FFFFFF",
					navigationText: "#A0AEC0",
					navigationTextActive: "#FFFFFF",
					searchResultBackground: "#424242",
					searchResultTitle: "#63B3ED",
					selectedText: "#FFFFFF",
					sidebar: "#292929",
					titleArea: "#1E1E1E",
					pageBackground: "transparent",
					pageContentBackground: "transparent",
					loginButtonOutlineColor: "#FFFFFF",
					outlineColor: "#FFFFFF",
				},
				background: { default: darkBg },
			},
		},
	},

	typography: {
		fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
		h1: {
			fontSize: 32,
			fontWeight: 400,
			color: "var(--mui-palette-headingColor)",
		},
		h2: {
			fontSize: 24,
			fontWeight: 400,
			color: "var(--mui-palette-headingColor)",
		},
		h3: { fontSize: 18, color: "var(--mui-palette-headingColor)" },
		h4: { fontSize: 18, color: "var(--mui-palette-headingColor)" },

		appTitle: { fontSize: 20, color: "var(--mui-palette-headerText)" },
		loginCardText: { fontSize: 18 },
		cardActionText: { fontSize: "1rem" },
		subheading: { fontSize: "1.3rem" },
		componentSubheading: {
			fontSize: "1.3rem",
			color: "var(--mui-palette-headingColor)",
		},
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
		accordionSummary: {
			fontSize: 20,
			fontWeight: 700,
			color: "var(--mui-palette-headingColor)",
		},
		subTabTitle: { fontSize: 12 },
		hitCount: { fontWeight: "bold", color: "var(--mui-palette-hitCountText)" },
		searchResultTitle: { fontSize: "1.3rem" },
	},

	// ==========================================
	// 4. COMPONENTS
	// ==========================================
	components: {
		MuiAccordion: {
			defaultProps: {
				slotProps: { transition: { timeout: 400 } },
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
					backgroundColor: theme.palette.secondary.main,
					"& .MuiTab-root": {
						color: "var(--mui-palette-headerText)",
						"&.Mui-selected": { fontWeight: "bold" },
					},
					"&.secondary": {
						backgroundColor: "#e2eef6",
						"& .MuiTab-root": {
							color: "var(--mui-palette-primary-main)",
						},
					},
				}),
			},
		},
		MuiTab: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: "var(--mui-palette-navigationText)",
					"&.Mui-selected": {
						fontWeight: "bold",
						color: "var(--mui-palette-navigationTextActive)",
					},
					"&.Mui-focusVisible": {
						outline: "2px solid",
						boxSizing: "border-box",
						borderColor: "var(--mui-palette-outlineColor)",
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
						outlineColor: "#000000",
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
						"&.Mui-focusVisible": { outlineColor: "#FFFFFF" },
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
						":hover": { backgroundColor: darken(lightPrimary, 0.08) },
						":active": {
							outline: "1px solid #75BEDB",
							backgroundColor: darken(lightPrimary, 0.16),
						},
						...theme.applyStyles("dark", {
							":hover": { backgroundColor: lighten(darkPrimary, 0.08) },
							":active": {
								outline: "1px solid #75BEDB",
								backgroundColor: lighten(darkPrimary, 0.16),
							},
						}),
					}),
				},
				{
					props: { variant: "outlined" },
					style: ({ theme }) => ({
						textTransform: "none",
						fontSize: "0.95rem",
						":hover": { backgroundColor: darken(lightBg, 0.08) },
						":active": {
							border: "1px solid #75BEDB",
							outline: "1px solid #75BEDB",
							backgroundColor: darken(lightBg, 0.16),
						},
						...theme.applyStyles("dark", {
							":hover": { backgroundColor: lighten(darkBg, 0.08) },
							":active": {
								border: "1px solid #75BEDB",
								outline: "1px solid #75BEDB",
								backgroundColor: lighten(darkBg, 0.16),
							},
						}),
					}),
				},
				{
					props: { variant: "text" },
					style: ({ theme }) => ({
						":hover": { backgroundColor: darken(lightBg, 0.08) },
						":active": { backgroundColor: darken(lightBg, 0.16) },
						...theme.applyStyles("dark", {
							":hover": { backgroundColor: lighten(darkBg, 0.08) },
							":active": { backgroundColor: lighten(darkBg, 0.16) },
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
					":hover": { backgroundColor: darken(lightBg, 0.08) },
					":active": { backgroundColor: darken(lightBg, 0.16) },
					...theme.applyStyles("dark", {
						":hover": { backgroundColor: lighten(darkBg, 0.08) },
						":active": { backgroundColor: lighten(darkBg, 0.16) },
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
						borderColor: "#000000",
						boxSizing: "border-box",
					},
					...theme.applyStyles("dark", {
						"&.Mui-focusVisible": { borderColor: "#FFFFFF" },
					}),
				}),
			},
		},
		MuiDataGrid: {
			styleOverrides: {
				cell: {
					"&:focus": { outline: "none" },
					":focus-visible": { outline: "2px solid" },
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
				tooltip: { backgroundColor: "#808080" },
				arrow: { color: "#808080" },
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
				standardSuccess: ({ theme }) => ({
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
				standardError: ({ theme }) => ({
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
				standardWarning: ({ theme }) => ({
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
				standardInfo: ({ theme }) => ({
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
		},
	},
});

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
