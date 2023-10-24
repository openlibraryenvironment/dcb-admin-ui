import { GetServerSideProps, NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Card, Typography, Alert, CardHeader} from '@mui/material';
import { DataGrid } from '@components/DataGrid';
import { useResource } from '@hooks';
import { Mapping } from '@models/Mapping';
import { useSession } from 'next-auth/react';
import { PaginationState, SortingState } from '@tanstack/react-table';
import React from 'react';
import getConfig from 'next/config';

//localisation
import { useTranslation } from 'next-i18next';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const Mappings: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
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
		return publicRuntimeConfig.DCB_API_BASE + '/referenceValueMappings';
	}, []);


	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<Mapping>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'referenceValueMappings',
		url: url,
		defaultValues: externalState
	});

	const { t } = useTranslation();

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					{/* // style this to be more in line with wireframes */}
					<CardHeader title={<Typography variant = "h5"> {t("settings.circulation_status", "Item circulation status mappings")}</Typography>}/>                    <CardContent>
                            {/* Tabs? May also need custom toolbar.
							If empty, needs to show link to import mappings */}

						    {/* {resourceFetchStatus === 'loading' && (
								<Typography variant = 'body1' className='text-center mb-0'>Loading locations.....</Typography>
							)}

							{resourceFetchStatus === 'error' && (
								<Alert severity='error' onClose={() => {}}>Failed to fetch the locations, please refresh the page.</Alert>
							)} */}

							{/* {resourceFetchStatus === 'success' && (
								<> */}
							{resourceFetchStatus === 'loading' && (
								<Typography variant='body1' className='text-center mb-0'>{t("mappings.loading_msg", "Loading mappings...")}</Typography>
							)}

							{resourceFetchStatus === 'error' && (
								<Alert severity='error' onClose={() => {}}>{t("mappings.alert_text", "Failed to fetch the mappings, please refresh the page.")}</Alert>
							)}

							{resourceFetchStatus === 'success' && (
								<>
									<DataGrid
										data={resource?.content ?? []}
										// columns={[ {field: 'hostlms', headerName: "Host LMS", minWidth: 50, flex: 0.5}, 
                                        //            {field: 'localValue', headerName: "Local Value", minWidth: 50, flex: 0.5}, 
                                        //            {field: 'meaning', headerName: "Meaning", minWidth: 50, flex: 0.5}, 
                                        //            {field: 'dcbValue', headerName: "DCB Value", minWidth: 50, flex: 0.5}, 
                                        //            {field: 'lastImported', headerName: "Last imported", minWidth: 100, flex: 0.5}]}
										columns={[{field: 'fromCategory', headerName: "Category", minWidth: 50, flex: 0.5},
												{field: 'fromContext', headerName: "HostLMS", minWidth: 50, flex: 0.5},
												// {field: 'toContext', headerName: "Context To", minWidth: 50, flex: 0.5}, 
												// {field: 'toCategory', headerName: "Category To", minWidth: 50, flex: 0.5},
												{field: 'fromValue', headerName: "Local Value", minWidth: 50, flex: 0.5}, 
												{field: 'meaning', headerName: "Meaning", minWidth: 50, flex: 0.5},
												{field: 'toValue', headerName: "DCB Value", minWidth: 50, flex: 0.5}, 
												{field: 'lastImported', headerName: "Last imported", minWidth: 100, flex: 0.5}]}		
										type="Circulation Status Mappings"
										noDataLink={"#"}
										noDataMessage={t("mappings.import_circulation_status", "Import circulation status mappings for a Host LMS")}
										noDataTitle={t("mappings.no_results", "No results found")}
										selectable={false}
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

export default Mappings;