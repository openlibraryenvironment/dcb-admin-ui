import { Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { getSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { getGroupById } from "src/queries/queries";
import createApolloClient from "apollo-client";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Group } from "@models/Group";
import { ClientDataGrid } from "@components/ClientDataGrid";

type GroupDetails = {
    group: Group
};

export default function GroupDetails( {group}: GroupDetails) {
    const { t } = useTranslation();
    return (
        <AdminLayout title={group?.name}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_name")}</span>
                            </Typography>
                            {group?.name} 
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                            <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_code")}</span>
                            </Typography>
                            {group?.code} 
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                            <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_id")}</span>
                            </Typography>
                            {group?.id}
                </Grid>
            </Grid>
            <ClientDataGrid 
                data={group?.members.map((item: { agency: any; }) => item.agency) ?? []}
                columns={[ {field: 'name', headerName: "Agency name", minWidth: 100, flex: 1}, 
                        { field: 'id', headerName: "Agency ID", minWidth: 50, flex: 0.5}, 
                        { field: 'code', headerName: "Agency code", minWidth: 50, flex: 0.5}]}	
                type = "GroupDetails"
                // We don't want click-through on this grid.
                selectable= {false}
                noDataTitle={"No agencies found."}
                noDataMessage={"Try changing your filters or search terms."}
            />
        </AdminLayout>
    );

}

export async function getServerSideProps(ctx: any) {
    const { locale } = ctx;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}
    const session = await getSession(ctx);
    const groupId = ctx.params.groupId
    const client = createApolloClient(session?.accessToken);
    const { data } = await client.query({
        query: getGroupById,
        variables: {
            query: "id:"+groupId
        }        
      });
    const group = data?.agencyGroups?.content?.[0];
    return {
      props: {
        groupId,
        group,
        ...translations,
      },
    }
}