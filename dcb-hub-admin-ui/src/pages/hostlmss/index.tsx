import * as React from 'react';
import { useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { signIn, useSession } from 'next-auth/react';
import getConfig from 'next/config';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { AdminLayout } from '@layout';

import { useResource } from '@hooks';
import { PaginationState, SortingState } from '@tanstack/react-table';

import { HostLMS } from '@models/HostLMS';
import { DataGrid } from '@components/DataGrid';
import Paper from '@mui/material/Paper';
import { Alert, Typography } from '@mui/material';

// import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const HostLmss: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();

	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

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
		return publicRuntimeConfig.DCB_API_BASE + '/hostlmss';
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<HostLMS>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'hostlms',
		url: url,
		defaultValues: externalState
	});

	useEffect(() => {
		if (data?.error === 'RefreshAccessTokenError') {
			signIn('keycloak', {
				callbackUrl: process.env.REDIRECT_HOSTLMSS!
			}); // Force sign in to resolve error (DCB-241)
		}
	}, [data]);

	return (
		<AdminLayout>
			<Paper elevation={16}>
			<Card>
				<CardContent>
					{resourceFetchStatus === 'loading' && (
						<Typography variant='body1' className='text-center mb-0'>Loading HostLMS.....</Typography>
					)}

					{resourceFetchStatus === 'error' && (
						<Alert severity='error' onClose={() => {}} >Failed to fetch HostLMS, will retry. If this error persists, please refresh the page.</Alert>
					)}

					{resourceFetchStatus === 'success' && (
						<>			
							<DataGrid
								data={resource?.content ?? []}
								columns={[ {field: 'name', headerName: "HostLMS name", minWidth: 150, flex: 1}, { field: 'id', headerName: "HostLMS ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "HostLMS code", minWidth: 50, flex: 0.5}]}	
								type="HostLMS"
								selectable={true}
							/>
						</>
					)}
				</CardContent>
			</Card>
			</Paper>
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

	// Defaults to sorting the requestCode in ascending order (The id must be the same the id assigned to the "column")
	let sort: SortingState = [{ id: 'requestCode', desc: false }];

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

export default HostLmss;
