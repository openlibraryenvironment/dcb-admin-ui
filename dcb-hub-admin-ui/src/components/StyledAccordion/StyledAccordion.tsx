import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Button,
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

const StyledDataGridAccordion = styled(Accordion)(({ theme }) => ({
	boxShadow: "none",
	backgroundColor: "transparent",
	"&:before": {
		display: "none",
	},
	"&:first-of-type": {
		borderTop: `2px solid ${theme.palette.divider}`,
	},
}));

const StyledDataGridAccordionSummary = styled(AccordionSummary)(
	({ theme }) => ({
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
);

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
	backgroundColor: "transparent",
	"&.Mui-focusVisible": {
		outline: "2px solid", // For keyboard focus
	},
}));

const SubAccordionDetails = styled(AccordionDetails)(() => ({
	marginTop: "0px",
}));

export {
	StyledAccordion,
	StyledAccordionDetails,
	StyledAccordionButton,
	SubAccordion,
	SubAccordionSummary,
	SubAccordionDetails,
	StyledDataGridAccordion,
	StyledDataGridAccordionSummary,
};
