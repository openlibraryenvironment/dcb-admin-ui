import { useState } from 'react';
import { AdminLayout } from '@layout';
import { Button } from '@mui/material';
import NewGroup from './NewGroup';
import { useQueryClient } from '@tanstack/react-query'
import { groupsQueryDocument } from 'src/queries/queries';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
//localisation
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';
// import SignOutIfInactive from '../useAutoSignout';

// Groups Feature Page Structure
// This page shows the list of groups
// New Group is the (modal) form to add a group
// View Group will be a Details page with type 'Group'
// In /agencies, there is the Add Agencies to Group form.


const Groups: NextPage = () => {

	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();
	const [showNewGroup, setShowNewGroup] = useState(false);
	const openNewGroup = () =>
	{
		setShowNewGroup(true);
	}
	const closeNewGroup = () => {
		setShowNewGroup(false);
		// forces the query to refresh once a new group is added	
		// needs to be adapted to work with SSR approach so that the grid always updates correctly on new group creation	
	};

	// We need to make this work with Apollo, as at the minute we lose auto-refresh.	
	const { t } = useTranslation();

	return (
		<AdminLayout data-tid="groups-title" title={t("sidebar.groups_button")}>
			<Button data-tid="new-group-button" variant="contained" onClick={openNewGroup} > {t("groups.type_new")}</Button>
			<ServerPaginationGrid
				query={groupsQueryDocument} 
				type="agencyGroups"
				columns={[ {field: 'name', headerName: "Group name", minWidth: 150, flex: 0.5}, { field: 'id', headerName: "Group ID", minWidth: 100, flex: 0.5}, {field: 'code', headerName: "Group code", minWidth: 50, flex: 0.5}]}	
				selectable={true} 
				pageSize={10}
				noDataMessage={t("groups.no_rows")}
				noResultsMessage={t("groups.no_results")}
				searchPlaceholder='Search'
				sortDirection="ASC"
				sortAttribute="name"
			/>		
			<div>
			{ showNewGroup ? <NewGroup show={showNewGroup}  onClose={closeNewGroup}/> : null }
    		</div>
		</AdminLayout>
	);
}
  
export const getServerSideProps: GetServerSideProps= async (context: GetServerSidePropsContext) => {
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

export default Groups;
