import { Stack, CircularProgress, Typography, Box } from "@mui/material";

interface LoadingProps {
	title: string;
	subtitle: string;
}
export default function Loading({ title, subtitle }: LoadingProps) {
	return (
		<Box
			display="flex"
			alignItems="center"
			justifyContent="center"
			width="100%" // Takes the full width of the content area
			flex="1" // Takes up the available space in the flex container
			minHeight="0" // Override minHeight to allow the Box to shrink if necessary
		>
			<Stack direction="column" alignItems="center" spacing={2} mb={30}>
				<CircularProgress size={125} />
				<Typography variant="h1">{title}</Typography>
				<Typography variant="componentSubheading">{subtitle}</Typography>
			</Stack>
		</Box>
	);
}
