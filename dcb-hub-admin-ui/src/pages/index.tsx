import type { NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Typography, Card } from '@mui/material';
//localisation
import { useTranslation } from 'next-i18next';

import FileUploadStatus from '@components/FileUploadStatus/FileUploadStatus';

const Home: NextPage = () => {
	// SignOutIfInactive();
	const { t } = useTranslation();

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					<CardContent>
						<Typography variant="h3"> {t('dashboard.app_title', 'Home')} </Typography>
						<Typography variant="body1"> {t('dashboard.page_welcome_message', 'Welcome to the home page of the DCB Admin UI!')} </Typography>
					</CardContent>	
				</Card>
			</Paper>
		</AdminLayout>
	);
};

export default Home;
