export default function Summary({ total, from, to }: { total: number; from: number; to: number }) {
	return (
		<div className='col-12 text-center text-sm-start col-sm-auto col-lg mb-3'>
			Showing <span className='fw-semibold'>{from}</span> to{' '}
			<span className='fw-semibold'>{to}</span> of <span className='fw-semibold'>{total}</span>{' '}
			results
		</div>
	);
}
