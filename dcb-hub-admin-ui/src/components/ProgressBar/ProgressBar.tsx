import { useRouterState } from "@tanstack/react-router";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

// Should kick in on slow loads so users still get feedback. one to monitor

export function ProgressBar() {
	const isRouting = useRouterState({
		select: (state) => state.status === "pending",
	});

	// Don't render anything if the router is idle or finished navigating
	if (!isRouting) return null;

	return (
		<Box
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				zIndex: 9999,
			}}
		>
			<LinearProgress color="primary" />
		</Box>
	);
}

export default ProgressBar;
