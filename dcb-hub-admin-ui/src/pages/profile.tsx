import * as React from 'react';
import { NextPage } from 'next';

import { Card, CardContent, Paper, List, ListItemIcon, ListItemText, Typography, ListSubheader, ListItem } from "@mui/material"

import { MdPersonOutline } from 'react-icons/md';
import { MdOutlineMail } from 'react-icons/md';
import { MdOutlineMarkEmailRead } from 'react-icons/md';
import { MdThumbUpOffAlt } from 'react-icons/md';
import { MdOutlineSupervisorAccount } from 'react-icons/md';

import { AdminLayout } from '@layout';

import { useSession } from 'next-auth/react';

// import SignOutIfInactive from './useAutoSignout';

type Props = {
	page: number;
	perPage: number;
	sort: string;
	order: string;
};

const Profile: NextPage<Props> = (props) => {
	const { data: session, status }: { data: any; status: any } = useSession();
	const emailVerified = session?.profile?.email_verified ?? 'Cannot fetch verified email status.';
	const renderListOfRoles = (roles: string[]) => {
		return roles?.map((role) => (
			<ListItem key={role} sx={{ display: 'list-item', listStyleType: 'disc', pl: 4 }}>
				<ListItemText>
					{role}
				</ListItemText>
			</ListItem>
		));
	};
	// SignOutIfInactive();

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					{/*use <CardMedia for profile pictures if needed in the future*/}
					<CardContent component="div">
						<List className='list-profile'>
						<ListSubheader> 
								<Typography variant = "h2">Profile</Typography> 
								<Typography variant = "h6">Your details</Typography> 
						</ListSubheader> 
						<ListItem>
							<ListItemIcon> <MdPersonOutline /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>Name: </span>{' '}
							{session?.user?.name} </ListItemText> 
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdOutlineMail /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>Email: </span>
							{session?.user?.email} </ListItemText>
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdOutlineMarkEmailRead /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}> Email Verified: </span>
							{emailVerified.toString()} </ListItemText>
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdThumbUpOffAlt /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>Preferred Username: </span>
							{session?.profile?.preferred_username} </ListItemText>
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdOutlineSupervisorAccount /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>Roles: </span>
								<List component="ul">
									{renderListOfRoles(session?.profile?.roles)}
								</List>
							</ListItemText>
						</ListItem>
					</List>
					</CardContent>
				</Card>
			</Paper>
		</AdminLayout>
	);
};

export default Profile;
