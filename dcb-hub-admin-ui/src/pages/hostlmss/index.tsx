import * as React from 'react';
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { signIn, useSession } from 'next-auth/react';
import getConfig from 'next/config';

import { Button, Card } from 'react-bootstrap';
import { AdminLayout } from '@layout';
import { Pagination } from '@components/Pagination';
import TanStackTable from '@components/TanStackTable';
import Details from '@components/Details/Details';

import { useResource } from '@hooks';
import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table';

import { HostLMS } from '@models/HostLMS';

import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

/*

******************************************************
Client-Side actions and Server-Side actions:
******************************************************

By default this page will leaverage the built in NextJS getServerSideProps function, whenever a link within the page is clicked
and it links to the same page it will re-run. Whenever it re-runs the props injected into the page are updated, so we can pass
these to React-Query to trigger a re-query as the cache key will have changed.

******************************************************
Pagination component with client-side actions:
******************************************************

- Updated the "perPage" prop to read the "pageSize" property from the externalState object (Contains the pagination and sorting state)

- Add the appropriate event handle to the "onChange" prop (See example below)

onChange={(data) => {
	switch (data.type) {
		case 'ITEMS_PER_PAGE_CHANGE': {
			dispatch({
				type: 'CHANGE_ITEMS_PER_PAGE',
				payload: {
					newNumberOfItemsPerPage: parseInt(data.payload.perPage, 10)
				}
			});
		}

		case 'PAGE_NUMBER_CHANGE': {
			dispatch({
				type: 'CHANGE_PAGE_NUMBER',
				payload: {
					newIncomingPageNumberState: data.payload.pageIndex
				}
			});
		}

		default:
			break;
	}
}}

******************************************************
useResource hook with client-side actions:
******************************************************

- Set "useClientSideSorting" prop to true

- Set "useClientSidePaging" to true

- Instead of using the "defaultValues" prop use "externalState" full object

- Add the "dispatch" property from useResource hook, this will be used to interact with the reducer

******************************************************
TanStackTable component with client-side actions:
******************************************************

- Set "enableClientSideSorting" prop to true

- Set the "paginationState" prop to read from the externalState.pagination

- Add the appropriate event handle to the "onSortingChange" prop (See example below)

onSortingChange={(updateOrNewValue) => {
	if (typeof updateOrNewValue === 'function') {
		// updateOrNewValue is an updater function which needs to be called so we need to check the
		const sort = updateOrNewValue(state.sort);

		dispatch({
			type: 'CHANGE_SORT',
			payload: {
				newIncomingSortState: sort
			}
		});
	}
}}

Best part is you can mix and match the above approaches, so if you were to extend this for filtering (Filtering cant always be stored in the url) you could then
update useResource and TanStackTable to incorporate the filtering functionality (Exactly like sorting and paging).

NOTE: This applies to all pages, not just /hostlmss page, the hooks and components are very reusable so any resource can use them.

*/

const HostLmss: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	//automatic sign out after 15 minutes
	SignOutIfInactive();

	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

	const [showDetails, setShowDetails] = useState(false);
	const [idClicked, setIdClicked] = useState('');

	const openDetails = ({ id }: { id: string }) => {
		setShowDetails(true);
		setIdClicked(id);
	};
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

	// Generate the url for the useResource hook
	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/hostlmss';
	}, []);

	// const [popoutState, setPopoutState] = React.useState<{
	// 	show: boolean;
	// 	information: HostLMS | null;
	// }>({
	// 	show: false,
	// 	information: null
	// });

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<HostLMS>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => (
					<Button variant='link' type='button' onClick={() => openDetails({ id: info.getValue() })}>
						{info.getValue()}
					</Button>
				),
				header: 'Id',
				id: 'requestId',
				enableSorting: false
			}),
			columnHelper.accessor('code', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Code',
				id: 'requestCode' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('name', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Name',
				id: 'requestName' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('lmsClientClass', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'IMS Client Class',
				id: 'requestLmsClientClass' // Used as the unique property in the sorting state (See React-Query dev tools)
			})
		];
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
			<Card>
				<Card.Header>HostLMS</Card.Header>
				<Card.Body>
					{resourceFetchStatus === 'loading' && (
						<p className='text-center mb-0'>Loading requests.....</p>
					)}

					{resourceFetchStatus === 'error' && (
						<p className='text-center mb-0'>Failed to fetch the requests, will retry</p>
					)}

					{resourceFetchStatus === 'success' && (
						<>
							<Pagination
								from={resource?.meta?.from ?? 0}
								to={resource?.meta?.to ?? 0}
								total={resource?.meta?.total ?? 0}
								pageIndex={externalState.pagination.pageIndex}
								totalNumberOfPages={state.totalNumberOfPages}
								perPage={state.pagination.pageSize}
							/>

							<TanStackTable
								data={resource?.content ?? []}
								columns={columns}
								pageCount={state.totalNumberOfPages}
								enableTableSorting
								sortingState={state.sort}
								paginationState={state.pagination}
							/>

							{/* <HostLMSListPopout
								show={popoutState.show}
								onClick={() => {
									setPopoutState((prevState) => ({
										...prevState,

										// Reset the information back to null as were closing the dialog
										information: null,

										// Hide the popup content
										show: false
									}));
								}}
								content={popoutState.information}
							/> */}
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
						type={'HostLMS'}
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
