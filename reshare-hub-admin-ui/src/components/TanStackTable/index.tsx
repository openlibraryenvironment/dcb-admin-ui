import * as React from 'react';

import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';

import {
	ColumnDef,
	getCoreRowModel,
	useReactTable,
	flexRender,
	OnChangeFn,
	PaginationState,
	TableState,
	SortingState,
	getPaginationRowModel
} from '@tanstack/react-table';

import { Button, Table } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/router';

const SortIcon = ({
	isDescending = false,
	isAscending = false
}: {
	isDescending: boolean;
	isAscending: boolean;
}) => {
	const iconProps: Partial<FontAwesomeIconProps> = {
		fixedWidth: true,
		size: 'xs'
	};

	if (isAscending === true) {
		return <FontAwesomeIcon icon={faSortUp} {...iconProps} />;
	}

	if (isDescending === true) {
		return <FontAwesomeIcon icon={faSortDown} {...iconProps} />;
	}

	return <FontAwesomeIcon icon={faSort} {...iconProps} />;
};

export default function TanStackTable<T extends Object>({
	data = [],
	columns,
	pageCount,
	paginationState,
	onPaginationChange = undefined,
	enableTableSorting = false,
	enableClientSideSorting = false,
	onSortingChange = undefined,
	sortingState = undefined,
	manualSort = true,
	enableMultiSort = false,
	manualPagination = true
}: {
	data: Array<T>;
	columns: ColumnDef<T, any>[]; // TODO: Find out the type def should be for the second argument of ColumnDef
	onPaginationChange?: OnChangeFn<PaginationState>;
	pageCount?: number;
	paginationState?: PaginationState;
	enableTableSorting?: boolean;
	enableClientSideSorting?: boolean;
	onSortingChange?: OnChangeFn<SortingState>;
	sortingState?: SortingState;
	manualSort?: boolean;
	enableMultiSort?: boolean;
	manualPagination?: boolean;
}) {
	// TODO: Figure out a nice way to handle this instead of this hook directly consuming NextJS hook directly.
	const router = useRouter();

	const MemoizedState = React.useMemo(() => {
		// Core table state, can be partially overriden on a per property basies e.g. just filter or sort or even both
		let state: Partial<TableState> = {};

		// If the paginationState exists then you must provide both the pageIndex and pageSize
		if (paginationState !== undefined) {
			state = {
				...state,
				pagination: {
					pageIndex: paginationState?.pageIndex ?? 0,
					pageSize: paginationState?.pageSize ?? 20
				}
			};
		}

		// If the sortingState exists then you must provide both the id and desc for each column/s you want to sort
		if (sortingState !== undefined) {
			state = {
				...state,
				sorting: sortingState ?? []
			};
		}

		return state;
	}, [paginationState, sortingState]);

	// Generate the tables core logic e.g. header groups and the actual rows to genrate
	const { getHeaderGroups, getRowModel } = useReactTable<T>({
		// Core table functionality
		data: data,
		columns: columns,
		getCoreRowModel: getCoreRowModel<T>(),
		state: MemoizedState,

		// Table pagination functionality
		onPaginationChange: onPaginationChange,
		manualPagination: manualPagination,
		pageCount: pageCount,
		getPaginationRowModel: manualPagination === true ? undefined : getPaginationRowModel<T>(), // The getPaginationRowModel() is only needed when your not manually sorting

		// Table sorting functionality
		enableMultiSort: enableMultiSort,
		enableSorting: enableTableSorting,
		onSortingChange: onSortingChange,
		manualSorting: manualSort
	});

	return (
		<Table responsive bordered hover>
			<thead className='bg-light'>
				{getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							// Initalize the sort and orer query parameters
							let orderQueryParameter = ''; // order is the order you want the data in e.g. asc, desc or ""
							let sortQueryParameter = header?.column?.columnDef?.id ?? ''; // sort is the column you want to sort on
							let query = {};

							if (sortQueryParameter !== '') {
								if (header.column.getIsSorted() === false) {
									// Decide the appropriate sort for the current column e.g. not sorted -> ascending order, ascending order -> descending order
									orderQueryParameter = 'asc';
								} else if (header.column.getIsSorted() === 'asc') {
									orderQueryParameter = 'desc';
								} else if (header.column.getIsSorted() === 'desc') {
									orderQueryParameter = 'asc';
								}

								query = {
									// Spread the current parameters so none of the other properties are orverriden (This includes both nextjs route ones and any arbiturary ones e.g. example='true')
									...router.query,

									// Assign the sort parameter the column id (Prefixed with the various prmeters e.g. locationCode)
									sort: sortQueryParameter,

									// Assign the order parameter the current sort of the column
									order: orderQueryParameter
								};
							}

							return (
								<th key={header.id}>
									<div className='d-flex align-items-center justify-content-between'>
										{/* Render the header element via the flexRender util (It's not actually flexbox related at all, it's ust a fancy render function)*/}
										{flexRender(header.column.columnDef.header, header.getContext())}

										{/* If the column can sort then provide one of the sorting controls */}
										{header.column.getCanSort() && (
											<>
												{/* Either use the Link component to update the query parameters or triggler the column callback to trigger the onSortingChange event */}
												<>
													{enableClientSideSorting === false ? (
														<Link
															className='btn btn-link'
															href={{
																pathname: router.pathname,
																query: { ...query }
															}}
														>
															<SortIcon
																isAscending={header.column.getIsSorted() === 'asc'}
																isDescending={header.column.getIsSorted() === 'desc'}
															/>
														</Link>
													) : (
														<Button
															type='button'
															onClick={header.column.getToggleSortingHandler()}
															variant='link'
														>
															<SortIcon
																isAscending={header.column.getIsSorted() === 'asc'}
																isDescending={header.column.getIsSorted() === 'desc'}
															/>
														</Button>
													)}
												</>
											</>
										)}
									</div>
								</th>
							);
						})}
					</tr>
				))}
			</thead>
			<tbody>
				{getRowModel().rows.map((row) => (
					<tr key={row.id}>
						{row.getVisibleCells().map((cell) => (
							<td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
						))}
					</tr>
				))}
			</tbody>
		</Table>
	);
}
