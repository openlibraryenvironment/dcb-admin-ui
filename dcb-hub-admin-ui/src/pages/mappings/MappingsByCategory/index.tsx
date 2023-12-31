import { NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { CardContent, Card, Typography, CardHeader, Button } from '@mui/material';
import { capitalize } from 'lodash';
import { DataGrid } from '@components/DataGrid';
import { useResource } from '@hooks';
import { Mapping } from '@models/Mapping';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import getConfig from 'next/config';
import { useTranslation } from 'next-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Import from '@components/Import/Import';
import useCode from '@hooks/useCode';
import dayjs from 'dayjs';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type Props = {
	category: string
};

const MappingsByCategory: NextPage<Props> = () => {
	// Access the accessToken for running authenticated requests
	const { data, status } = useSession();

	// Handles the import modal display
	const queryClient = useQueryClient();
	const [showImport, setImport] = useState(false);
	const openImport = () =>
	{
		setImport(true);
	}
	const closeImport = () => {
		setImport(false);
		queryClient.invalidateQueries();
		// forces the query to refresh once a new group is added	
	};
	const { t } = useTranslation();
	const ByCategory = ({ category }: any) => {
		const categoryToPass = category;
		const url = useMemo(() => {
			const { publicRuntimeConfig } = getConfig();
			return publicRuntimeConfig.DCB_API_BASE + '/uploadedMappings/'+categoryToPass;
		}, [categoryToPass]);

		const {
			resource,
			status: resourceFetchStatus,
		} = useResource<Mapping>({
			isQueryEnabled: status === 'authenticated',
			accessToken: data?.accessToken ?? null,
			baseQueryKey: 'mappingsByCategory',
			url: url,
		});
		
		// This will conditionally render by category
		// Use valueGetter for when we need to format specific values
		return (
			<div>
				<Button variant="contained" onClick={openImport} > {t("mappings.import")}</Button>
				<DataGrid
					data={resource?.content ?? []}
					columns={[{field: 'fromContext', headerName: "Host LMS", minWidth: 50, flex: 0.5},
							{field: 'fromValue', headerName: "Local value", minWidth: 50, flex: 0.4}, 
							{field: 'label', headerName: "Local meaning", minWidth: 50, flex: 0.5},
							{field: 'toValue', headerName: "DCB value", minWidth: 50, flex: 0.5,
							valueGetter: (params: { row: { toValue: any; }; }) => {
								return capitalize(params.row.toValue);
							}},								
							{field: 'lastImported', headerName: "Last imported", minWidth: 100, flex: 0.5, 
							valueGetter: (params: { row: { lastImported: any; }; }) => {
								const lastImported = params.row.lastImported;
								return dayjs(lastImported).format('YYYY-MM-DD HH:mm');
							}}]}		
					type={category}
					noDataMessage={t("mappings.import_circulation_status")}
					noDataTitle={t("mappings.no_results")}
					selectable={false}
					sortModel={[{field: 'lastImported', sort: 'desc'}]}
				/>
			</div>
		)
	}

	return (
		<AdminLayout title={t("sidebar.circulation")}>
			<ByCategory category={useCode((state) => state.category) ?? "CirculationStatus"}/>
			<div>
			{ showImport ? <Import show={showImport}  onClose={closeImport}/> : null }
    		</div>
		</AdminLayout>
	);
};
// Add getServerSideProps back when we do server-side pagination work (DCB-480)

export async function getStaticProps({ locale }: {locale: any}) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
			'application',
			'common',
			'validation'
			])),
		},
	}
};

export default MappingsByCategory;