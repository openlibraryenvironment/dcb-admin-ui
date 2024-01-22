import { GetServerSideProps, NextPage } from 'next';

import { AdminLayout } from '@layout';

// import SignOutIfInactive from './useAutoSignout';
import { Button} from '@mui/material';
import { capitalize } from 'lodash';
import { useState } from 'react';

//localisation
import { useTranslation } from 'next-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Import from '@components/Import/Import';
import dayjs from 'dayjs';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';
import { getMappings } from 'src/queries/queries';



// Page for 'ALL' referenceValueMappings - includes CirculationStatus, ShelvingLocation, etc.

const AllMappings: NextPage = () => {
		// Access the accessToken for running authenticated requests
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


	const { t } = useTranslation();

	return (
		<AdminLayout title={t("sidebar.mappings_button")}>
			<Button variant="contained" onClick={openImport}>{t("mappings.import")}</Button>
			<ServerPaginationGrid
				query={getMappings}
				type="referenceValueMappings"
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
				noDataMessage={t("mappings.import_circulation_status")}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				sortModel={[{field: 'lastImported', sort: 'desc'}]}		
				pageSize={10}
				sortDirection="DESC"
				sortAttribute="lastImported"
			/>	
			<div>
			{ showImport ? <Import show={showImport}  onClose={closeImport}/> : null }
    		</div>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
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

export default AllMappings;