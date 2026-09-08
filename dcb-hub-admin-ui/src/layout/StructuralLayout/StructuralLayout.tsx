import { ReactNode, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

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
	const { t } = useTranslation();
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
			{/*
			 * FIRST IN THE DOM, so it is the first tab stop on every page.
			 *
			 * Measured before this existed: fifteen tab stops from the top of /libraries
			 * to the first control on the page itself - three header buttons and then all
			 * twelve sidebar links, on every navigation. WCAG 2.4.1 is satisfiable by a
			 * skip link or by landmarks; the application had neither.
			 *
			 * Hidden by position rather than by `display: none` or `visibility: hidden`:
			 * both of those remove it from the tab order, which is the one thing it needs
			 * to be in. It becomes visible on :focus and nowhere else.
			 *
			 * The target is the <main> that PageContainer renders, which carries
			 * tabIndex={-1} so focus actually lands there.
			 */}
			<Box
				component="a"
				href="#main-content"
				sx={{
					position: "absolute",
					left: 8,
					top: -100,
					zIndex: (theme) => theme.zIndex.appBar + 1,
					px: 2,
					py: 1.5,
					borderRadius: 1,
					textDecoration: "none",
					backgroundColor: "primary.loginCard",
					color: "primary.loginText",
					border: 1,
					borderColor: "primary.outlineColor",
					"&:focus": { top: 8 },
				}}
			>
				{t("nav.skip_to_content")}
			</Box>

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

			{/*
			 * ONE contentinfo landmark holding both bands. Two would be a violation in
			 * themselves, and visually this is one footer: a link strip above a
			 * copyright line.
			 */}
			<Box component="footer" sx={{ flexShrink: 0 }}>
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
		</Box>
	);
}
