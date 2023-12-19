import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';
import {Card, CardContent, Paper, Typography} from '@mui/material';
import Alert from '@components/Alert/Alert';
import { AdminLayout } from '@layout';
import { useResource } from '@hooks';

//localisation
import { useTranslation } from 'next-i18next';

import { Location } from '@models/Location';
import { DataGrid } from '@components/DataGrid';
import { loadLocations } from 'src/queries/queries';
import { useMemo } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// import SignOutIfInactive from '../useAutoSignout';

const Locations: NextPage = () => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();

	// Generate the url for the useResource hook
	// To be replaced with server-side pagination in DCB-488: Load in the 
	const url = useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/graphql';
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
	} = useResource<Location>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'locations',
		url: url,
		type: 'GraphQL',
		graphQLQuery: loadLocations,
		graphQLVariables: {}
	});

	const { t } = useTranslation();
	const rows:any = resource?.content;
	const locationsData = rows?.locations?.content;

	return (
		<AdminLayout>
			<Paper elevation={16}>
			<Card>
				<CardContent>
						{resourceFetchStatus === 'loading' && (
								<Typography variant = 'body1' className='text-center mb-0'>{t("locations.loading_msg")}</Typography>)}

							{resourceFetchStatus === 'error' && (
								<Alert severityType='error' onCloseFunc={() => {}} alertText={t("locations.alert_text")}/>)}
							{resourceFetchStatus === 'success' && (
								<>
									<DataGrid
										data={locationsData ?? []}
										columns={[ {field: 'name', headerName: "Location name", minWidth: 150, flex: 0.6}, { field: 'id', headerName: "Location ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "Location code", minWidth: 50, flex: 0.5}]}	
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


export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}

	return {
		props: {
			...translations
		}
	};
};

export default Locations;
