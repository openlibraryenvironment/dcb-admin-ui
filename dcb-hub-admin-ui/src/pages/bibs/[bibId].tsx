import { useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import { Bib } from "@models/Bib";
import { Accordion, AccordionDetails, AccordionSummary, Button, Stack, Typography, useTheme } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { getBibById } from "src/queries/queries";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";

type BibDetails = {
    bibId: Bib
};

export default function SourceBibDetails( {bibId}: BibDetails) {
        const { t } = useTranslation();
        const theme = useTheme();
        const { loading, data} = useQuery(getBibById, {
                variables: {
                    query: "id:"+bibId
                }, pollInterval: 120000      
        })
        const bib:Bib = data?.sourceBibs?.content?.[0];
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
        loading ? <AdminLayout title={t("common.loading")} /> : 
        <AdminLayout title={bib?.title}>
                <Stack direction="row" justifyContent="end">
                        <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}
                        </Button>
                </Stack>
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}>
                <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.source_bib_id")}
                                </Typography>
                                <RenderAttribute attribute={bib?.id}/>
                        </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.title")}
                                </Typography>
                                <RenderAttribute attribute={bib?.title}/>
                        </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.author")}
                                </Typography>
                                <RenderAttribute attribute={bib?.author}/>
                        </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.source_system_id")}
                                </Typography>
                                <RenderAttribute attribute={bib?.sourceSystemId}/>
                        </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.source_record_id")}
                                </Typography>
                                <RenderAttribute attribute={bib?.sourceRecordId}/>
                        </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.contributor_id")}
                                </Typography>
                                <RenderAttribute attribute={bib?.contributesTo?.id}/>
                        </Stack>
                </Grid>
                <Grid xs={2} sm={4} md={4}>
                        <Stack direction={"column"}>
                                <Typography variant="attributeTitle">{t("details.contributor_title")}
                                </Typography>
                                <RenderAttribute attribute={bib?.contributesTo?.title}/>
                        </Stack>
                </Grid>
                </Grid>
                <Accordion variant="outlined" sx={{border: '0'}} expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                <AccordionSummary sx={{backgroundColor: theme.palette.primary.detailsAccordionSummary}} aria-controls="source-bibs-json-details" id="source-bibs-json-details" 
                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                        </IconContext.Provider>}>
                        <Typography variant="h2" sx={{ fontWeight: 'bold' }}> {t("details.canonical_metadata")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                        <pre>{JSON.stringify(bib?.canonicalMetadata, null, 2)}</pre>
                </AccordionDetails>
                </Accordion>
                <Accordion variant="outlined" sx={{border: '0'}} expanded={expandedAccordions[8]} onChange={handleAccordionChange(8)}>
                <AccordionSummary sx={{backgroundColor: theme.palette.primary.detailsAccordionSummary}} aria-controls="source-bibs-source-record-json-details" id="source-bibs-source-record-json-details" 
                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                        </IconContext.Provider>}>
                        <Typography variant="h2" sx={{ fontWeight: 'bold' }}> {t("details.source_record")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                        <pre>{JSON.stringify(bib?.sourceRecord, null, 2)}</pre>
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
        const bibId = ctx.params.bibId
        return {
                props: {
                        bibId,
                        ...translations,
                },
        }
}