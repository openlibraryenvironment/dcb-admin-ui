import * as React from 'react';
import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import getConfig from 'next/config';
import { useSession } from 'next-auth/react';

import { Button, Card } from 'react-bootstrap';
import { AdminLayout } from '@layout';
import Details from '@components/Details/Details';

import { useResource } from '@hooks';
import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table';

import { Agency } from '@models/Agency';
import { Table } from '@components/Table';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const Agencies: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();
	const [showDetails, setShowDetails] = useState(false);
	const [idClicked, setIdClicked] = useState(42);

	const openDetails = ( {id} : {id: number}) =>
	{
		setShowDetails(true);
		setIdClicked(id);
	}
	const closeDetails = () => {
		setShowDetails(false);
	};
	

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

	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/agencies';
	}, []);

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<Agency>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => <Button
				variant='link'
				type='button'
				onClick={() => openDetails({ id: info.getValue() })}			>
				{info.getValue()}
			</Button>,				header: '#',
				id: 'id',
				enableSorting: false
			}),
			columnHelper.accessor('code', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Code',
				id: 'agencyId' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('name', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Name',
				id: 'agencyCode' // Used as the unique property in the sorting state (See React-Query dev tools)
			})
		];
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<Agency>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'agencies',
		url: url,
		externalState
	});

	return (
		<AdminLayout>
			<Card>
				<Card.Header>Agencies</Card.Header>
				<Card.Body>
					{resourceFetchStatus === 'loading' && (
						<p className='text-center mb-0'>Loading agencies.....</p>
					)}

					{resourceFetchStatus === 'error' && (
						<p className='text-center mb-0'>Failed to fetch the agencies</p>
					)}

					{resourceFetchStatus === 'success' && (
						<>
							<Table
								data={resource?.content ?? []}
								columns={columns}
								type = "Agencies"
							/>
						</>
					)}
				</Card.Body>
			</Card>
			<div>
	{ showDetails ? <Details i={idClicked} content = {resource?.content ?? []} show={showDetails}  onClose={closeDetails} type={"Agency"} /> : null }
    		</div>
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

	// Defaults to sorting the agencyId in ascending order (The id must be the same the id assigned to the "column")
	let sort: SortingState = [{ id: 'agencyId', desc: false }];

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

export default Agencies;
