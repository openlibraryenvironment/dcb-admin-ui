import { Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from "next-i18next";
import { getGroupById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Group } from "@models/Group";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { useQuery } from "@apollo/client";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";

type GroupDetails = {
    groupId: string
};

export default function GroupDetails( {groupId}: GroupDetails) {
    const { t } = useTranslation();
    const { loading, data} = useQuery(getGroupById, {
        variables: {
            query: "id:"+groupId
        }, pollInterval: 120000        
    })
    const group: Group = data?.agencyGroups?.content?.[0];
    
    return (
        loading ? <AdminLayout title={t("common.loading")} /> : 
        <AdminLayout title={group?.name}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.group_name")}</Typography>
                            <RenderAttribute attribute={group?.name}/> 
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.group_code")}</Typography>
                        <RenderAttribute attribute={group?.code}/>
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.group_id")}</Typography>
                        <RenderAttribute attribute={group?.id}/>
                    </Stack>
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
    const groupId = ctx.params.groupId;
    return {
      props: {
        groupId,
        ...translations,
      },
    }
}