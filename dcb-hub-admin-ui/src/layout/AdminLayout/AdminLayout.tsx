import React, { PropsWithChildren } from 'react';
import Head from 'next/head';
import Sidebar from '@layout/AdminLayout/Sidebar/Sidebar';
import Footer from '@layout/AdminLayout/Footer/Footer';
import Box from '@mui/material/Box';
import Header from './Header/Header';

export default function AdminLayout({ children }: PropsWithChildren) {
	const [open, setOpen] = React.useState(true);

	return (
		<>
		<Head>
			<title>OpenRS DCB Admin</title>
			<meta name='description' content='Generated by create next app' />
			<link rel='icon' href='/favicon.ico' />
		</Head>

		<Header openStateFuncClosed={()=>setOpen(!open)} />

		<Box sx={{ display: 'flex'}}>
			<Sidebar
			openStateOpen = {open}
			openStateFuncOpen = {()=>{setOpen(open)}}
			openStateFuncClosed = {()=>setOpen(!open)}
			/>
			<Box sx={{flexGrow: 3, p: 3, marginTop: 7, overflow: 'auto'}}>
				<div>
					{children}
					<Footer />
				</div>
			</Box>

		</Box>
		</>
	);
}
