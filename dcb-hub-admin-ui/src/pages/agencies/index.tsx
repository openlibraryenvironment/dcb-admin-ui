import * as React from 'react';
import { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import getConfig from 'next/config';
import { useSession } from 'next-auth/react';

import { Button, Card, CardContent, Typography } from '@mui/material';
import Alert from '@components/Alert/Alert';
import { AdminLayout } from '@layout';
import { DataGrid } from '@components/DataGrid';
import { useResource } from '@hooks';
import { PaginationState, SortingState } from '@tanstack/react-table';

import { Agency } from '@models/Agency';
import AddAgenciesToGroup from './AddAgenciesToGroup';

// import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const Agencies: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();
	// State management variables for the AddAgenciesToGroup modal.
	const [addToGroup, setAddToGroup] = useState(false);

	const openAddToGroup = () => {
		setAddToGroup(true);
	}
	const closeAddToGroup = () => {
		setAddToGroup(false);
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
				<CardContent>
					{resourceFetchStatus === 'loading' && (
						<Typography variant='body1' className='text-center mb-0'>Loading agencies.....</Typography>
					)}

					{resourceFetchStatus === 'error' && (
						<Alert severityType='error' onCloseFunc={() => {}} alertText="Failed to fetch the agencies, please refresh the page"/>
					)}

					{resourceFetchStatus === 'success' && (
						<>
							<Button variant = 'contained' onClick={openAddToGroup} > Add Agencies to Group</Button>
							<DataGrid
								data={resource?.content ?? []}
								columns={[ {field: 'name', headerName: "Agency name", minWidth: 150, flex: 1}, { field: 'id', headerName: "Agency ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "Agency code", minWidth: 50, flex: 0.5}]}	
								type = "Agency"
								selectable= {true}
							/>
							{/* slots allows for further customisation. We can choose whether to do this in the DataGrid based on type, or here. */}
						</>
					)}
				</CardContent>
			</Card>
			<div>
	        { addToGroup ? <AddAgenciesToGroup show={addToGroup} onClose={closeAddToGroup} /> : null}
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
