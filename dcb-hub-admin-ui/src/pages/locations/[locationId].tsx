import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from "next-i18next";
import { getLocationById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Location } from "@models/Location";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { useQuery } from "@apollo/client";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";

type LocationDetails = {
    locationId: string
};
// Coming in, we know the ID. So we need to query our GraphQL server to get the associated data.

export default function LocationDetails( {locationId}: LocationDetails) {
    const { t } = useTranslation();

    // Poll interval in ms
    const { loading, data, fetchMore } = useQuery(getLocationById, {
        variables: {
            query: "id:"+locationId
        }, pollInterval: 120000}  );
    const location: Location =  data?.locations?.content?.[0];

    
    return (
        loading ? <AdminLayout title={t("common.loading")} /> : 
        <AdminLayout title={location?.name}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_name")}
                        </Typography>
                        <RenderAttribute attribute={location?.name}/>
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_code")}
                        </Typography>
                        <RenderAttribute attribute={location?.code}/>
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_id")}
                        </Typography>
                        <RenderAttribute attribute={location?.id}/>
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_type")}
                        </Typography>
                        <RenderAttribute attribute={location?.type}/>
                    </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                    <Stack direction={"column"}>
                        <Typography variant="attributeTitle">{t("details.location_agency")}
                        </Typography>
                        <RenderAttribute attribute={location?.agency?.id}/>
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
                            <Stack direction={"row"} spacing={0.5}>
                                <Typography variant="attributeTitle">{t("details.long")}
                                </Typography>
                                <RenderAttribute attribute={location?.longitude}/>
                            </Stack>
                            <Stack direction={"row"} spacing={0.5}>
                                <Typography variant="attributeTitle">{t("details.lat")}
                                </Typography>
                                <RenderAttribute attribute={location?.latitude}/>
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
    const locationId = ctx.params.locationId
    return {
      props: {
        locationId,
        ...translations,
      },
    }
}