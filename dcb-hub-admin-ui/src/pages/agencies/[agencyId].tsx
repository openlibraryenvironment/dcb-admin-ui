import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from "next-i18next";
import { getAgencyById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { useQuery } from "@apollo/client";
import { Agency } from "@models/Agency";
import { renderAttribute } from "src/helpers/renderAttribute";

type AgencyDetails = {
    agencyId: string,
};

export default function AgencyDetails( {agencyId}: AgencyDetails) {
    const { t } = useTranslation();
    const { loading, data} = useQuery(getAgencyById, {
        variables: {
            query: "id:"+agencyId
        }, pollInterval: 120000        
    })
    const agency:Agency = data?.agencies?.content?.[0];
    
    return (
        loading ? <AdminLayout title={t("common.loading")} /> : 
        <AdminLayout title={agency?.name}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_name")}
                            </Typography>
                            {renderAttribute(agency?.name)}
                        </Stack>

                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_id")}
                            </Typography>
                            {renderAttribute(agency?.id)}
                        </Stack>
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_code")}
                            </Typography>
                            {renderAttribute(agency?.code)}
                        </Stack>
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_hostlms")}
                            </Typography>
                            {renderAttribute(agency?.hostlms?.code)}
                        </Stack>
                    </Grid>
                    <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.agency_auth")}
                            </Typography>
                            {renderAttribute(agency?.authProfile)}
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
                            {renderAttribute(agency?.longitude)} </Typography>
                        </Stack>
                        <Stack direction={"column"}>
                            <Typography variant="attributeTitle">{t("details.lat")}
                            {renderAttribute(agency?.latitude)} </Typography>
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
    // We use ctx.params to extract the ID from the URL. Then we can use it to make the request.
    const agencyId = ctx.params.agencyId
    // Then return all the relevant props ready for page load.
    return {
      props: {
        agencyId,
        ...translations,
      },
    }
}

