import { AdminLayout } from "@layout";
import { SourceBib } from "@models/SourceBib";
import { Accordion, AccordionDetails, AccordionSummary, Button, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import createApolloClient from "apollo-client";
import { getSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { getBibById } from "src/queries/queries";


type SourceBibDetails = {
    sourceBib: SourceBib
};

export default function SourceBibDetails( {sourceBib}: SourceBibDetails) {
        const { t } = useTranslation();
        const [expandedAccordions, setExpandedAccordions] = useState([true, true, true, true, true, true, true, false, false]);
        // Functions to handle expanding both individual accordions and all accordions
        const handleAccordionChange = (index: number) => () => {
                setExpandedAccordions((prevExpanded) => {
                        const newExpanded = [...prevExpanded];
                        newExpanded[index] = !newExpanded[index];
                        return newExpanded;
                 });
                };
      
        // Works for closing + expanding as it sets values to their opposite
        const expandAll = () => {
                setExpandedAccordions((prevExpanded) => prevExpanded.map(() => !prevExpanded[0]));
        };
        return (
        <AdminLayout title={sourceBib?.title}>
                <Stack direction="row" justifyContent="end">
                        <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}
                        </Button>
                </Stack>
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                <Grid xs={2} sm={4} md={4}>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_bib_id")}</span>
                        </Typography>
                        {sourceBib?.id}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.title")}</span>
                        </Typography>
                        {sourceBib?.title}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.author")}</span>
                        </Typography>
                        {sourceBib?.author}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_system_id")}</span>
                        </Typography>
                        {sourceBib?.sourceSystemId} 
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_record_id")}</span>
                        </Typography>
                        {sourceBib?.sourceRecordId} 
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.contributor_id")}</span>
                        </Typography>
                        {sourceBib?.contributesTo?.id}
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.contributor_title")}</span>
                        </Typography>
                        {sourceBib?.contributesTo?.title}
                </Grid>
                </Grid>
                <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                <AccordionSummary aria-controls="source-bibs-json-details" id="source-bibs-json-details" 
                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                        </IconContext.Provider>}>
                        <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.canonical_metadata")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                        <pre>{JSON.stringify(sourceBib?.canonicalMetadata, null, 2)}</pre>
                </AccordionDetails>
                </Accordion>
                <Accordion expanded={expandedAccordions[8]} onChange={handleAccordionChange(8)}>
                <AccordionSummary aria-controls="source-bibs-source-record-json-details" id="source-bibs-source-record-json-details" 
                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                        </IconContext.Provider>}>
                        <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.source_record")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                        <pre>{JSON.stringify(sourceBib?.sourceRecord, null, 2)}</pre>
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
    const sourceBibId = ctx.params.sourceBibId
    const client = createApolloClient(session?.accessToken);
    const { data } = await client.query({
        query: getBibById,
        variables: {
            query: "id:"+sourceBibId
        }        
      });
    const sourceBib = data?.sourceBibs?.content?.[0];
    return {
      props: {
        sourceBibId,
        sourceBib,
        ...translations,
      },
    }
}