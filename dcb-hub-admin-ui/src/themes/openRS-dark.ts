// The 'dark' variant of the openRS theme.
import { createTheme } from "@mui/material";
import localFont from "next/font/local";

const roboto = localFont({
	src: [
		{
			path: "./fonts/Roboto-LightItalic.ttf",
			weight: "300",
			style: "italic",
		},
		{
			path: "./fonts/Roboto-Light.ttf",
			weight: "300",
			style: "normal",
		},
		{
			path: "./fonts/Roboto-Regular.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "./fonts/Roboto-Italic.ttf",
			weight: "400",
			style: "italic",
		},
		{
			path: "./fonts/Roboto-Medium.ttf",
			weight: "500",
			style: "normal",
		},
		{
			path: "./fonts/Roboto-MediumItalic.ttf",
			weight: "500",
			style: "italic",
		},
		{
			path: "./fonts/Roboto-Bold.ttf",
			weight: "700",
			style: "normal",
		},
		{
			path: "./fonts/Roboto-BoldItalic.ttf",
			weight: "700",
			style: "italic",
		},
	],
});

const openRSDark = createTheme({
	palette: {
		contrastThreshold: 4.5,
		mode: "dark",
		primary: {
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
			main: "#35B7FF",
			selectedText: "#FFFFFF",
			sidebar: "#292929",
			titleArea: "#1E1E1E",
		},
		background: {
			default: "#1E1E1E",
		},
	},
	typography: {
		fontFamily: roboto.style.fontFamily,
		appTitle: {
			fontSize: 20,
			color: "#FFFFFF",
		},
		h1: {
			fontSize: 32,
			fontWeight: 400,
			color: "#FFFFFF",
		},
		h2: {
			fontSize: 20,
			fontWeight: 400,
			color: "#FFFFFF",
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
			color: "#FFFFFF",
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
			color: "inherit",
			textAlign: "center",
		},
	},
	components: {
		MuiButton: {
			variants: [
				{
					props: { size: "xlarge" },
					style: {
						padding: "14px 28px",
						fontSize: "1.1rem",
					},
				},
			],
		},
	},
});
export default openRSDark;
