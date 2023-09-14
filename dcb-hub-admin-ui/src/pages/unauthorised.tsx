import Link from 'next/link';
import * as React from 'react';
import { AdminLayout } from '@layout';
import { Typography } from '@mui/material';

export default function Unauthorised() {
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
				<Typography className='Title'>401</Typography>
				<Typography className='Text'>Sorry, you do not have access to this page.</Typography>
				<Typography className='Text'>
					If you think you should have access, contact your system administrator
				</Typography>
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
