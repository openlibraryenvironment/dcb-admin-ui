import { PropsWithChildren, ReactNode } from "react";
import { Box, Paper, Stack } from "@mui/material";

import Footer from "@layout/Footer/Footer";
import Header from "@layout/Header/Header";
import LinkedFooter from "@layout/LinkedFooter/LinkedFooter";

interface LoginLayoutProps {
	children?: ReactNode;
	pageName?: string;
}

export default function LoginLayout({
	children,
}: PropsWithChildren<LoginLayoutProps>) {
	return (
		<>
			<Header iconsVisible={false} />
			<Paper
				elevation={12}
				sx={{ backgroundColor: "primary.landingBackground", borderRadius: 0 }}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						minHeight: "100vh",
						width: "100%",
					}}
				>
					{/*
					 * Full-bleed content area. Each child (login card, LandingCard) owns a
					 * full-width coloured band and caps its own inner content to 1400px —
					 * matching the fixed Header's Toolbar. Do NOT cap width here, or the
					 * bands get clipped and no longer align with the header bar.
					 * `mt` clears the 70px fixed AppBar.
					 */}
					<Box
						sx={{
							flexGrow: 1,
							display: "flex",
							flexDirection: "column",
							width: "100%",
						}}
					>
						<Stack spacing={2} sx={{ width: "100%", mt: "70px" }}>
							<Box sx={{ flex: "1 0 auto" }}>{children}</Box>
						</Stack>
					</Box>

					<Box
						sx={{
							backgroundColor: "primary.linkedFooterBackground",
							py: 2,
							flexShrink: 0,
							overflow: "auto",
						}}
					>
						<LinkedFooter />
					</Box>
					<Box
						sx={{
							backgroundColor: "primary.footerArea",
							p: 2,
							flexShrink: 0,
							overflow: "auto",
						}}
					>
						<Footer />
					</Box>
				</Box>
			</Paper>
		</>
	);
}
