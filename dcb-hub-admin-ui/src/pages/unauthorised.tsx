import Link from '@components/Link/Link';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';
//localisation
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Unauthorised() {
	const { t } = useTranslation();
	return (
		<AdminLayout title={t("unauthorised.page_title")} hideTitleBox={true} hideBreadcrumbs={true}>
			{' '}
			<div className='unauthorised'>
				<Typography className='Title'>{t("unauthorised.page_title")}</Typography>
				<Typography className='Text'>{t("unauthorised.page_text_no_access")}</Typography>
				<Typography className='Text'>
					{t("unauthorised.page_text_contact_admin")}
				</Typography>
				<Typography className='GoBackText'>
					{t("unauthorised.go_back_text")}
					<Link aria-label='dashboard link' className='LinkTo' href='/'>
						{t("unauthorised.dashboard_text")}
					</Link>
				</Typography>
			</div>
		</AdminLayout>
	);
}

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
