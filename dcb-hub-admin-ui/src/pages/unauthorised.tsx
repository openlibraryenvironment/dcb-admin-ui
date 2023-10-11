import Link from '@components/Link/Link';
import * as React from 'react';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';
//localisation
import { useTranslation } from 'react-i18next';

export default function Unauthorised() {
	const { t } = useTranslation();
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
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
