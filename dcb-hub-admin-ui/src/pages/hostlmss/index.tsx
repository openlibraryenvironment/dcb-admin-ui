import * as React from 'react';
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { signIn, useSession } from 'next-auth/react';
import getConfig from 'next/config';

import { Button, Card } from 'react-bootstrap';
import { AdminLayout } from '@layout';
import Details from '@components/Details/Details';

import { useResource } from '@hooks';
import { PaginationState, SortingState, createColumnHelper } from '@tanstack/react-table';

import { HostLMS } from '@models/HostLMS';
import { Table } from '@components/Table';

// import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const HostLmss: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	//automatic sign out after 15 minutes
	// SignOutIfInactive();

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
						<p className='text-center mb-0'>Loading HostLMS.....</p>
					)}

					{resourceFetchStatus === 'error' && (
						<p className='text-center mb-0'>Failed to fetch HostLMS, will retry. If this error persists, please refresh the page.</p>
					)}

					{resourceFetchStatus === 'success' && (
						<>			
							<Table
								data={resource?.content ?? []}
								columns={columns}
								type="HostLMS"
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
						type={'HostLMS'}
					/>
				) : null}
			</div>
		</AdminLayout>
	);
};

// This relates mainly to the previous non-functional server side pagination. 
// TO BE RESTORED WITH SERVER SIDE PAGINATION WHEN READY
// Current failures are SSR errors


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
