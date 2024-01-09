import { NextPage } from 'next';

import { Card, CardContent, List, ListItemIcon, ListItemText, Typography, ListSubheader, ListItem, useTheme } from "@mui/material"

import { MdPersonOutline } from 'react-icons/md';
import { MdOutlineMail } from 'react-icons/md';
import { MdOutlineMarkEmailRead } from 'react-icons/md';
import { MdThumbUpOffAlt } from 'react-icons/md';
import { MdOutlineSupervisorAccount } from 'react-icons/md';

//localisation
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
			<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.roles")} </span>
				{formattedRoles}
			</ListItemText>
		)
	}

	// SignOutIfInactive();
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<AdminLayout title={t("profile.title")}>

						<List className='list-profile'>
						<ListSubheader sx={{backgroundColor: theme.palette.background.default }}> 
								<Typography variant = "h6">{t("profile.details")}</Typography> 
						</ListSubheader> 
						<ListItem>
							<ListItemIcon> <MdPersonOutline /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.name")} </span>{' '}
							{session?.user?.name} </ListItemText> 
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdOutlineMail /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.email")} </span>
							{session?.user?.email} </ListItemText>
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdOutlineMarkEmailRead /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.email_verified")} </span>
							{emailVerified.toString()} </ListItemText>
						</ListItem>
						<ListItem>
							<ListItemIcon> <MdThumbUpOffAlt /> </ListItemIcon>
							<ListItemText> <span style={{ fontWeight: 'bold' }}>{t("profile.prefered_username")} </span>
							{session?.profile?.preferred_username} </ListItemText>
						</ListItem>
						<ListItem>
								<ListItemIcon><MdOutlineSupervisorAccount/></ListItemIcon>
								{formatRoles(session?.profile?.roles)}
						</ListItem>
					</List>
		</AdminLayout>
	);
};

export async function getServerSideProps({ locale }: {locale: any}) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
			'application',
			'common',
			'validation'
      ])),
    },
  }
}
export default Profile;
