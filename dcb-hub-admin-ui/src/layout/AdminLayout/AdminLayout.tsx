import { PropsWithChildren, ReactNode, useState } from 'react';
import Head from 'next/head';
import Footer from '@layout/AdminLayout/Footer/Footer';
import Box from '@mui/material/Box';
import Header from './Header/Header';
import Breadcrumbs from './Breadcrumbs/Breadcrumbs';
import { Stack, Typography, useTheme } from '@mui/material';
import Sidebar from '@layout/AdminLayout/Sidebar/Sidebar';
import { useSession } from 'next-auth/react';
interface AdminLayoutProps {
	title?: string;
	children?: ReactNode;
}

// This layout takes the following props: a title and components to be rendered as children
// It is intended for use with pages that have a title, a footer, and a single content area.
// Different layouts may be required for other pages in DCB Admin.

// Title component must have a white background.

export default function AdminLayout({ title, children }: PropsWithChildren<AdminLayoutProps>) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const theme = useTheme();
	const { data, status } = useSession();
	return (
		<>
			<Head>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<Header openStateFuncClosed={()=>setSidebarOpen(!sidebarOpen)} />
			<Box sx={{display: 'flex', height: '100%', width: '100%'}}>
				<Sidebar
					openStateOpen = {sidebarOpen}
					openStateFuncOpen = {()=>{setSidebarOpen(sidebarOpen)}}
					openStateFuncClosed = {()=>setSidebarOpen(!sidebarOpen)}
				/>
				<Box display="flex" sx={{flexGrow: 3, pl: 0, pt: 3, pr: 0, pb: 0, marginTop: 7, overflow: 'auto', height: '100%', width: '100%',display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
						<Box sx={{flexGrow: 3, overflow: 'auto', flex: 1, minHeight: '50px'}}>
						<Stack spacing={2} sx={{height: '100%', width: '100%'}}>
							<Breadcrumbs />
							<Box sx={{flexGrow: 1, p: 3, pl: 0, pr: 0, backgroundColor: theme.palette.primary.titleArea}}>
							{(title!= null ? 
								<Typography id="page-title" pl={2} variant = "h2">
									{title}
								</Typography>
								: null)}
							</Box>
							<Box sx={{flexGrow: 1, pl: 2, pr: 0}}>
								{children}
							</Box>
						</Stack>
				</Box>
				<Box sx={{backgroundColor: theme.palette.primary.footerArea, minHeight: '50px', overflow: 'auto', padding: 3}}>
				<Footer/>
				</Box>
			</Box>
		</Box>
		</>
	);
}
