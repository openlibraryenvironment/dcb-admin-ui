import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
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
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_name")}
                        </Typography>
                        {location?.name}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_code")}
                        </Typography>
                        {location?.code} 
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_id")}
                        </Typography>
                        {location?.id}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_type")}
                        </Typography>
                        {location?.type}
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_agency")}
                        </Typography>
                        {location?.agency?.id}
                    </Stack>
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
                            <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.long")}
                                </Typography>
                                {location?.longitude}
                            </Stack>
                            <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.lat")}
                                </Typography>
                                {location?.latitude}
                            </Stack>
                </AccordionDetails>
            </Accordion>
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