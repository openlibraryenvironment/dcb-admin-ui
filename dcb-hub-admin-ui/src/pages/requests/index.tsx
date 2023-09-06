import * as React from 'react';
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import getConfig from 'next/config';
import { useSession, signIn } from 'next-auth/react';

import { Button, Card } from 'react-bootstrap';
import { AdminLayout } from '@layout';
import Details from '@components/Details/Details';
import { useResource } from '@hooks';
import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table';
import { PatronRequest } from '@models/PatronRequest';
import { Table } from '@components/Table';

import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const PatronRequests: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
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

	// Generate the url for the useResource hook
	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/admin/patrons/requests';
	}, []);

	//automatic sign out after 15 minutes
	SignOutIfInactive();

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<PatronRequest>();
		// onClick will produce the modal
		// but we need to get the correct data first!
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
			columnHelper.accessor('patronId', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Patron Id',
				id: 'patronId' // Used as the unique property in the sorting state (See React-Query dev tools)
				// Revert back to patron.id for the accessor if we have any issues here. Need to fix the associated TS error
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
			// @ts-ignore: TypeScript doesn't like the below accessor, but it's the only one that works with the pre-existing table implementation
			// to get the info we need.
			columnHelper.accessor('localRequestStatus', {
				// @ts-ignore: Will be reviewed when table implementation is reviewed in DCB-231
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Status Code',
				id: 'statusCode' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			// @ts-ignore: Unfortunately this way of accessing table data has to stay until we re-work table implementation.
			// TypeScript understandably hates it.
			// When table implementation is reviewed, this will be too.
			columnHelper.accessor('description', {
				// @ts-ignore: Unfortunately this way of accessing table data has to stay until we re-work table implementation.
				// TypeScript understandably hates it.
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Description',
				id: 'description' // Used as the unique property in the sorting state (See React-Query dev tools)
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

	useEffect(() => {
		if (data?.error === 'RefreshAccessTokenError') {
			signIn('keycloak', {
				callbackUrl: process.env.REDIRECT_REQUESTS!
			}); // Force sign in to hopefully resolve error
		}
		
	  }, [data]);
	return (
		<AdminLayout>
			<div>
				<Card>
					<Card.Header>Requests</Card.Header>
					<Card.Body>
						{resourceFetchStatus === 'loading' && (
							<p className='text-center mb-0'>Loading requests.....</p>
						)}

					{resourceFetchStatus === 'error' && (
						<p className='text-center mb-0'>Failed to fetch patron requests, reloading page </p>
					) }

					{resourceFetchStatus === 'success' && (
						<>
							<Table
								data={resource?.content ?? []}
								columns={columns}
								type="Requests"
							/>
						</>
					)}

				</Card.Body>
			</Card>
			</div>
		    <div>
	{ showDetails ? <Details i={idClicked} content = {resource?.content ?? []} show={showDetails}  onClose={closeDetails} type={"Request"} /> : null }
    		</div>
		</AdminLayout>
	);
	// conditional rendering to only show details when clicked on.
	// Request data passed down through the content prop, along with the associated id as the i prop.
	// This means we can find what we need in the array in Details.tsx and display only the relevant information for a given request.
	// We also pass down type to indicate that we need the 'Request' details only.
};

// details will need to be shown differently for each entry
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
