import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { getSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { getAgencyById } from "src/queries/queries";
import createApolloClient from "apollo-client";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";

type AgencyDetails = {
    agencyId: any,
    agency: any
};

export default function AgencyDetails( {agencyId, agency}: AgencyDetails) {
    const { t } = useTranslation();
    return (
        <AdminLayout title={agency?.name}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_name")}
                            </Typography>
                            {agency?.name}
                        </Stack>

                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_id")}
                            </Typography>
                            {agency?.id}
                        </Stack>
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_code")}
                            </Typography>
                            {agency?.code}
                        </Stack>
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_hostlms")}
                            </Typography>
                            {agency?.hostlms?.code}
                        </Stack>
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_auth")}
                            </Typography>
                            {agency?.authProfile}
                        </Stack>
                    </Grid>
            </Grid>
            <Accordion>
                <AccordionSummary aria-controls="agency_details_location_info" id="agency_details_location_info" 
                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                        </IconContext.Provider>}>
                        <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.location_info")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.long")}
                            {agency?.longitude} </Typography>
                        </Stack>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.lat")}
                            {agency?.latitude} </Typography>
                        </Stack>
                </AccordionDetails>
            </Accordion>
        </AdminLayout>
    );

}

export async function getServerSideProps(ctx: any) {
    // Handles loading the translations on the server-side
    const { locale } = ctx;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}
    // This is how we obtain the session information when we can't use useSession().
    // We need this so we can authenticate our request for agency data.
    const session = await getSession(ctx);
    // We use ctx.params to extract the ID from the URL. Then we can use it to make the request.
    const agencyId = ctx.params.agencyId
    // Construct a client to make the request as we can't use hooks here.
    const client = createApolloClient(session?.accessToken);
    // Await the agency data
    const { data } = await client.query({
        query: getAgencyById,
        variables: {
            query: "id:"+agencyId
        }        
      });
    // It comes in an array so it's important to get it in the right format here
    const agency = data?.agencies?.content?.[0];
    // Then return all the relevant props ready for page load.
    return {
      props: {
        agencyId,
        agency,
        ...translations,
      },
    }
}

