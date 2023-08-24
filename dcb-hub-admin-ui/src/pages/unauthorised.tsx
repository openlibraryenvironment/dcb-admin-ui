import Link from 'next/link';
import * as React from 'react';
import { AdminLayout } from '@layout';

export default function Unauthorised() {
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
				<p className='Title'>401</p>
				<p className='Text'>Sorry, you do not have access to this page.</p>
				<p className='Text'>
					If you think you should have access, contact your system administrator
				</p>
				<p className='GoBackText'>
					Go back to the{' '}
					<Link aria-label='dashboard link' className='LinkTo' href='/'>
						dashboard
					</Link>
				</p>
			</div>
		</AdminLayout>
	);
}
