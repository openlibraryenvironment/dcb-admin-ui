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
	hideTitleBox?: boolean;
}

// This layout takes the following props: a title and components to be rendered as children
// It is intended for use with pages that have a title, a footer, and a single content area.
// Different layouts may be required for other pages in DCB Admin.

// Title component must have a white background.

export default function AdminLayout({ title, children, hideTitleBox }: PropsWithChildren<AdminLayoutProps>) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const theme = useTheme();
	const { data, status } = useSession();
	return (
		<>
			<Head>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<Header openStateFuncClosed={()=>setSidebarOpen(!sidebarOpen)} />
			{/*container for everything, includes the sidebar*/}
			<Box sx={{display: 'flex', height: '100%', width: '100%'}}>
				<Sidebar
					openStateOpen = {sidebarOpen}
					openStateFuncOpen = {()=>{setSidebarOpen(sidebarOpen)}}
					openStateFuncClosed = {()=>setSidebarOpen(!sidebarOpen)}
				/>
				{/* Container for content exluding the sidebar
					- flexGrow makes the content grow to the window size
					- overflow: auto, means that content does not go beyond it's container
					- minHeight must be 100vh for the footer to be at the bottom of the screen
				*/}
				<Box display="flex" pr={3} pl={3}
				sx={{ flexGrow: 3, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
					{ /* MarginTop: 9 is to stop the breadcrumbs entering header area */}
					<Stack spacing={2} sx={{height: '100%', width: '100%', marginTop: 9}}>
						<Box>
							<Breadcrumbs pageTitle={title}/>
						</Box>
						{ /* Title
							- height: 90px & p: 3 - this is to make the text appear centered
						*/}
						{/* Only render tile box if the value from page props is true */}
						{(hideTitleBox!=true ?
						<Box sx={{ p: 3, pl: 0, pr: 0, marginTop: 1, marginBottom: 1, height: '90px', backgroundColor: theme.palette.primary.titleArea }}>
							{(title!= null ? 
							<Typography id="page-title" pl={2} variant = "h2">
								{title}
							</Typography>
							: null)}
						</Box> : null )}
						{/* Children
							- flex: '1 0 auto' - child element grows to fill space and pushes the footer to the bottom
						*/}
						<Box sx={{ flex: '1 0 auto' }}>
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
		</>
	);
}
