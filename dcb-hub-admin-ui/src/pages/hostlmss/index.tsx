import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';
import { useMemo } from 'react';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { AdminLayout } from '@layout';

import { useResource } from '@hooks';
import { PaginationState, SortingState } from '@tanstack/react-table';

import { HostLMS } from '@models/HostLMS';
import { DataGrid } from '@components/DataGrid';
import { Typography } from '@mui/material';
//localisation
import { useTranslation } from 'next-i18next';
import Alert from '@components/Alert/Alert';
import { loadHostlms } from 'src/queries/queries';
import { HostLmsPage } from '@models/HostLMSPage';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// import SignOutIfInactive from '../useAutoSignout';

type Props = {
	page: number;
	resultsPerPage: number;
	sort: SortingState;
};

const HostLmss: NextPage<Props> = ({ page, resultsPerPage, sort }) => {
	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();

	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

	const queryVariables = {};

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
		return publicRuntimeConfig.DCB_API_BASE + '/graphql';
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<HostLmsPage>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'hostlms',
		url: url,
		defaultValues: externalState,
		type: 'GraphQL',
		graphQLQuery: loadHostlms,
		graphQLVariables: queryVariables
	});

	const { t } = useTranslation();
	// Fix weird typing errors that cause this to fail, and find a nicer solution to these TS issues
	// console.log(resource?.content?.hostLms?.content);
	const rows:any = resource?.content;
	const hostLmsData = rows?.hostLms?.content;



	return (
		<AdminLayout title={t("sidebar.host_lms_button")}>
					{resourceFetchStatus === 'loading' && (
						<Typography variant='body1' className='text-center mb-0'>{t("hostlms.loading_msg")}</Typography>)}

					{resourceFetchStatus === 'error' && (
						<Alert severityType='error' onCloseFunc={() => {}} alertText={t("hostlms.alert_text")}></Alert>)}

					{resourceFetchStatus === 'success' && (
						<>			
							<DataGrid
								data={hostLmsData?? []}
								columns={[ {field: 'name', headerName: "HostLMS name", minWidth: 150, flex: 1}, { field: 'id', headerName: "HostLMS ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "HostLMS code", minWidth: 50, flex: 0.5}]}	
								type="HostLMS"
								selectable={true}
								noDataTitle={"No HostLMS found."}
								noDataMessage={"Try changing your filters or search terms."}
							/>
						</>
					)}
		</AdminLayout>
	);
};


export const getServerSideProps: GetServerSideProps<Props> = async (context: GetServerSidePropsContext) => {
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
			...translations,
			page,
			resultsPerPage,
			sort: sort
		}
	};
};

export default HostLmss;
