import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { getSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { getLocationById } from "src/queries/queries";
import createApolloClient from "apollo-client";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Location } from "@models/Location";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";

type LocationDetails = {
    location: Location
};
// Coming in, we know the ID. So we need to query our GraphQL server to get the associated data.

export default function LocationDetails( {location}: LocationDetails) {
    const { t } = useTranslation();
    return (
        <AdminLayout title={location?.name}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_name")}</span>
                    </Typography>
                    {location?.name} 
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_code")}</span>
                    </Typography>
                    {location?.code} 
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_id")}</span>
                    </Typography>
                    {location?.id}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div">
                    <span style={{ fontWeight: 'bold' }}>{t("details.location_type")}</span>
                    </Typography>
                    {location?.type}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Typography component="div">
                    <span style={{ fontWeight: 'bold' }}>{t("details.location_agency")}</span>
                    </Typography>
                    {location?.agency?.id}
                </Grid>

            </Grid>
            <Accordion>
                <AccordionSummary
                        aria-controls="client-config-location-details"
                        id="client-config-location-details"
                        expandIcon={
                        <IconContext.Provider value={{ size: "2em" }}>
                                <MdExpandMore />
                        </IconContext.Provider>}
                >
                <Typography variant = "h3" sx={{ fontWeight: 'bold' }}>{t("details.location_info")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                        <Typography component="div">
                        <span style={{ fontWeight: 'bold' }}>{t("details.long")}</span>
                        {location?.longitude}
                        </Typography>
                        <Typography component="div">
                        <span style={{ fontWeight: 'bold' }}>{t("details.lat")}</span>
                        {location?.latitude}
                        </Typography>
                </AccordionDetails>
            </Accordion>
            </AdminLayout>
    );
}
// Add the rest when you get back ^^^
export async function getServerSideProps(ctx: any) {
    const { locale } = ctx;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}
    const session = await getSession(ctx);
    const locationId = ctx.params.locationId
    const client = createApolloClient(session?.accessToken);
    const { data } = await client.query({
        query: getLocationById,
        variables: {
            query: "id:"+locationId
        }        
      });
    const location = data?.locations?.content?.[0];

    return {
      props: {
        locationId,
        location,
        ...translations,
      },
    }
}