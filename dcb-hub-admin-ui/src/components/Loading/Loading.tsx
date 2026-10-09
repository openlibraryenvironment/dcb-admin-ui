import { Stack, CircularProgress, Typography, Box, Fade } from "@mui/material";

interface LoadingProps {
	title: string;
	subtitle: string;
}
export default function Loading({ title, subtitle }: LoadingProps) {
	return (
		<Box
			// A route swapping its content for a spinner is a status change, and nothing
			// announced it: 45 call sites rendered a 125px CircularProgress and two lines
			// of text that a screen reader never spoke. WCAG 4.1.3. No axe rule covers a
			// missing live region, so Loading.test.tsx holds it.
			role="status"
			aria-live="polite"
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
					{/* The two lines below are the message; the spinner would only add
					    "progressbar" in front of them. */}
					<CircularProgress size={125} aria-hidden="true" />
					<Typography variant="loadingText">{title}</Typography>
					<Typography variant="componentSubheading">{subtitle}</Typography>
				</Stack>
			</Fade>
		</Box>
	);
}
