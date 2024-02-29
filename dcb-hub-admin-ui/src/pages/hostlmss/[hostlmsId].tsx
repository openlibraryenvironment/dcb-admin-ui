import { Accordion, AccordionDetails, AccordionSummary, Button, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from "next-i18next";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { HostLMS } from "@models/HostLMS";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import PrivateData from "@components/PrivateData/PrivateData";
import { getHostLmsById } from "src/queries/queries";
import { useQuery } from "@apollo/client";

type HostLMSDetails = {
    hostlmsId: any
};

export default function HostLMSDetails( {hostlmsId}: HostLMSDetails) {
    const { t } = useTranslation();

    // pollInterval is in ms - set to 2 mins
    const { loading, data, fetchMore } = useQuery(getHostLmsById, {
        variables: {
            query: "id:"+hostlmsId
        }, pollInterval: 120000}  );
    const hostlms: HostLMS =  data?.hostLms?.content?.[0];

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
        <AdminLayout title={hostlms?.name}>
            <Stack direction="row" justifyContent="end">
                <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> 
            </Stack>
            <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                <AccordionSummary aria-controls="hostlms-general-details" id="hostlms_details_general" 
                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                    </IconContext.Provider>}>
                    <Typography  variant="h3" sx={{ fontWeight: 'bold' }}> {t("details.general")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.hostlms_id")}
                                        </Typography>
                                        {hostlms?.id}
                                </Stack>
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.hostlms_code")}
                                        </Typography>
                                        {hostlms?.code}
                                </Stack>
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.hostlms_name")}
                                        </Typography>
                                        {hostlms?.name}
                                </Stack>
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.lms_client")}
                                        </Typography>
                                        {hostlms?.lmsClientClass}
                                </Stack>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            <Accordion expanded={expandedAccordions[1]} onChange={handleAccordionChange(1)}>
                <AccordionSummary aria-controls="hostlms-client-config-details" id="hostlms_details_client_config" 
                            expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                            </IconContext.Provider>}>
                            <Typography variant="h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        {hostlms?.clientConfig?.apikey != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <PrivateData clientConfigType={t("details.client_config_api")} hiddenTextValue={hostlms?.clientConfig?.apikey} id="apiKey"/>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.ingest != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_ingest")}
                                        </Typography>
                                        {hostlms?.clientConfig?.ingest}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['shelving-locations'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_shelving")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['shelving-locations']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['num-records-to-generate'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_records")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['num-records-to-generate']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['record-syntax'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_record_syntax")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['record-syntax']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['metadata-prefix'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_metadata")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['metadata-prefix']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['base-url'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_base")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['base-url']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['access-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_access_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['access-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['domain-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_domain_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['domain-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['page-size'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_page_size")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['page-size']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['access-key'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <PrivateData clientConfigType={t("details.client_config_access_key")} hiddenTextValue={hostlms?.clientConfig?.['access-key']} id={'access-key'}/>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['staff-username'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_staff_username")}
                                        </Typography>
                                        {hostlms?.clientConfig?.['staff-username']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['staff-password'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                {<PrivateData clientConfigType={t("details.client_config_staff_password")} hiddenTextValue={hostlms?.clientConfig?.['staff-password']} id={'staff-password'}/>}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.secret != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <PrivateData clientConfigType={t("details.client_config_secret")} hiddenTextValue={hostlms?.clientConfig?.secret} id={'secret'}/>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.key != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <PrivateData clientConfigType={t(("details.client_config_key"))} hiddenTextValue={hostlms?.clientConfig?.key} id={'key'}/>
                        </Grid>
                        )}
                        </Grid>
                        {/* // For the 'item' object on some HostLMS. Conditionally rendered so it only shows up on Host LMS with this config.  */}
                        {hostlms?.clientConfig?.item != null ? 
                        <Accordion expanded={expandedAccordions[2]} onChange={handleAccordionChange(2)}>
                        <AccordionSummary aria-controls="hostlms-client-config-details-item" id="hostlms_details_client_config_item" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                        </IconContext.Provider>}>
                                        <Typography  variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config_item")} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        {hostlms?.clientConfig?.item?.['fine-code-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.client_config_fine")}
                                                </Typography>
                                                {hostlms?.clientConfig?.item?.['fine-code-id']}
                                        </Stack>
                                </Grid>
                                )}
                        {hostlms?.clientConfig?.item?.['renewal-limit'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.client_config_renewal_limit")}
                                                </Typography>
                                                {hostlms?.clientConfig?.item?.['renewal-limit']}
                                        </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['barcode-prefix'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.client_config_barcode_prefix")}
                                                </Typography>
                                                {hostlms?.clientConfig?.item?.['barcode-prefix']}
                                        </Stack>
                                                                                
                                </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['history-action-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.client_config_history_action_id")}
                                                </Typography>
                                                {hostlms?.clientConfig?.item?.['history-action-id']}
                                        </Stack>
                                </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['shelving-scheme-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_shelving_scheme_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.item?.['shelving-scheme-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['loan-period-code-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_loan_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.item?.['loan-period-code-id']}
                                </Stack>
                        </Grid>
                        )}
                        </Grid>
                        </AccordionDetails>
                        </Accordion> : null }
                        {/* For Host LMS with the 'PAPI' config. Conditionally rendered so it only shows up on Host LMS with this config. */}
                        {hostlms?.clientConfig?.papi != null ? 
                        <Accordion expanded={expandedAccordions[3]} onChange={handleAccordionChange(3)}>
                        <AccordionSummary aria-controls="hostlms-client-config-details-papi" id="hostlms_details_client_config_papi" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                        </IconContext.Provider>}>
                                        <Typography  variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config_papi")} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        {hostlms?.clientConfig?.papi?.['app-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_papi_app_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.papi?.['app-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.papi?.['org-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_papi_org_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.papi?.['org-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.papi?.['lang-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_papi_lang_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.papi?.['lang-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.papi?.['papi-version'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                 <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_papi_version")}
                                        </Typography>
                                        {hostlms?.clientConfig?.papi?.['papi-version']}
                                </Stack>
                        </Grid>
                        )}
                        </Grid>
                        </AccordionDetails>
                        </Accordion> : null }
                        {/* For HostLMS services config. Conditionally rendered so it only shows up on Host LMS with this config. */}
                        {hostlms?.clientConfig?.services != null ?
                        <Accordion expanded={expandedAccordions[4]} onChange={handleAccordionChange(4)}>
                        <AccordionSummary aria-controls="hostlms-client-config-details-services" id="hostlms_details_client_config_services" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                        </IconContext.Provider>}>
                                        <Typography  variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config_services")} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        {hostlms?.clientConfig?.services?.['product-id']!= null ? 
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_product_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['product-id']}
                                </Stack>
                        </Grid> : null}
                        {hostlms?.clientConfig?.services?.['site-domain']!= null ? 
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_site_domain")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['site-domain']}
                                </Stack>
                        </Grid> : null}
                        {hostlms?.clientConfig?.services?.['workstation-id']!= null ?
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_workstation_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['workstation-id']}
                                </Stack>
                        </Grid> : null}
                        {hostlms?.clientConfig?.services?.['organisation-id']!= null ? 
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_organisation_id")}
                                        </Typography> 
                                        {hostlms?.clientConfig?.services?.['organisation-id']}
                                </Stack>
                        </Grid>: null}
                        {hostlms?.clientConfig?.services?.['services-version']!= null ? 
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_version")}
                                        </Typography> 
                                        {hostlms?.clientConfig?.services?.['services-version']}
                                </Stack>
                        </Grid>: null}
                        {hostlms?.clientConfig?.services?.language != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_language")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.language}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['product-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_product_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['product-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['site-domain'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_site_domain")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['site-domain']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['workstation-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_workstation_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['workstation-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['organisation-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_organisation_id")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['organisation-id']}
                                </Stack>
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['services-version'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Stack direction={"column"}>
                                        <Typography variant="attributeTitle">{t("details.client_config_services_version")}
                                        </Typography>
                                        {hostlms?.clientConfig?.services?.['version']}
                                </Stack>
                        </Grid>
                        )}
                        </Grid>
                        </AccordionDetails>
                        </Accordion> : null }
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
        const hostlmsId = ctx.params.hostlmsId
        return {
        props: {
                hostlmsId,
                ...translations,
        },
        }
}