import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { AdminLayout } from '@layout';
//localisation
import { useTranslation } from 'next-i18next';
import { getLocations } from 'src/queries/queries';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';
import { getGridStringOperators } from '@mui/x-data-grid';

// import SignOutIfInactive from '../useAutoSignout';
const Locations: NextPage = () => {
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
    ['equals', 'contains'/* add more over time as we build in support for them */ ].includes(value),
    );

	return (
		<AdminLayout title={t("sidebar.location_button")}>
			<ServerPaginationGrid
				query={getLocations} 
				type="locations"
				coreType="locations"
				columns={[ {field: 'name', headerName: "Location name", minWidth: 150, flex: 0.6, filterOperators}, 
							{field: 'id', headerName: "Location ID", minWidth: 100, flex: 0.5, filterOperators}, 
							{field: 'code', headerName: "Location code", minWidth: 50, flex: 0.5, filterOperators}
						]}	
				selectable={true} 
				pageSize={10}
				noDataMessage={t("locations.no_rows")}
				noResultsMessage={t("locations.no_results")}
				searchPlaceholder={t("locations.search_placeholder")}
				sortDirection="ASC"
				sortAttribute="name"
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

	return {
		props: {
			...translations
		}
	};
};

export default Locations;
