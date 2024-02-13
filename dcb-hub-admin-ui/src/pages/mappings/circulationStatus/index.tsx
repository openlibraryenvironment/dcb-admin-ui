import { NextPage } from 'next';
import { AdminLayout } from '@layout';
import { Button } from '@mui/material';
import { capitalize } from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Import from '@components/Import/Import';
import dayjs from 'dayjs';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';
import { getGridStringOperators } from '@mui/x-data-grid';
import { getCirculationStatusMappings } from 'src/queries/queries';
import { useApolloClient } from '@apollo/client';


const CirculationStatusMappings: NextPage = () => {
	// Handles the import modal display
	const client = useApolloClient();
	const [showImport, setImport] = useState(false);
	const openImport = () =>
	{
		setImport(true);
	}
	const closeImport = () => {
		setImport(false);
		// This refetches only the 'LoadCirculationStatusMappings' query, to get the latest mappings after import.
		client.refetchQueries({
			include: ["LoadCirculationStatusMappings"],
		});		
	};
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
    ['equals', 'contains'/* add more over time as we build in support for them */ ].includes(value),
    );

	return (
		<AdminLayout title={t("nav.mappings.circulationStatus")}>			
			<Button variant="contained" onClick={openImport}>{t("mappings.import")}</Button>
			<ServerPaginationGrid
				query={getCirculationStatusMappings}
				type="circulationStatus"
				coreType="referenceValueMappings"
				columns={[{field: 'fromContext', headerName: "Host LMS", minWidth: 50, flex: 0.5, filterOperators},
							{field: 'fromValue', headerName: "Local value", minWidth: 50, flex: 0.4, filterOperators}, 
							{field: 'label', headerName: "Local meaning", minWidth: 50, flex: 0.5, filterOperators},
							{field: 'toValue', headerName: "DCB value", minWidth: 50, flex: 0.5, filterOperators,
							valueGetter: (params: { row: { toValue: any; }; }) => {
								return capitalize(params.row.toValue);
							}},								
							{field: 'lastImported', headerName: "Last imported", minWidth: 100, flex: 0.5, filterOperators,
							valueGetter: (params: { row: { lastImported: any; }; }) => {
								const lastImported = params.row.lastImported;
								return dayjs(lastImported).format('YYYY-MM-DD HH:mm');
							}}]}
				noDataMessage={t("mappings.import_circulation_status")}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				searchPlaceholder={t("mappings.search_placeholder_cs")}
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

export default CirculationStatusMappings;