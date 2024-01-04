import { useMemo, useState } from 'react';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import getConfig from 'next/config';
import { useSession } from 'next-auth/react';

import { Button, Card, CardContent, Typography } from '@mui/material';
import Alert from '@components/Alert/Alert';
import { AdminLayout } from '@layout';
import { DataGrid } from '@components/DataGrid';
import { useResource } from '@hooks';
//localisation
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { Agency } from '@models/Agency';
import AddAgenciesToGroup from './AddAgenciesToGroup';
import { loadAgencies } from 'src/queries/queries';

// import SignOutIfInactive from '../useAutoSignout';

const Agencies: NextPage = () => {
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

	const url = useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/graphql';
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
	} = useResource<Agency>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'agencies',
		url: url,
		type: 'GraphQL',
		graphQLQuery: loadAgencies,
		graphQLVariables: {}
	});

	// A hopefully temporary fix to get around some TS issues that occur when accessing the data directly.
	const rows:any = resource?.content;
	const agenciesData = rows?.agencies?.content;


	const { t } = useTranslation();

	return (
		<AdminLayout title={t("sidebar.agency_button")}>
					{resourceFetchStatus === 'loading' && (
						<Typography variant='body1' className='text-center mb-0'>{t("agencies.loading_msg")}.</Typography>
					)}

					{resourceFetchStatus === 'error' && (
						<Alert severityType='error' onCloseFunc={() => {}} alertText="Failed to fetch the agencies, please refresh the page"/>
					)}

					{resourceFetchStatus === 'success' && (
						<>
							<div>
							<Button variant = 'contained' onClick={openAddToGroup} > {t("agencies.add_to_group")}</Button>
							<DataGrid
								data={agenciesData ?? []}
								columns={[ {field: 'name', headerName: "Agency name", minWidth: 150, flex: 0.5}, { field: 'id', headerName: "Agency ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "Agency code", minWidth: 50, flex: 0.5}]}	
								type = "Agency"
								selectable= {true}
								noDataTitle={"No agencies found."}
								noDataMessage={"Try changing your filters or search terms."}
							/>
							</div>						
							{/* The slots prop allows for further customisation. We can choose whether to do this in the DataGrid based on type, or here. */}
						</>
					)}
			<div>
	        { addToGroup ? <AddAgenciesToGroup show={addToGroup} onClose={closeAddToGroup} /> : null}
    		</div>
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
			...translations,
		}
	};
};

export default Agencies;
