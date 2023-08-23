import Link from 'next/link';
import * as React from 'react';
import { AdminLayout } from '@layout';

export default function NotFound() {
	return (
		<AdminLayout>
			{' '}
			<div className='not-found'>
				<p className='Title'>404</p>
				<p className='Text'>Oops! Page not found.</p>
				<p className='GoBackText'>
					Go back to the{' '}
					<Link className='LinkTo' href='/'>
						dashboard
					</Link>
				</p>
			</div>
		</AdminLayout>
	);
}
