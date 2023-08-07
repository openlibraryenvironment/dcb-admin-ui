import * as React from 'react';
import { GetServerSideProps, NextPage } from 'next';
import getConfig from 'next/config';
import { useSession } from 'next-auth/react';

import { Card } from 'react-bootstrap';
import { AdminLayout } from '@layout';
import { Pagination } from '@components/Pagination';
import TanStackTable from '@components/TanStackTable';

import { useResource } from '@hooks';
import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table';

import { PatronRequest } from '@models/PatronRequest';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const PatronRequests: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
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
		return publicRuntimeConfig.DCB_API_BASE + '/admin/patrons/requests';
	}, []);

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<PatronRequest>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: '#',
				id: 'id',
				enableSorting: false
			}),
			columnHelper.accessor('patronId', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Patron Id',
				id: 'patronId' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('patronAgencyCode', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Patron Agency',
				id: 'patronAgency' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('bibClusterId', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'patronBibClusterId',
				id: 'bibClusterId'
			}),
			columnHelper.accessor('pickupLocationCode', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Pickup Location',
				id: 'pickupLocation' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('statusCode', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Status Code',
				id: 'statusCode' // Used as the unique property in the sorting state (See React-Query dev tools)
			})
		];
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<PatronRequest>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'patrons',
		url: url,
		externalState
	});

	return (
		<AdminLayout>
			<Card>
				<Card.Header>Requests</Card.Header>
				<Card.Body>
					{resourceFetchStatus === 'loading' && (
						<p className='text-center mb-0'>Loading requests.....</p>
					)}

					{resourceFetchStatus === 'error' && (
						<p className='text-center mb-0'>Failed to fetch patron requests </p>
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

	// Defaults to sorting the patronId in ascending order (The id must be the same the id assigned to the "column")
	let sort: SortingState = [{ id: 'patronId', desc: false }];

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

export default PatronRequests;
