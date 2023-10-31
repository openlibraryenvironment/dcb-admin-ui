import Link from '@components/Link/Link';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';
//localisation
import { useTranslation } from 'next-i18next';

export default function Unauthorised() {
	const { t } = useTranslation();
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
				<Typography className='Title'>{t("unauthorised.page_title", "401")}</Typography>
				<Typography className='Text'>{t("unauthorised.page_text_no_access", "Sorry, you do not have access to this page.")}</Typography>
				<Typography className='Text'>
					{t("unauthorised.page_text_contact_admin", "If you think you should have access, contact your system administrator")}
				</Typography>
				<Typography className='GoBackText'>
					{t("unauthorised.go_back_text", "Go back to the ")}
					<Link aria-label='dashboard link' className='LinkTo' href='/'>
						{t("unauthorised.dashboard_text", "dashboard")}
					</Link>
				</Typography>
			</div>
		</AdminLayout>
	);
}
