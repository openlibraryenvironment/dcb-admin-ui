import { useRouterState } from "@tanstack/react-router"; // UPGRADE: Pure hooks-driven state monitoring
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

export function ProgressBar() {
	// UPGRADE: Instantly listens reactive-style to the router compilation pipeline.
	// Fires automatically when lazy-loading route files, code-split chunks, or asynchronous query loaders.
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
