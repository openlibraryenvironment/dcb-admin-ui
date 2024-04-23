import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
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

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
	backgroundColor: theme.palette.primary.detailsAccordionSummary,
}));

const StyledAccordionDetails = styled(AccordionDetails)(() => ({
	marginTop: "16px",
}));

const SubAccordionSummary = styled(AccordionSummary)(() => ({
	backgroundColor: "none",
}));

const SubAccordionDetails = styled(AccordionDetails)(() => ({
	marginTop: "0px"
}));

export {
	StyledAccordion,
	StyledAccordionSummary,
	StyledAccordionDetails,
	SubAccordionSummary,
	SubAccordionDetails
};