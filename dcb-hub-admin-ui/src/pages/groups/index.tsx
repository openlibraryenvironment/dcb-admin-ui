import { PaginationState, SortingState } from '@tanstack/react-table'
import * as React from 'react';
import { useState } from 'react';
import { Group } from '@models/Group';
import { AdminLayout } from '@layout';
import { getSession, useSession } from 'next-auth/react';
import getConfig from 'next/config';
import { Button, Card, CardContent, Paper, Typography } from '@mui/material';
import Alert from '@components/Alert/Alert';
import NewGroup from './NewGroup';
import { dehydrate, QueryClient, useQueryClient, useQuery } from '@tanstack/react-query'
import { groupsQueryDocument } from 'src/queries/queries';
import { useResource } from '@hooks';
import { GetServerSideProps, NextPage } from 'next';
import { DataGrid } from '@components/DataGrid';
//localisation
import { useTranslation } from 'react-i18next';
// import SignOutIfInactive from '../useAutoSignout';

// Groups Feature Page Structure
// This page shows the list of groups
// New Group is the (modal) form to add a group
// View Group will be a Details page with type 'Group'
// In /agencies, there is the Add Agencies to Group form.
// Our GraphQL client decision is still under review, as it's glitchy.

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const Groups: NextPage<Props> = ({ page, resultsPerPage, sort}) => {

	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();
	const queryClient = useQueryClient();
	const queryVariables = {};
	const { data: session, status } = useSession();
	const [showNewGroup, setShowNewGroup] = useState(false);

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
		return publicRuntimeConfig.DCB_API_BASE + '/graphql';
	}, []);

	const openNewGroup = () =>
	{
		setShowNewGroup(true);
	}
	const closeNewGroup = () => {
		setShowNewGroup(false);
		queryClient.invalidateQueries();
		// forces the query to refresh once a new group is added	
		// needs to be adapted to work with SSR approach so that the grid always updates correctly on new group creation	
	};


	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<Group>({
		isQueryEnabled: status === 'authenticated',
		accessToken: session?.accessToken ?? null,
		refreshToken: session?.refreshToken ?? null,
		baseQueryKey: 'groups',
		url: url,
		defaultValues: externalState,
		type: 'GraphQL',
		graphQLQuery: groupsQueryDocument,
		graphQLVariables: queryVariables
	});

	const { t } = useTranslation();

	return (
		<AdminLayout>
				<Paper elevation={16}>
				<Card>
					<CardContent>
					{resourceFetchStatus === 'loading' && (
						<Typography variant='body1' className='text-center mb-0'>{t("groups.loading_msg")}</Typography>
					)}

					{resourceFetchStatus === 'error' && (
						<div>
							<Alert severityType="error" onCloseFunc={() => {}} alertText = {t("groups.alert_text")}/>
						</div>
					)}

					{resourceFetchStatus === 'success' && (
						<>
							<div>
								<Button variant="contained" onClick={openNewGroup} > {t("groups.type_new")}</Button>
								<DataGrid
								data={resource?.content ?? []}
								columns={[ {field: 'name', headerName: "Group name", minWidth: 150, flex: 1}, { field: 'id', headerName: "Group ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "Group code", minWidth: 50, flex: 0.5}]}	
								type = "Group"
								selectable= {true}
								/>
							</div>						
						</>
					)}
					</CardContent>
				</Card>
				</Paper>
			<div>
			{ showNewGroup ? <NewGroup show={showNewGroup}  onClose={closeNewGroup}/> : null }
    		</div>
		</AdminLayout>
	);
}



//  Fixing this should fix our weird data fetching issues
// 	Step One: verify SSR works
// 	Step Two: verify Server-Side Pagination works
  
  export const getServerSideProps: GetServerSideProps<Props> = async (context) => {

	const session = await getSession(context);
	const accessToken = session?.accessToken;
	// await queryClient.prefetchQuery(['groups'], useResource)

	// this will be wired in properly when server-side pagination is fully integrated (i.e. both GraphQL and REST)
	// the intention is that a page change will trigger a refetch / query, as will new group creation
	// const queryVariables = {};
	// const headers = {
	// 	Authorization: `Bearer ${accessToken}`, // Use the updated access token
	// 	'Content-Type': 'application/json', // You can adjust the content type as needed
	// };

	// const loadGroups = () => request(url, groupsQueryDocument, queryVariables, headers);

	// await queryClient.prefetchQuery(['groups'], loadGroups);


	let page = 1;
	if (context.query?.page && typeof context.query.page === 'string') {
		page = parseInt(context.query.page, 10);
	}

	let resultsPerPage = 20;
	if (context.query?.perPage && typeof context.query.perPage === 'string') {
		resultsPerPage = parseInt(context.query.perPage.toString(), 10);
	}

	// const serverSideResource = useResource<Group>({
	// 	isQueryEnabled: true, // Ensure the query is enabled for SSR
	// 	baseQueryKey: 'groups',
	// 	// Add other options as needed
	//   });

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
			sort: sort,
			// dehydratedState: dehydrate(queryClient),
		}
	};	
  };

export default Groups;
