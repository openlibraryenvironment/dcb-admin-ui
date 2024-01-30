import { GetServerSideProps, NextPage } from 'next'
import { AdminLayout } from '@layout';
import { List, ListItem, ListItemButton, ListItemText, useTheme} from '@mui/material';
//localisation
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Mappings: NextPage = () => {


	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<AdminLayout title={t("nav.mappings")}>
			<List
				component="nav"
				aria-labelledby="mappings-title">
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/mappings/allMappings">
					<ListItemText primary={t("nav.allMappings")} />
					</ListItemButton>
				</ListItem>
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/mappings/circulationStatusMappings">
					<ListItemText primary={t("nav.circulationStatusMappings")} />
					</ListItemButton>
				</ListItem>
			</List>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}
	return {
		props: {
			...translations,
		}
	};
};

export default Mappings;