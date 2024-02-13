import { AdminLayout } from "@layout";
import { AuditItem } from "@models/AuditItem";
import { Button } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Unstable_Grid2';

import createApolloClient from "apollo-client";
import { getSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { getAuditById } from "src/queries/queries";


type AuditDetails = {
    audit: AuditItem
};

export default function AuditDetails( {audit}: AuditDetails) {
    const { t } = useTranslation();
    const router = useRouter();
    // Link to the original patron request so users can get back
    const handleReturn = () => {
        router.push(`/patronRequests/${audit?.patronRequest?.id}`)
    }
    return (
        <AdminLayout title={audit?.id}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 2, md: 2, lg: 2 }}>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.audit_id")}</span>
                    </Typography>
                    {audit?.id} 
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.audit_date")}</span>
                    </Typography>
                    {audit?.auditDate} 
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.audit_description")}</span>
                    </Typography>
                    {audit?.briefDescription}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                <Typography component="div">
                    <span style={{ fontWeight: 'bold' }}>{t("details.audit_from_status")}</span>
                </Typography>
                    {audit?.fromStatus}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div">
                        <span style={{ fontWeight: 'bold' }}>{t("details.audit_from_status")}</span>
                    </Typography>
                    {audit?.toStatus}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div">
                        <span style={{ fontWeight: 'bold' }}>{t("details.patron_request_id")}</span>
                    </Typography>
                    {audit?.patronRequest?.id}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div">
                        <span style={{ fontWeight: 'bold' }}>{t("details.audit")}</span>
                    </Typography>
                    <pre>{JSON.stringify(audit?.auditData, null, 2)}</pre>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Button variant="contained" onClick={handleReturn}>
                        {t("details.patron_request_return")}
                    </Button>
                </Grid>
            </Grid>
        </AdminLayout>
    )

}




export async function getServerSideProps(ctx: any) {
    const { locale } = ctx;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}
    const session = await getSession(ctx);
    const auditId = ctx.params.auditId

    const client = createApolloClient(session?.accessToken);
    const { data } = await client.query({
        query: getAuditById,
        variables: {
            query: "id:"+auditId
        }        
      });
    const audit = data?.audits?.content?.[0];
    return {
        props: {
          auditId,
          audit,
          ...translations,
        },
      }
}