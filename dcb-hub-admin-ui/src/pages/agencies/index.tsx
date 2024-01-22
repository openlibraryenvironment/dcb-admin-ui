import { useState } from 'react';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { Button } from '@mui/material';
import { AdminLayout } from '@layout';

//localisation
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import AddAgenciesToGroup from './AddAgenciesToGroup';
import { getAgencies } from 'src/queries/queries';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';

// import SignOutIfInactive from '../useAutoSignout';

const Agencies: NextPage = () => {
	// Access the accessToken for running authenticated requests
	// State management variables for the AddAgenciesToGroup modal.
	const [addToGroup, setAddToGroup] = useState(false);

	const openAddToGroup = () => {
		setAddToGroup(true);
	}
	const closeAddToGroup = () => {
		setAddToGroup(false);
	};

	const { t } = useTranslation();

	return (
		<AdminLayout title={t("sidebar.agency_button")}>
							<div>
							<Button data-tid="add-agencies-to-group" variant = 'contained' onClick={openAddToGroup} > {t("agencies.add_to_group")}</Button>
							<ServerPaginationGrid
								query={getAgencies} 
								type="agencies"
								columns={[ {field: 'name', headerName: "Agency name", minWidth: 150, flex: 0.5}, { field: 'id', headerName: "Agency ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "Agency code", minWidth: 50, flex: 0.5}]}	
								selectable={true} 
								pageSize={10}
								noDataMessage={t("agencies.no_rows")}
								noResultsMessage={t("agencies.no_results")}
								searchPlaceholder='e.g. name:Example Agency'
								sortDirection="ASC"
								sortAttribute="name"
							/>
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
