import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';

import { AdminLayout } from '@layout';
import { useTranslation } from 'next-i18next';
import { searchBibs } from 'src/queries/queries';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';
import { getGridStringOperators } from '@mui/x-data-grid';




const SourceBibs: NextPage = () => {
	const { t } = useTranslation();

    // Limiting available filters due to server-side filtering only supporting 'equals'
    const filterOperators = getGridStringOperators().filter(({ value }) =>
    ['equals', 'contains'/* add more over time */ ].includes(value),
    );
    // Expose only the filters we have tested. The others need to be mapped to Lucene functionality
    // If testing, use this format for the search: 
    
    
    const BibsDisplay = () => {
        return(
                <ServerPaginationGrid 
                    query={searchBibs} 
                    type="sourceBibs"
                    selectable={true} 
                    pageSize={5}
                    noDataMessage={t("bibRecords.no_rows")}
                    noResultsMessage={t("bibRecords.no_results")}
                    columns={[{field: 'id', headerName: "Source bib ID", minWidth: 100, flex: 0.5, sortable: false, filterOperators}, 
                            {field: 'title', headerName: "Title", minWidth: 150, flex: 0.6, sortable: false, filterOperators}, 
                            {field: 'author', headerName: "Author", minWidth: 100, flex: 0.5, sortable: false, filterOperators}, 
                            {field: 'clusterRecordId', headerName: "Cluster record ID", minWidth: 50, flex: 0.5, sortable: false, filterOperators, valueGetter: (params: { row: { contributesTo: { id: any } } }) => params?.row?.contributesTo?.id}, 
                            {field: 'clusterRecordTitle', headerName: "Cluster record title", minWidth: 50, flex: 0.5, sortable: false, filterOperators, valueGetter: (params: { row: { contributesTo: { title: any } } }) => params?.row?.contributesTo?.title}, 
                            {field: 'sourceRecordId', headerName: "Source record ID", minWidth: 50, sortable: false, filterOperators, flex: 0.5},
                            {field: 'sourceSystemId', headerName: "Source system ID", minWidth: 50, sortable: false, filterOperators, flex: 0.5}
                        ]}
                    columnVisibilityModel={{clusterRecordTitle: false, clusterRecordId: false, sourceRecordId: false, sourceSystemId: false}}
                    searchPlaceholder='e.g. sourceRecordId:12345'
                    sortDirection="ASC" 
                    sortAttribute="sourceRecordId"/>
        )
    }
    return (
		<AdminLayout title={t("sidebar.bib_button")}>
            <BibsDisplay/>
        </AdminLayout>
    )
}


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

export default SourceBibs;