import Link from '@components/Link/Link';
import * as React from 'react';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';
//localisation
import { useTranslation } from 'react-i18next';

export default function NotFound() {
	const { t } = useTranslation();
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
				<Typography className='Title'>{t("404.page_title")}</Typography>
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
}
