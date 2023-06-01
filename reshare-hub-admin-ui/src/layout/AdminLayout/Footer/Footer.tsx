import React from 'react';

export default function Footer() {
	return (
		<footer className='footer flex-column flex-md-row border-top d-flex align-items-center justify-content-between px-4 py-2'>
			<div>
				<a className='text-decoration-none' href='https://www.projectreshare.org'>
					Project ReShare{' '}
				</a>{' '}
				/
				<a className='text-decoration-none' href='https://www.projectreshare.org/DCB'>
					{' '}
					Direct Consortial Borrowing
				</a>
			</div>
			<div className='ms-md-auto'>Admin 1.0</div>
		</footer>
	);
}
