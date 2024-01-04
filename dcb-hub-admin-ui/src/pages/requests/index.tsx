import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import getConfig from 'next/config';
import { useSession } from 'next-auth/react';

import { Card, CardContent, Typography } from '@mui/material';
import Alert from '@components/Alert/Alert';
import { AdminLayout } from '@layout';
import { useResource } from '@hooks';
import { PatronRequest } from '@models/PatronRequest';
import { DataGrid } from '@components/DataGrid';
//localisation
import { useTranslation } from 'next-i18next';
import { loadPatronRequests } from 'src/queries/queries';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// import SignOutIfInactive from '../useAutoSignout';

const PatronRequests: NextPage = () => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

	// Generate the url for the useResource hook
	const url = useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/graphql';
	}, []);

	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();

	const {
		resource,
		status: resourceFetchStatus,
	} = useResource<PatronRequest>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'patrons',
		url: url,
		type: 'GraphQL',
		graphQLQuery: loadPatronRequests,
		graphQLVariables: {}
	});

	const { t } = useTranslation();
	const rows:any = resource?.content;
	const patronRequestData = rows?.patronRequests?.content;

	return (
		<AdminLayout title={t("sidebar.patron_request_button")}>
			{resourceFetchStatus === 'loading' && (
					<Typography variant='body1' className='text-center mb-0'>{t("requests.loading_msg")}</Typography>
			)}
			{resourceFetchStatus === 'error' && (
				<Alert severityType='error' onCloseFunc={() => {}} alertText={t("requests.alert_text")}/>
							)}
							{resourceFetchStatus === 'success' && (
								<>
									<DataGrid
										data={patronRequestData ?? []}
										columns={[ {field: 'dateUpdated', headerName: "Request updated", minWidth: 75, flex: 0.3, valueGetter: (params: { row: { dateUpdated: any; }; }) => {
											const requestUpdated = params.row.dateUpdated;
											return dayjs(requestUpdated).format('YYYY-MM-DD HH:mm');}},
											{field: 'id', headerName: "Request ID", minWidth: 100, flex: 0.5}, 
											{field: 'patron', headerName: "Patron ID", minWidth: 100, flex: 0.5, valueGetter: (params: { row: { patron: { id: any; }; }; }) => params.row.patron.id}, 
											{field: 'localBarcode', headerName: "Patron barcode", minWidth: 50, flex: 0.3, valueGetter: (params: { row: { requestingIdentity: { localBarcode: any; }; }; }) => params?.row?.requestingIdentity?.localBarcode},
											{field: 'description', headerName: "Description", minWidth: 100, flex: 0.5},
											// HIDDEN BY DEFAULT
											{field: 'suppliers', headerName: "Requesting agency", minWidth: 50, flex: 0.5,  valueGetter: (params: { row: { suppliers: Array<{ localAgency: any }> } }) => {
												// Check if suppliers array is not empty
												if (params.row.suppliers.length > 0) {
												  return params.row.suppliers[0].localAgency;
												} else {
												  return ''; // This allows us to handle the array being empty, and any related type errors.
												}
											  }},
										{field: 'pickupLocationCode', headerName: "Pickup location", minWidth: 50, flex: 0.5}]}
										type="Request"
										selectable={true}
										// This is how to pass in 'not found' messages for empty grids.
										noDataTitle={"No requests found."}
										noDataMessage={"Try changing your filters or search terms."}
										// This is how to set certain columns as hidden by default
										columnVisibilityModel={{suppliers: false, pickupLocationCode: false}}
										// This is how to set the default sort order - so the grid loads as sorted by 'lastUpdated' by default.
										sortModel={[{field: 'dateUpdated', sort: 'desc'}]}
									/>
								</>
							)}
		</AdminLayout>
	);
};


export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}

	// NOTE: If you really want to prefetch data and as long as you return the data you can then pass it to TanStack query to pre-populate the current cache key to prevent it refetching the data

	return {
		props: {
			...translations,
		}
	};
};

export default PatronRequests;
