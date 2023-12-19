import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';

import { AdminLayout } from '@layout';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, Paper } from '@mui/material';
import { searchBibs } from 'src/queries/queries';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ServerPaginationGrid from '@components/ServerPaginatedGrid/ServerPaginatedGrid';




const SourceBibs: NextPage = () => {
	const { t } = useTranslation();
    const BibsDisplay = () => {
        return(
                <ServerPaginationGrid 
                    query={searchBibs} 
                    type="sourceBibs"
                    selectable={true} 
                    pageSize={10}
                    noDataMessage={t("bibRecords.no_rows")}
                    noResultsMessage={t("bibRecords.no_results")}
                    columns={[{field: 'id', headerName: "Source bib ID", minWidth: 100, flex: 0.5, sortable: false}, 
                            {field: 'title', headerName: "Title", minWidth: 150, flex: 0.6, sortable: false}, 
                            {field: 'author', headerName: "Author", minWidth: 100, flex: 0.5, sortable: false}, 
                            {field: 'clusterRecordId', headerName: "Cluster record ID", minWidth: 50, flex: 0.5, sortable: false, valueGetter: (params: { row: { contributesTo: { id: any } } }) => params?.row?.contributesTo?.id}, 
                            {field: 'clusterRecordTitle', headerName: "Cluster record title", minWidth: 50, flex: 0.5, sortable: false, valueGetter: (params: { row: { contributesTo: { title: any } } }) => params?.row?.contributesTo?.title}, 
                            {field: 'sourceRecordId', headerName: "Source record ID", minWidth: 50, sortable: false, flex: 0.5},
                            {field: 'sourceSystemId', headerName: "Source system ID", minWidth: 50, sortable: false, flex: 0.5}
                        ]}
                    columnVisibilityModel={{clusterRecordTitle: false, clusterRecordId: false, sourceRecordId: false, sourceSystemId: false}} />
        )
    }
    return (
        <AdminLayout>
            <Paper elevation={16}>
                <Card>
                    <CardContent>
                        <BibsDisplay/>
                    </CardContent>
                </Card>
            </Paper>
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