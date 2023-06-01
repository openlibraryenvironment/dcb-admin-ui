import { useRouter } from 'next/router';

import { Form } from 'react-bootstrap';

export default function RowsPerPage({
	perPage,
	onRowsPerPageChange
}: {
	perPage: number;
	onRowsPerPageChange:
		| null
		| ((data: { pageNumber: number; pageIndex: number; perPage: string }) => void);
}) {
	const router = useRouter();

	return (
		<div className='col-auto ms-sm-auto mb-3'>
			Rows per page:{' '}
			<Form.Select
				defaultValue={perPage}
				className='d-inline-block w-auto'
				aria-label='Item per page'
				onChange={({ target: { value: perPage } }) => {
					// When the optional callback is provided when the onChange is called provide the neccessary data
					if (onRowsPerPageChange) {
						onRowsPerPageChange({ pageNumber: 1, pageIndex: 0, perPage: perPage });
					}

					router.push({
						pathname: router.pathname,

						// Generates the search parameters for the current page in view
						// NOTE: This will cause the pages getServerSideProps to run again, this is where we can validate and rest any values
						query: {
							// Spread any exiting properties
							...router.query,

							// Since we have changed the number of items per page go back to page 1
							page: 1,

							// Update the perPage query parameter with the new incoming value
							perPage: perPage
						}
					});
				}}
			>
				<option value={20}>20</option>
				<option value={50}>50</option>
				<option value={100}>100</option>
				<option value={250}>250</option>
			</Form.Select>
		</div>
	);
}
