import Link from 'next/link';
import * as React from 'react';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';

export default function NotFound() {
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
				<Typography className='Title'>404</Typography>
				<Typography className='Text'>Oops! Page not found.</Typography>
				<Typography className='GoBackText'>
					Go back to the{' '}
					<Link aria-label='dashboard link' className='LinkTo' href='/'>
						dashboard
					</Link>
				</Typography>
			</div>
		</AdminLayout>
	);
}
