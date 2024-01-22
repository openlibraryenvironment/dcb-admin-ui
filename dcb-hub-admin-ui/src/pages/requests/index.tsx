import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { AdminLayout } from '@layout';
//localisation
import { useTranslation } from 'next-i18next';
import { getPatronRequests } from 'src/queries/queries';
import dayjs from 'dayjs';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';

// import SignOutIfInactive from '../useAutoSignout';

const PatronRequests: NextPage = () => {

	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();

	// Note that server-side sorting is currently not fully functional.
	// As such, patronRequests are not being sorted as they should be (in descending order)


	const { t } = useTranslation();

	return (
		<AdminLayout title={t("sidebar.patron_request_button")}>
		
			<ServerPaginationGrid
				query={getPatronRequests}
				type="patronRequests"
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
				selectable={true} 
				pageSize={10}
				noDataMessage={t("patron_requests.no_rows")}
				noResultsMessage={t("patron_requests.no_results")}
				searchPlaceholder='Search'
				columnVisibilityModel={{suppliers: false, pickupLocationCode: false}}
				// This is how to set the default sort order - so the grid loads as sorted by 'lastUpdated' by default.
				sortModel={[{field: 'dateUpdated', sort: 'desc'}]}
				sortDirection="DESC"
				sortAttribute="dateUpdated"
			/>
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
