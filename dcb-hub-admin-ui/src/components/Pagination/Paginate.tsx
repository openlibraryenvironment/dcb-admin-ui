import { useRouter } from 'next/router';

import ReactPaginate from 'react-paginate';

export default function Paginate({
	pageIndex,
	totalNumberOfPages,
	onPageNumberChange = null
}: {
	pageIndex: number;
	totalNumberOfPages: number;
	onPageNumberChange: null | ((data: { pageIndex: number; pageNumber: number }) => void);
}) {
	const router = useRouter();

	return (
		<div className='col-auto ms-sm-auto mb-3 overflow-auto'>
			<ReactPaginate
				forcePage={pageIndex}
				pageCount={totalNumberOfPages}
				marginPagesDisplayed={1}
				pageRangeDisplayed={3}
				containerClassName='pagination mb-0'
				previousClassName='page-item'
				pageClassName='page-item'
				breakClassName='page-item'
				nextClassName='page-item'
				previousLinkClassName='page-link'
				pageLinkClassName='page-link'
				breakLinkClassName='page-link'
				nextLinkClassName='page-link'
				previousLabel='‹'
				nextLabel='›'
				activeClassName='active'
				disabledClassName='disabled'
				onPageChange={(selectedItem) => {
					const page = selectedItem.selected + 1;

					if (onPageNumberChange) {
						onPageNumberChange({ pageIndex: selectedItem.selected, pageNumber: page });
					}

					router.push({
						pathname: router.pathname,
						query: {
							...router.query,
							page
						}
					});
				}}
			/>
		</div>
	);
}
