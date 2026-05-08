import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
// Can be removed after switch away from next.js

export function ProgressBar() {
	const router = useRouter();
	const [isRouting, setIsRouting] = useState(false);

	useEffect(() => {
		const handleStart = () => setIsRouting(true);
		const handleStop = () => setIsRouting(false);

		router.events.on("routeChangeStart", handleStart);
		router.events.on("routeChangeComplete", handleStop);
		router.events.on("routeChangeError", handleStop);

		return () => {
			router.events.off("routeChangeStart", handleStart);
			router.events.off("routeChangeComplete", handleStop);
			router.events.off("routeChangeError", handleStop);
		};
	}, [router.events]);

	// Don't render anything if we aren't actively navigating
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
