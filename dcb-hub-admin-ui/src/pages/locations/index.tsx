import * as React from 'react';
import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';

import { Button, Card } from 'react-bootstrap';
import { AdminLayout } from '@layout';
import Details from '@components/Details/Details';

import { useResource } from '@hooks';
import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table';

import { Location } from '@models/Location';
import { Table } from '@components/Table';

import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const Locations: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();
	const [showDetails, setShowDetails] = useState(false);
	const [idClicked, setIdClicked] = useState(42);

	const openDetails = ({ id }: { id: number }) => {
		setShowDetails(true);
		setIdClicked(id);
	};
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

	//automatic sign out after 15 minutes
	SignOutIfInactive();

	// Generate the url for the useResource hook
	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/locations';
	}, []);

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<Location>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => (
					<Button variant='link' type='button' onClick={() => openDetails({ id: info.getValue() })}>
						{info.getValue()}
					</Button>
				),
				header: '#',
				id: 'id',
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

	// MUST KEEP COLUMNS FOR DETAILS PAGE TO WORK AS THAT'S WHERE ONCLICK IS
	// If we change onClick, that can be altered.

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
							<Table
								data={resource?.content ?? []}
								columns={columns}
								type="Locations"
							/>
						</>
					)}
				</Card.Body>
			</Card>
			<div>
				{showDetails ? (
					<Details
						i={idClicked}
						content={resource?.content ?? []}
						show={showDetails}
						onClose={closeDetails}
						type={'Location'}
					/>
				) : null}
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
