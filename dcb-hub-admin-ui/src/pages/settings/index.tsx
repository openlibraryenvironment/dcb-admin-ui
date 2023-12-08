import { NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Card, List, ListSubheader, ListItem, ListItemButton, ListItemText, CardHeader } from '@mui/material';
import { useTranslation } from 'next-i18next';
import useCode from '@hooks/useCode';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';



const Settings: NextPage = () => {
	// SignOutIfInactive();

	const { t } = useTranslation();
	const updateCategory = useCode((state) => state.updateCategory);
	const setDestinationCategory = (value: string) => {
		updateCategory(value);
	};

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					<CardHeader title={t("settings.settings")}/>
					<CardContent>
						<List
							sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
							component="nav"
							aria-labelledby="settings-subheader"
							subheader={
								<ListSubheader component="div" id="settings-subheader">
								{t("mappings.mappings")}
								</ListSubheader>
							}>
							<ListItem component="nav" disablePadding>
            					<ListItemButton component="a" href="/mappings">
              					<ListItemText primary={t("settings.all_mappings")} />
            					</ListItemButton>
          					</ListItem>
							<ListItem component="nav" disablePadding>
            					<ListItemButton onClick={(event) => setDestinationCategory("CirculationStatus")}
												component="a" href="/mappings/MappingsByCategory">
              					<ListItemText primary={t("settings.circulation_status")} />
            					</ListItemButton>
          					</ListItem>
						</List>
					</CardContent>	
				</Card>
			</Paper>
		</AdminLayout>
	);
};

export async function getStaticProps({ locale }: {locale: any}) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
			'application',
			'common',
			'validation'
			])),
		},
	}
};

export default Settings;