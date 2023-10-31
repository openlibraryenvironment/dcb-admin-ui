import Link from '@components/Link/Link';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';
//localisation
import { useTranslation } from 'next-i18next';

export default function NotFound() {
	const { t } = useTranslation();
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
				<Typography className='Title'>{t("404.page_title", "404")}</Typography>
				<Typography className='Text'>{t("404.page_text", "Oops! Page not found.")}</Typography>
				<Typography className='GoBackText'>
					{t("404.go_back_text", "Go back to the ")}
					<Link aria-label='dashboard link' className='LinkTo' href='/'>
						{t("404.dashboard_text", "dashboard")}
					</Link>
				</Typography>
			</div>
		</AdminLayout>
	);
}
