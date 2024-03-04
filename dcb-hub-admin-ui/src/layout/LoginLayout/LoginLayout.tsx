import Footer from "@layout/AdminLayout/Footer/Footer";
import Header from "@layout/AdminLayout/Header/Header";
import { Box, Paper, Stack, useTheme } from "@mui/material";
import Head from "next/head";
import { PropsWithChildren, ReactNode } from "react";

interface LoginLayoutProps {
	children?: ReactNode;
}

export default function LoginLayout({ children}: PropsWithChildren<LoginLayoutProps>) {
    const theme = useTheme();
	return (
		<>
			<Head>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<Header iconsVisible={false} />
            <Paper elevation={12} sx={{backgroundColor: theme.palette.primary.landingBackground}}>
			<Box sx={{display: 'flex', height: '100%', width: '100%', justifyContent: 'center'}}>
	
				<Box display="flex"
				sx={{ flexGrow: 3, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '1440px'}}>
					<Stack spacing={2} sx={{height: '100%', width: '100%', marginTop: 8}}>
						<Box sx={{ flex: '1 0 auto'}}>
							{children}
						</Box>
					</Stack>
					{/* Footer
						- flexShrink: 0 - flex item does not shrink
					*/}
					<Box sx={{ backgroundColor: theme.palette.primary.footerArea, overflow: 'auto', padding: 3, flexShrink: 0 }}>
						<Footer/>
					</Box>
				</Box>
			</Box>
            </Paper>
		</>
	);
}