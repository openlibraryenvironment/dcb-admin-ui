import { AdminLayout } from "@layout";
import { AuditItem } from "@models/AuditItem";
import { Button, Stack } from "@mui/material";
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
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.audit_id")}
                        </Typography>
                        {audit?.id}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.audit_date")}
                        </Typography>
                        {audit?.auditDate}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.audit_description")}
                        </Typography>
                        {audit?.briefDescription}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                <Stack direction={"column"}>
                    <Typography variant="attributeTitle">{t("details.audit_from_status")}
                    </Typography>
                    {audit?.fromStatus}
                </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.audit_to_status")}
                        </Typography>
                        {audit?.toStatus}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.patron_request_id")}
                        </Typography>
                        {audit?.patronRequest?.id}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography variant="attributeTitle">{t("details.audit")}
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