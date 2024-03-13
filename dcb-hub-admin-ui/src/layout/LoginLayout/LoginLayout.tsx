import Footer from "@layout/AdminLayout/Footer/Footer";
import Header from "@layout/AdminLayout/Header/Header";
import LinkedFooter from "@layout/AdminLayout/LinkedFooter/LinkedFooter";
import { Box, Paper, Stack, useTheme } from "@mui/material";
import Head from "next/head";
import { PropsWithChildren, ReactNode } from "react";

interface LoginLayoutProps {
	children?: ReactNode;
	pageName?: string;
}

export default function LoginLayout({ children, pageName }: PropsWithChildren<LoginLayoutProps>) {
    const theme = useTheme();
	return (
		<>
			<Head>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<Header iconsVisible={false} />
            <Paper elevation={12} sx={{backgroundColor: theme.palette.primary.landingBackground}}>
			<Box sx={{display: 'flex', height: '100%', width: '100%', flexDirection: 'column', minHeight: '100vh'}}>
				{/* This ternary condition is used to render pages that have specific styling applied to one part of them
				- in this case it is the background of the login text needing to be extended
				- the styling has been applied to the individual component and it is rendered here without additional styles if it is the landingPage */}
				{ pageName === 'landingPage' || 'logOut' ?
				(children) :(
					<Box display="flex"
					sx={{ flexGrow: 3, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '1440px', margin: 'auto'}}>
						<Stack spacing={2} sx={{height: '100%', width: '100%', marginTop: 8}}>
							<Box sx={{ flex: '1 0 auto'}}>
								{children}
							</Box>
						</Stack>
					</Box>
				)}
				<Box sx={{ overflow: 'auto', backgroundColor: theme.palette.primary.linkedFooterBackground, paddingBottom: 2, paddingTop: 2, flexShrink: 0}}>
					<LinkedFooter/>
				</Box>
				<Box sx={{ overflow: 'auto', backgroundColor: theme.palette.primary.footerArea, padding: 2, flexShrink: 0 }}>
					<Footer/>
				</Box>
			</Box>
            </Paper>
		</>
	);
}