import type { NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Typography, Card } from '@mui/material';

const Home: NextPage = () => {
	// SignOutIfInactive();

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					<CardContent>
						<Typography variant="h3"> Home </Typography>
						<Typography variant="body1"> Welcome to the home page of the DCB Admin UI! </Typography>
					</CardContent>	
				</Card>
			</Paper>
		</AdminLayout>
	);
};

export default Home;
