import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Button,
	darken,
	lighten,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Define custom styles using styled()
const StyledAccordion = styled(Accordion)(() => ({
	borderBottom: "0px",
	borderLeft: "0px",
	borderRight: "0px",
	"&::before": {
		display: "none",
	},
}));

StyledAccordion.defaultProps = {
	TransitionProps: { timeout: 400 }, // Setting default timeout
};

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
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
	// Ideally this would be a variant of the Accordion Summary
	// however it doesn't seem that the MUI AccordionSummary fully supports that at this time.
}));

const StyledAccordionDetails = styled(AccordionDetails)(() => ({
	marginTop: "16px",
}));

const StyledAccordionButton = styled(Button)(() => ({
	marginBottom: "2px",
}));

const SubAccordion = styled(StyledAccordion)(() => ({
	marginTop: "16px",
}));

const SubAccordionSummary = styled(AccordionSummary)(() => ({
	backgroundColor: "none",
}));

const SubAccordionDetails = styled(AccordionDetails)(() => ({
	marginTop: "0px",
}));

export {
	StyledAccordion,
	StyledAccordionSummary,
	StyledAccordionDetails,
	StyledAccordionButton,
	SubAccordion,
	SubAccordionSummary,
	SubAccordionDetails,
};
