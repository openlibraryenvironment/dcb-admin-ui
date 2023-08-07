import * as React from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';

import { Card } from 'react-bootstrap';
import { AdminLayout } from '@layout';
import { Pagination } from '@components/Pagination';
import TanStackTable from '@components/TanStackTable';

import { useResource } from '@hooks';
import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table';

import { Location } from '@models/Location';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const Locations: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

	// Formats the data from getServerSideProps into the apprropite format for the useResource hook (Query key) and the TanStackTable component
	const externalState = React.useMemo<{ pagination: PaginationState; sort: SortingState }>(
		() => ({
			pagination: {
				pageIndex: page - 1,
				pageSize: resultsPerPage
			},
			sort: sort
		}),
		[page, resultsPerPage, sort]
	);

	// Generate the url for the useResource hook
	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/locations';
	}, []);

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<Location>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: '#',
				id: 'locationId',
				enableSorting: false
			}),
			columnHelper.accessor('code', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Code',
				id: 'locationCode' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('name', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Name',
				id: 'locationName' // Used as the unique property in the sorting state (See React-Query dev tools)
			})
		];
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<Location>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'locations',
		url: url,
		externalState
	});

	return (
		<AdminLayout>
			<Card>
				<Card.Header>Locations</Card.Header>
				<Card.Body>
					{resourceFetchStatus === 'loading' && (
						<p className='text-center mb-0'>Loading locations.....</p>
					)}

					{resourceFetchStatus === 'error' && (
						<p className='text-center mb-0'>Failed to fetch the locations</p>
					)}

					{resourceFetchStatus === 'success' && (
						<>
							<Pagination
								from={resource?.meta?.from ?? 0}
								to={resource?.meta?.to ?? 0}
								total={resource?.meta?.total ?? 0}
								perPage={externalState.pagination.pageSize}
								pageIndex={externalState.pagination.pageIndex}
								totalNumberOfPages={state.totalNumberOfPages}
							/>

							<TanStackTable
								data={resource?.content ?? []}
								columns={columns}
								pageCount={state.totalNumberOfPages}
								enableTableSorting
								sortingState={externalState.sort}
							/>
						</>
					)}
				</Card.Body>
			</Card>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
	let page = 1;
	if (context.query?.page && typeof context.query.page === 'string') {
		page = parseInt(context.query.page, 10);
	}

	let resultsPerPage = 20;
	if (context.query?.perPage && typeof context.query.perPage === 'string') {
		resultsPerPage = parseInt(context.query.perPage.toString(), 10);
	}

	// Defaults to sorting the locationCode in ascending order (The id must be the same the id assigned to the "column")
	let sort: SortingState = [{ id: 'locationCode', desc: false }];

	if (typeof context.query.sort === 'string' && typeof context.query?.order === 'string') {
		// Sort in this case is something like locationName (table prefix + some unique id for the table)
		const contextSort = context.query?.sort ?? '';

		// Cast the contexts order to either be 'asc' or 'desc' (Defaults to asc)
		const contextOrder = (context.query?.order ?? 'asc') as 'asc' | 'desc';

		// If the values pass the validation check override the original sort with the new sort
		if (contextOrder === 'desc' || contextOrder === 'asc') {
			sort = [{ id: contextSort, desc: contextOrder === 'desc' }];
		}
	}

	// NOTE: If you really want to prefetch data and as long as you return the data you can then pass it to TanStack query to pre-populate the current cache key to prevent it refetching the data

	return {
		props: {
			page,
			resultsPerPage,
			sort: sort
		}
	};
};

export default Locations;
