import StepConnector, {
	stepConnectorClasses,
	StepConnectorProps,
} from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";

import { stepConnectorColours } from "@helpers/stepConnectorColours";

interface StatusStepConnectorProps extends StepConnectorProps {
	activeStep: number;
	stepError: number | null;
}

export const StatusStepConnector = styled(
	StepConnector,
)<StatusStepConnectorProps>(({ theme, activeStep, stepError }) => {
	const colours = stepConnectorColours(theme);
	return {
		[`&.${stepConnectorClasses.active}, &.${stepConnectorClasses.completed}`]: {
			[`& .${stepConnectorClasses.line}`]: { borderColor: colours.reached },
		},
		[`& .${stepConnectorClasses.line}`]: {
			borderColor:
				activeStep === stepError ? colours.failed : colours.notReached,
			borderTopWidth: 3,
			borderRadius: 1,
		},
	};
});
