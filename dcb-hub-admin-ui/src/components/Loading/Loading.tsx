import { Stack, CircularProgress, Typography, Box, Fade } from "@mui/material";

interface LoadingProps {
	title: string;
	subtitle: string;
}
export default function Loading({ title, subtitle }: LoadingProps) {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				flex: "1",
				minHeight: "0",
			}}
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
					spacing={2}
					sx={{
						alignItems: "center",
						alignSelf: "center",
					}}
				>
					<CircularProgress size={125} />
					<Typography variant="loadingText">{title}</Typography>
					<Typography variant="componentSubheading">{subtitle}</Typography>
				</Stack>
			</Fade>
		</Box>
	);
}
