import { Accordion, AccordionDetails, AccordionSummary, Button, Stack, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { getSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { getHostLmsById } from "src/queries/queries";
import createApolloClient from "apollo-client";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { HostLMS } from "@models/HostLMS";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";

type HostLMSDetails = {
    hostlms: HostLMS
};

export default function HostLMSDetails( {hostlms}: HostLMSDetails) {
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
        <AdminLayout title={hostlms?.name}>
            <Stack direction="row" justifyContent="end">
                <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> 
            </Stack>
            <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                <AccordionSummary aria-controls="hostlms-general-details" id="hostlms_details_general" 
                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                    </IconContext.Provider>}>
                    <Typography  variant="h3" sx={{ fontWeight: 'bold' }}> {t("details.general", "General")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_id")}</span>
                        </Typography>
                        {hostlms?.id}
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_code")}</span>
                        </Typography>
                        {hostlms?.code}
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_name")}</span>
                        </Typography>
                        {hostlms?.name}
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.lms_client")}</span>
                        </Typography>
                        {hostlms?.lmsClientClass}
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            <Accordion expanded={expandedAccordions[1]} onChange={handleAccordionChange(1)}>
                <AccordionSummary aria-controls="hostlms-client-config-details" id="hostlms_details_client_config" 
                            expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                            </IconContext.Provider>}>
                            <Typography variant="h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config", "Client config")} </Typography>
                </AccordionSummary>
                <AccordionDetails>
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        {hostlms?.clientConfig?.apikey != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_api")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.apikey}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.ingest != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_ingest")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.ingest}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['shelving-locations'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_shelving")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['shelving-locations']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['num-records-to-generate'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_records")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['num-records-to-generate']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['record-syntax'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_record_syntax")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['record-syntax']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['metadata-prefix'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_metadata_prefix")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['metadata-prefix']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['base-url'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_base")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['base-url']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['access-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_access_id")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['access-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['domain-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_domain_id")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['domain-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['page-size'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_page_size")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['page-size']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['access-key'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_access_key")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['access-key']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['staff-username'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_staff_username")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['staff-username']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.['staff-password'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_staff_password")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.['staff-password']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.secret != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_secret")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.secret}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.key != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_key")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.key}
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
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_fine")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.item?.['fine-code-id']}
                                </Grid>
                                )}
                        {hostlms?.clientConfig?.item?.['renewal-limit'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_renewal_limit")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.item?.['renewal-limit']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['barcode-prefix'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_barcode_prefix")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.item?.['barcode-prefix']}
                                </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['history-action-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_history_action_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.item?.['history-action-id']}
                                </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['shelving-scheme-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_shelving_scheme_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.item?.['shelving-scheme-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.item?.['loan-period-code-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_loan_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.item?.['loan-period-code-id']}
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
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_app_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.papi?.['app-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.papi?.['org-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_org_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.papi?.['org-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.papi?.['lang-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_lang_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.papi?.['lang-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.papi?.['papi-version'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_version")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.papi?.['papi-version']}
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
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_product_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.services?.['product-id']}
                        </Grid> : null}
                        {hostlms?.clientConfig?.services?.['site-domain']!= null ? 
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_site_domain")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.services?.['site-domain']}
                        </Grid> : null}
                        {hostlms?.clientConfig?.services?.['workstation-id']!= null ?
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_workstation_id")}</span>
                                </Typography>
                                {hostlms?.clientConfig?.services?.['workstation-id']}
                        </Grid> : null}
                        {hostlms?.clientConfig?.services?.['organisation-id']!= null ? 
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_organisation_id")}</span>
                                </Typography> 
                                {hostlms?.clientConfig?.services?.['organisation-id']}
                        </Grid>: null}
                        {hostlms?.clientConfig?.services?.['services-version']!= null ? 
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_version")}</span>
                                </Typography> 
                                {hostlms?.clientConfig?.services?.['services-version']}
                        </Grid>: null}
                        {hostlms?.clientConfig?.services?.language != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_language")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.services?.language}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['product-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_product_id")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.services?.['product-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['site-domain'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_site_domain")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.services?.['site-domain']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['workstation-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_workstation_id")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.services?.['workstation-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['organisation-id'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_organisation_id")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.services?.['organisation-id']}
                        </Grid>
                        )}
                        {hostlms?.clientConfig?.services?.['services-version'] != null && (
                        <Grid xs={2} sm={4} md={4}>
                        <Typography component="div">
                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_version")}</span>
                        </Typography>
                        {hostlms?.clientConfig?.services?.['version']}
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
    const session = await getSession(ctx);
    const hostlmsId = ctx.params.hostlmsId
    const client = createApolloClient(session?.accessToken);
    const { data } = await client.query({
        query: getHostLmsById,
        variables: {
            query: "id:"+hostlmsId
        }        
      });
    const hostlms = data?.hostLms?.content?.[0];
    return {
      props: {
        hostlmsId,
        hostlms,
        ...translations,
      },
    }
}