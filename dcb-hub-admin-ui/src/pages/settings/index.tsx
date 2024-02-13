import { NextPage } from 'next';
import { AdminLayout } from '@layout';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Typography from '@mui/material/Typography';

const Settings: NextPage = () => {
	const { t } = useTranslation();
	return (
		<AdminLayout title={t("nav.settings.name")}>
			<Typography variant = 'h3'>
				{t('common.missing')}
			</Typography>
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