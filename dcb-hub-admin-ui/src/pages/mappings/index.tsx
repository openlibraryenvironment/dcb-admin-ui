import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Paper, CardContent, Card, Typography, CardHeader, Button, capitalize} from '@mui/material';
import { DataGrid } from '@components/DataGrid';
import { useResource } from '@hooks';
import { Mapping } from '@models/Mapping';
import { useSession } from 'next-auth/react';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import getConfig from 'next/config';

//localisation
import { useTranslation } from 'next-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Import from '@components/Import/Import';
import Alert from '@components/Alert/Alert'
import dayjs from 'dayjs';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

// Page for 'ALL' referenceValueMappings - includes CirculationStatus, ShelvingLocation, etc.

const AllMappings: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
		// Access the accessToken for running authenticated requests
	const { data, status } = useSession();
	const queryClient = useQueryClient();
	const [showImport, setImport] = useState(false);
	const openImport = () =>
	{
		setImport(true);
	}
	const closeImport = () => {
		setImport(false);
		queryClient.invalidateQueries();
	};

	// Formats the data from getServerSideProps into the appropriate format for the useResource hook (Query key) and the TanStackTable component
	const externalState = useMemo<{ pagination: PaginationState; sort: SortingState }>(
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
	const url = useMemo(() => {
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
		baseQueryKey: 'allMappings',
		url: url,
		defaultValues: externalState
	});

	const { t } = useTranslation();

	return (
		<AdminLayout>
			<Paper elevation={16}>
				<Card>
					{/* // style this to be more in line with wireframes */}
					<CardHeader title={<Typography variant = "h5"> {t("settings.mappings")}</Typography>}/>                    
					<CardContent>
							{resourceFetchStatus === 'loading' && (
								<Typography variant='body1' className='text-center mb-0'>{t("mappings.loading_msg")}</Typography>
							)}

							{resourceFetchStatus === 'error' && (
								<Alert severityType='error' onCloseFunc={() => {}} alertText={t("mappings.alert_text")}/>
							)}

							{resourceFetchStatus === 'success' && (
								<>
									<Button variant="contained" onClick={openImport} > {t("mappings.import")}</Button>
									<DataGrid
										data={resource?.content ?? []}
										columns={[{field: 'fromCategory', headerName: "Category", minWidth: 50, flex: 0.5},
												{field: 'fromContext', headerName: "HostLMS", minWidth: 50, flex: 0.5},
												{field: 'fromValue', headerName: "Local Value", minWidth: 50, flex: 0.4}, 
												{field: 'label', headerName: "Meaning", minWidth: 50, flex: 0.5},
												{field: 'toValue', headerName: "DCB value", minWidth: 50, flex: 0.5,
												valueGetter: (params: { row: { toValue: any; }; }) => {
													return capitalize(params.row.toValue);
												}},	 
												{field: 'last_imported', headerName: "Last imported", minWidth: 100, flex: 0.5, 							
													valueGetter: (params: { row: { lastImported: any; }; }) => {
													const lastImported = params.row.lastImported;
													return dayjs(lastImported).format('YYYY-MM-DD HH:mm');
												}}]}		
										type="All Mappings"
										noDataLink={"#"}
										noDataMessage={t("mappings.import_circulation_status")}
										noDataTitle={t("mappings.no_results")}
										selectable={false}
										sortModel={[{field: 'lastImported', sort: 'desc'}]}
									/>
								</>
							)}
				    </CardContent>
				</Card>
			</Paper>
			<div>
			{ showImport ? <Import show={showImport}  onClose={closeImport}/> : null }
    		</div>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}


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
			...translations,
			page,
			resultsPerPage,
			sort: sort
		}
	};
};

export default AllMappings;