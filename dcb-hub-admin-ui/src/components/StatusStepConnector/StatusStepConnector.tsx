import StepConnector, {
	stepConnectorClasses,
	StepConnectorProps,
} from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
interface StatusStepConnectorProps extends StepConnectorProps {
	activeStep: number; // Assume activeStep is always provided
	stepError: number | null;
}
// A step connector component that reflects the status of the steps in its colours.
// Just needs a way of handling errors.
export const StatusStepConnector = styled(
	StepConnector,
)<StatusStepConnectorProps>(({ theme, activeStep, stepError }) => ({
	[`&.${stepConnectorClasses.active}`]: {
		[`& .${stepConnectorClasses.line}`]: {
			borderColor: theme.palette.success.main,
		},
	},
	[`&.${stepConnectorClasses.completed}`]: {
		[`& .${stepConnectorClasses.line}`]: {
			borderColor: theme.palette.success.main,
		},
	},
	[`& .${stepConnectorClasses.line}`]: {
		borderColor: "#eaeaf0",
		borderTopWidth: 3,
		borderRadius: 1,
		...theme.applyStyles("dark", {
			borderColor:
				activeStep == stepError
					? theme.palette.error.main
					: theme.palette.grey[800],
		}),
	},
}));
