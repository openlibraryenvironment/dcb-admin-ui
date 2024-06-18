import localFont from "next/font/local";
import { ThemeOptions } from "@mui/material/styles";

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
			fontSize: 20,
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
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					"&:focus": {
						outline: "2px solid", // For focus from any source
					},
					"&.Mui-focusVisible": {
						outline: "2px solid", // For focus from any source
					},
				},
			},
			variants: [
				{
					props: { size: "xlarge" },
					style: {
						padding: "14px 28px",
						fontSize: "1.1rem",
					},
				},
				{
					props: { variant: "contained" },
					style: {
						textTransform: "none",
					},
				},
				{
					props: { variant: "outlined" },
					style: {
						textTransform: "none",
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
				root: {
					"&:focus": {
						outline: "2px solid", // For focus from any source
					},
					"&.Mui-focusVisible": {
						outline: "2px solid", // For focus from any source
					},
				},
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					"&:focus": {
						border: "2px solid", // For focus from any source
						boxSizing: "border-box",
					},
					"&.Mui-focusVisible": {
						border: "2px solid", // For focus from any source
						boxSizing: "border-box",
					},
				},
			},
		},
		/*
		Re-add when fixing the focus outline issues in accordion
		MuiAccordionSummary: {
			styleOverrides: {
				root: {
					"&:focus": {
						outline: "2px solid", // For focus from any source
					},
					"&.Mui-focusVisible": {
						outline: "2px solid", // For focus from any source
					},
				},
			},
		},
		*/
	},
};

export default baseTheme;
