import { ReactNode, useState } from "react";
import { Box } from "@mui/material";

import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import LinkedFooter from "../LinkedFooter/LinkedFooter";

export default function StructuralLayout({
	children,
}: {
	children: ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(true);

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
			<Header openStateFuncClosed={() => setSidebarOpen(!sidebarOpen)} />

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
					openStateOpen={sidebarOpen}
					openStateFuncOpen={() => setSidebarOpen(true)}
					openStateFuncClosed={() => setSidebarOpen(false)}
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
