import { NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Card, List, ListSubheader, ListItem, ListItemButton, ListItemText, CardHeader } from '@mui/material';
import { useTranslation } from 'next-i18next';


const Settings: NextPage = () => {
	// SignOutIfInactive();

	const { t } = useTranslation();

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
								{t("mappings.mappings", "Mappings")}
								</ListSubheader>
							}>
							<ListItem component="nav" disablePadding>
            					<ListItemButton component="a" href="/mappings">
              					<ListItemText primary={t("settings.circulation_status", "Item circulation status mappings")} />
            					</ListItemButton>
          					</ListItem>
								</List>
					</CardContent>	
				</Card>
			</Paper>
		</AdminLayout>
	);
};

export default Settings;