import * as React from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';

import {Card, CardContent, Paper, Typography} from '@mui/material';
import Alert from '@components/Alert/Alert';
import { AdminLayout } from '@layout';
import { useResource } from '@hooks';
import { PaginationState, SortingState } from '@tanstack/react-table';

//localisation
import { useTranslation } from 'next-i18next';

import { Location } from '@models/Location';
import { DataGrid } from '@components/DataGrid';

// import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const Locations: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
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

	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();

	// Generate the url for the useResource hook
	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/locations';
	}, []);

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

	const { t } = useTranslation();

	return (
		<AdminLayout>
			<Paper elevation={16}>
			<Card>
				<CardContent>
						{resourceFetchStatus === 'loading' && (
								<Typography variant = 'body1' className='text-center mb-0'>{t("locations.loading_msg", "Loading locations....")}</Typography>)}

							{resourceFetchStatus === 'error' && (
								<Alert severityType='error' onCloseFunc={() => {}} alertText={t("locations.alert_text", "Failed to fetch the locations, please refresh the page.")}/>)}
							{resourceFetchStatus === 'success' && (
								<>
									<DataGrid
										data={resource?.content ?? []}
										columns={[ {field: 'name', headerName: "Location name", minWidth: 150, flex: 1}, { field: 'id', headerName: "Location ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "Location code", minWidth: 50, flex: 0.5}]}	
										type="Location"
										selectable={true}
										noDataTitle={"No locations found."}
										noDataMessage={"Try changing your filters or search terms."}
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
