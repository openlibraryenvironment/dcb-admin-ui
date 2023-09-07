import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table'
import * as React from 'react';
import { useState } from 'react';
import { Group } from '@models/Group';
import { AdminLayout } from '@layout';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';
import { Alert, Button, Card } from 'react-bootstrap';
import NewGroup from './NewGroup';
import { Table } from '@components/Table';
import request, { GraphQLClient } from 'graphql-request';
import { useQuery, useQueryClient  } from '@tanstack/react-query';
import Details from '@components/Details/Details';
import { groupsQueryDocument } from 'src/queries/queries';
import { useResource } from '@hooks';
import { GetServerSideProps, NextPage } from 'next';
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

	// Automatic logout after 15 minutes for security purposes
	// SignOutIfInactive();
	const graphQLClient = new GraphQLClient('https://dcb-uat.sph.k-int.com/graphql');
	const queryClient = useQueryClient();
	const { data: session, status } = useSession();
	const [showNewGroup, setShowNewGroup] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const [idClicked, setIdClicked] = useState(42);

	const openNewGroup = ( {id} : {id: number}) =>
	{
		setShowNewGroup(true);
		setIdClicked(id);
	}
	const closeNewGroup = () => {
		setShowNewGroup(false);
		queryClient.invalidateQueries(['groups']);
		// forces the query to refresh once a new group is added	
		// needs to be adapted to work with SSR approach	
	};
	
	const openDetails = ( {id} : {id: number}) =>
	{
		setShowDetails(true);
		setIdClicked(id);
	}
	const closeDetails = () => {
		setShowDetails(false);
	};

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

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<Group>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => <Button
				variant='link'
				type='button'
				onClick={() => openDetails({ id: info.getValue() })}>
				{info.getValue()}
			</Button>,
				header: '#',
				id: 'id',
				enableSorting: true
			}),
			columnHelper.accessor('code', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Code',
				id: 'groupId'
			}),
			columnHelper.accessor('name', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Name',
				id: 'groupCode'
			}),
		];
	}, []);
	const queryVariables = {};

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

	return (
		<AdminLayout>
			<Card>
				<Card.Header>Groups</Card.Header>
				<Card.Body>
					{/* TODO: Could we style this nicely in the MUI upgrade? */}
					{resourceFetchStatus === 'loading' && (
						<p className='text-center mb-0'>Loading Groups.....</p>
					)}

					{resourceFetchStatus === 'error' && (
						<div>
							   <Alert variant="danger" dismissible>
							   Failed to fetch Groups, will retry. If this error persists, please refresh the page.
							</Alert> 
						</div>
					)}

					{resourceFetchStatus === 'success' && (
						<>	
						<Table
							data={resource?.content ?? []}
							columns={columns}
							type = "Groups"
						/>
						<Button onClick={() => openNewGroup({ id: 42 })} > New Group</Button>
						</>
					)}
				</Card.Body>
			</Card>
			<div>
			{ showNewGroup ? <NewGroup show={showNewGroup}  onClose={closeNewGroup}/> : null }
			{ showDetails ? <Details i={idClicked} content = {resource?.content ?? []} show={showDetails}  onClose={closeDetails} type={"Group"} /> : null }
    		</div>
		</AdminLayout>
	);
}

//   SERVER SIDE PROPS COMMENTED OUT FOR TESTING PURPOSES


//   Fixing this should fix our weird data fetching issues
  
  export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
	// this will be wired in properly when server-side pagination is fully integrated (i.e. both GraphQL and REST)
	// the intention is that a page change will trigger a refetch / query, as will new group creation

	let page = 1;
	if (context.query?.page && typeof context.query.page === 'string') {
		page = parseInt(context.query.page, 10);
	}

	let resultsPerPage = 20;
	if (context.query?.perPage && typeof context.query.perPage === 'string') {
		resultsPerPage = parseInt(context.query.perPage.toString(), 10);
	}
	// const queryVariables = {};
	// const url = "https://dcb-uat.sph.k-int.com/graphql";
	// const headers = {
	// 	Authorization: `Bearer ${accessToken}`, // Use the updated access token
	// 	'Content-Type': 'application/json', // You can adjust the content type as needed
	// };


	// const loadGroups = () => request(url, groupsQueryDocument, queryVariables, headers);
	

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
		}
	};	
  };

  export default Groups;
