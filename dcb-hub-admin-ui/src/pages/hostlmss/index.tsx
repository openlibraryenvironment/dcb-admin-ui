import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { AdminLayout } from '@layout';
//localisation
import { useTranslation } from 'next-i18next';
import { getHostLms } from 'src/queries/queries';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';
import { getGridStringOperators } from '@mui/x-data-grid';

// import SignOutIfInactive from '../useAutoSignout';
const HostLmss: NextPage = () => {
	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
    ['equals', 'contains'/* add more over time as we build in support for them */ ].includes(value),
    );
	return (
		<AdminLayout title={t("sidebar.host_lms_button")}>		
			<ServerPaginationGrid
				query={getHostLms} 
				coreType="hostLms"
				type="hostLms"
				columns={[ {field: 'name', headerName: "HostLMS name", minWidth: 150, flex: 1, filterOperators}, 
						{field: 'id', headerName: "HostLMS ID", minWidth: 100, flex: 0.5,filterOperators}, 
						{field: 'code', headerName: "HostLMS code", minWidth: 50, flex: 0.5, filterOperators}]}	
				selectable={true} 
				pageSize={10}
				noDataMessage={t("hostlms.no_rows")}
				noResultsMessage={t("hostlms.no_results")}
				searchPlaceholder={t("hostlms.search_placeholder")}
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
			...translations,
		}
	};
};

export default HostLmss;
