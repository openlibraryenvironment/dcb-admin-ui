import { Cancel, CheckCircle } from "@mui/icons-material";
import { Avatar, StepIconProps, useTheme } from "@mui/material";

// A component for our implementation of the Material UI Stepper Icons
// This handles icons for active, completed, error and regular steps.
export default function DCBStepIcon(props: StepIconProps) {
	const { active, completed, error, icon } = props;
	const theme = useTheme();
	const iconSize = 28;

	if (error) {
		("bol");
		return (
			<Avatar
				sx={{
					bgcolor: "transparent",
					width: iconSize,
					height: iconSize,
				}}
			>
				<Cancel
					sx={{
						fontSize: `${iconSize * 1.1}px`, // Adjust size if needed
					}}
					htmlColor={theme.palette.error.main}
				/>
			</Avatar>
		);
	}

	if (completed) {
		return (
			<Avatar
				sx={{
					bgcolor: "transparent",
					width: iconSize,
					height: iconSize,
				}}
			>
				<CheckCircle
					htmlColor={theme.palette.success.main}
					sx={{
						fontSize: `${iconSize * 1.1}px`,
					}}
				/>
			</Avatar>
		);
	}

	// Active step
	// Shows the number on green background
	if (active) {
		return (
			<Avatar
				sx={{
					bgcolor: theme.palette.success.main,
					color: theme.palette.primary.iconSymbol,
					width: iconSize,
					height: iconSize,
					fontWeight: "bold",
				}}
			>
				{String(icon)} {/* Display the step number */}
			</Avatar>
		);
	}

	// Inactive steps
	// Shows the number ('icon') inside an outlined grey circle background
	return (
		<Avatar
			sx={{
				bgcolor: theme.palette.primary.inactiveBackground,
				color: theme.palette.primary.iconSymbol,
				width: iconSize,
				height: iconSize,
			}}
		>
			{String(icon)}
		</Avatar>
	);
}
