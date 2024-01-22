import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { AdminLayout } from '@layout';
//localisation
import { useTranslation } from 'next-i18next';
import { getHostLms } from 'src/queries/queries';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';

// import SignOutIfInactive from '../useAutoSignout';


const HostLmss: NextPage = () => {
	// Automatic logout after 15 minutes for security purposes, will be reinstated in DCB-283
	// SignOutIfInactive();
	const { t } = useTranslation();
	return (
		<AdminLayout title={t("sidebar.host_lms_button")}>		
			<ServerPaginationGrid
				query={getHostLms} 
				type="hostLms"
				columns={[ {field: 'name', headerName: "HostLMS name", minWidth: 150, flex: 1}, 
						{field: 'id', headerName: "HostLMS ID", minWidth: 100, flex: 0.5}, 
						{field: 'code', headerName: "HostLMS code", minWidth: 50, flex: 0.5}]}	
				selectable={true} 
				pageSize={10}
				noDataMessage={t("hostlms.no_rows")}
				noResultsMessage={t("hostlms.no_results")}
				searchPlaceholder='Search'
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
