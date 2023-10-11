import type { NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Typography, Card } from '@mui/material';
//localisation
import { useTranslation } from 'react-i18next';

const Home: NextPage = () => {
	// SignOutIfInactive();
	const { t } = useTranslation();

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					<CardContent>
						<Typography variant="h3"> {t('dashboard.app_title')} </Typography>
						<Typography variant="body1"> {t('dashboard.page_welcome_message')} </Typography>
					</CardContent>	
				</Card>
			</Paper>
		</AdminLayout>
	);
};

export default Home;
