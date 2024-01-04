import { PropsWithChildren, useState } from 'react';
import Head from 'next/head';
import Footer from '@layout/AdminLayout/Footer/Footer';
import Box from '@mui/material/Box';
import Header from './Header/Header';
import Breadcrumbs from './Breadcrumbs/Breadcrumbs';
import { Stack, Typography } from '@mui/material';
import Sidebar from '@layout/AdminLayout/Sidebar/Sidebar';
interface AdminLayoutProps {
	title?: string;
}

// This layout takes the following props: a title and components to be rendered as children
// It is intended for use with pages that have a title, a footer, and a single content area.
// Different layouts may be required for other pages in DCB Admin.

  

export default function AdminLayout({ title, children }: PropsWithChildren<AdminLayoutProps>) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	return (
		<>
		<Head>
			<link rel='icon' href='/favicon.ico' />
		</Head>
		<Header openStateFuncClosed={()=>setSidebarOpen(!sidebarOpen)} />
		<Box sx={{ display: 'flex'}}>
		<Sidebar
			openStateOpen = {sidebarOpen}
			openStateFuncOpen = {()=>{setSidebarOpen(sidebarOpen)}}
			openStateFuncClosed = {()=>setSidebarOpen(!sidebarOpen)}
			/>
			<Box sx={{flexGrow: 3, p: 3, marginTop: 7, overflow: 'auto'}}>
				<div>
					<Stack spacing={2}>
					<Breadcrumbs />
					{(title!= null ? 
						<Typography variant = "h2">
									{title}
						</Typography>
					: null)}
					{children}
					<Footer/>
					</Stack>
				</div>
				</Box>
		</Box>
		</>
	);
}
