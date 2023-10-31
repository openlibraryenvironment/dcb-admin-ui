import { NextPage } from 'next';

import { Card, CardContent, Paper, List, ListItemIcon, ListItemText, Typography, ListSubheader, ListItem } from "@mui/material"

import { MdPersonOutline } from 'react-icons/md';
import { MdOutlineMail } from 'react-icons/md';
import { MdOutlineMarkEmailRead } from 'react-icons/md';
import { MdThumbUpOffAlt } from 'react-icons/md';
import { MdOutlineSupervisorAccount } from 'react-icons/md';

//localisation
import { useTranslation } from 'next-i18next';

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
	
	//This is the old way of rendering roles before DCB-397 (https://openlibraryfoundation.atlassian.net/browse/DCB-397)
	//Use this function to render roles in a list
	/*
	const renderListOfRoles = (roles: string[]) => {
		return roles?.map((role) => (
			<ListItem key={role} sx={{ display: 'list-item', listStyleType: 'disc', pl: 4 }}>
				<ListItemText>
					{role}
				</ListItemText>
			</ListItem>
		));
	};*/

	const formatRoles = (roles: any) => {
		const formattedRoles = roles && roles.join(', ')
		return(
			<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.roles", "Roles: ")} </span>
				{formattedRoles}
			</ListItemText>
		)
	}

	// SignOutIfInactive();
	const { t } = useTranslation();

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					<CardContent component="div">
						<List className='list-profile'>
						<ListSubheader> 
								<Typography variant = "h2">{t("profile.title", "Profile")}</Typography> 
								<Typography variant = "h6">{t("profile.details", "Your details")}</Typography> 
						</ListSubheader> 
						<ListItem>
							<ListItemIcon> <MdPersonOutline /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.name","Name: ")} </span>{' '}
							{session?.user?.name} </ListItemText> 
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdOutlineMail /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.email", "Email: ")} </span>
							{session?.user?.email} </ListItemText>
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdOutlineMarkEmailRead /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.email_verified", "Email Verified: ")} </span>
							{emailVerified.toString()} </ListItemText>
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdThumbUpOffAlt /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.prefered_username", "Prefered Username: ")} </span>
							{session?.profile?.preferred_username} </ListItemText>
						</ListItem>
						<ListItem>
								<ListItemIcon><MdOutlineSupervisorAccount/></ListItemIcon>
								{formatRoles(session?.profile?.roles)}
						</ListItem>
					</List>
					</CardContent>
				</Card>
			</Paper>
		</AdminLayout>
	);
};

export default Profile;
