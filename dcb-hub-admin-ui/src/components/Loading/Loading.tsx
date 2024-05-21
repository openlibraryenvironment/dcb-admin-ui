import { Stack, CircularProgress, Typography, Box, Fade } from "@mui/material";

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
			height="100%"
			flex="1" // Takes up the available space in the flex container
			minHeight="0" // Override minHeight to allow the Box to shrink if necessary
		>
			<Fade
				in={true}
				style={{
					transitionDelay: "1s",
				}}
				unmountOnExit
			>
				<Stack
					direction="column"
					alignItems="center"
					alignSelf={"center"}
					spacing={2}
				>
					<CircularProgress size={125} />
					<Typography variant="loadingText">{title}</Typography>
					<Typography variant="componentSubheading">{subtitle}</Typography>
				</Stack>
			</Fade>
		</Box>
	);
}
