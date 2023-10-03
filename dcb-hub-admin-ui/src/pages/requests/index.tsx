import * as React from 'react';
import { GetServerSideProps, NextPage } from 'next';
import getConfig from 'next/config';
import { useSession } from 'next-auth/react';

import { Alert, Card, CardContent, Paper, Typography } from '@mui/material';
import { AdminLayout } from '@layout';
import { useResource } from '@hooks';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { PatronRequest } from '@models/PatronRequest';
import { DataGrid } from '@components/DataGrid';

// import SignOutIfInactive from '../useAutoSignout';

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

	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// 	SignOutIfInactive();

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
			<div>
			<Paper elevation={16}>
			<Card>
				<CardContent>
						{resourceFetchStatus === 'loading' && (
								<Typography variant='body1' className='text-center mb-0'>Loading requests.....</Typography>
							)}

							{resourceFetchStatus === 'error' && (
								<Alert severity='error' onClose={() => {}}>Failed to fetch the requests, please refresh</Alert>
							)}

							{resourceFetchStatus === 'success' && (
								<>
									<DataGrid
										data={resource?.content ?? []}
										columns={[ {field: 'id', headerName: "Request ID", minWidth: 100, flex: 0.75}, { field: 'patronId', headerName: "Patron ID", minWidth: 100, flex: 0.5}, 
												   {field: 'patronAgencyCode', headerName: "Patron agency code", minWidth: 50, flex: 0.5}, {field: 'pickupLocation', headerName: "Pickup location", minWidth: 50, flex: 0.5},
												   {field: 'localRequestStatus', headerName: "Request status code", minWidth: 50, flex: 0.5 }]}	
										type="Request"
										selectable={true}
									/>
								</>
							)}
				</CardContent>
			</Card>
			</Paper>
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
