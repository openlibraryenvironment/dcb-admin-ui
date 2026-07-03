import { ReactNode, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";

import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import LinkedFooter from "../LinkedFooter/LinkedFooter";
import { useSidebarStore } from "@hooks/useSidebarStore";

export default function StructuralLayout({
	children,
}: {
	children: ReactNode;
}) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	// Desktop docked visibility is a persisted preference; the mobile overlay is
	// transient (never open on first paint). One menu button toggles whichever
	// axis is active at the current breakpoint.
	const desktopOpen = useSidebarStore((state) => state.sidebarOpen);
	const setSidebarOpen = useSidebarStore((state) => state.setSidebarOpen);
	const [mobileOpen, setMobileOpen] = useState(false);

	const menuOpen = isMobile ? mobileOpen : desktopOpen;
	const handleMenuToggle = () =>
		isMobile ? setMobileOpen((open) => !open) : setSidebarOpen(!desktopOpen);

	return (
		<Box
			sx={{
				display: "flex",
				height: "100%",
				width: "100%",
				flexDirection: "column",
				minHeight: "100vh",
				backgroundColor: "primary.pageBackground",
				pt: "70px",
			}}
		>
			<Header onMenuClick={handleMenuToggle} menuOpen={menuOpen} />

			<Box
				sx={{
					display: "flex",
					maxWidth: "1400px",
					height: "100%",
					width: "100%",
					alignSelf: "center",
					flex: "1 0 auto",
					backgroundColor: "primary.pageContentBackground",
				}}
			>
				<Sidebar
					isMobile={isMobile}
					mobileOpen={mobileOpen}
					desktopOpen={desktopOpen}
					onClose={() => setMobileOpen(false)}
				/>

				<Box
					sx={{
						flexGrow: 3,
						overflow: "auto",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{/* The marginTop pushes content below the fixed Header - CHECK*/}
					{/* <Box sx={{ height: "100%", width: "100%", marginTop: 9 }}> */}
					<Box sx={{ height: "100%", width: "100%" }}>{children}</Box>
				</Box>
			</Box>

			<Box
				sx={{
					overflow: "auto",
					backgroundColor: "primary.linkedFooterBackground",
					py: 2,
					flexShrink: 0,
				}}
			>
				<LinkedFooter />
			</Box>
			<Box
				sx={{
					overflow: "auto",
					backgroundColor: "primary.footerArea",
					p: 2,
					flexShrink: 0,
				}}
			>
				<Footer />
			</Box>
		</Box>
	);
}
