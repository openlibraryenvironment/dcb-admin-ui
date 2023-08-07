import Summary from './Summary';
import RowsPerPage from './RowsPerPage';
import Paginate from './Paginate';

type ACTIONS =
	| { type: 'PAGE_NUMBER_CHANGE'; payload: { pageIndex: number; pageNumber: number } }
	| {
			type: 'ITEMS_PER_PAGE_CHANGE';
			payload: { pageNumber: number; pageIndex: number; perPage: string };
	  };

const Pagination = ({
	from,
	to,
	total,
	perPage,
	pageIndex,
	totalNumberOfPages,
	onChange = null
}: {
	from: number;
	to: number;
	total: number;
	perPage: number;
	pageIndex: number;
	totalNumberOfPages: number;
	onChange?: null | ((data: ACTIONS) => void);
}) => (
	<div className='row align-items-center justify-content-center'>
		<Summary from={from} to={to} total={total} />

		<RowsPerPage
			perPage={perPage}
			onRowsPerPageChange={({ perPage, pageIndex, pageNumber }) => {
				if (onChange) {
					onChange({ type: 'ITEMS_PER_PAGE_CHANGE', payload: { pageNumber, pageIndex, perPage } });
				}
			}}
		/>

		{totalNumberOfPages > 0 && (
			<Paginate
				pageIndex={pageIndex}
				totalNumberOfPages={totalNumberOfPages}
				onPageNumberChange={({ pageIndex, pageNumber }) => {
					if (onChange) {
						onChange({ type: 'PAGE_NUMBER_CHANGE', payload: { pageIndex, pageNumber } });
					}
				}}
			/>
		)}
	</div>
);

export default Pagination;
