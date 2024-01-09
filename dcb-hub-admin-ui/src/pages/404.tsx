import Link from '@components/Link/Link';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function NotFound() {
	const { t } = useTranslation();
	return (
		<AdminLayout title={t("404.page_title")}>
			{' '}
			<div className='not-found'>
				<Typography className='Text'>{t("404.page_text")}</Typography>
				<Typography className='GoBackText'>
					{t("404.go_back_text")}
					<Link aria-label='dashboard link' className='LinkTo' href='/'>
						{t("404.dashboard_text")}
					</Link>
				</Typography>
			</div>
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
