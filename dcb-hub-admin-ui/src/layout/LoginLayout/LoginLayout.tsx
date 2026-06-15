import { PropsWithChildren, ReactNode } from "react";
import { Box, Paper, Stack } from "@mui/material";

import Footer from "@layout/AdminLayout/Footer/Footer";
import Header from "@layout/AdminLayout/Header/Header";
import LinkedFooter from "@layout/AdminLayout/LinkedFooter/LinkedFooter";

interface LoginLayoutProps {
	children?: ReactNode;
	pageName?: string;
}

export default function LoginLayout({
	children,
	pageName,
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
					{/* Replaced the buggy ternary block with a unified clean layout */}
					<Box
						sx={{
							flexGrow: 1,
							display: "flex",
							flexDirection: "column",
							maxWidth: "1440px",
							width: "100%",
							margin: "auto",
						}}
					>
						<Stack
							spacing={2}
							sx={{ height: "100%", width: "100%", mt: 8, p: 2 }}
						>
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
