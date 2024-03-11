import { useQuery } from "@apollo/client";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import { AdminLayout } from "@layout";
import { Stack, Button, Typography, Accordion, AccordionDetails, AccordionSummary, Card } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import getConfig from "next/config";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { getPatronRequestById } from "src/queries/queries";

type PatronRequestDetails = {
    patronRequestId: string,
};

export default function PatronRequestDetails( {patronRequestId}: PatronRequestDetails) {
    const { t } = useTranslation();
    const { publicRuntimeConfig } = getConfig();


    const { loading, data, fetchMore } = useQuery(getPatronRequestById, {
        variables: {
            query: "id:"+patronRequestId
        }, pollInterval: 120000}  );

    // define PR data type.

    const patronRequest =  data?.patronRequests?.content?.[0]
    const members = patronRequest?.clusterRecord?.members;

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

    // Check for the presence of a configured discovery scaffold URL. If it's there, render the URL: if not return blank.
    const bibClusterRecordUrl = publicRuntimeConfig.DISCOVERY_SCAFFOLD_URL ? publicRuntimeConfig.DISCOVERY_SCAFFOLD_URL + 'resourceDescription/' + patronRequest?.bibClusterId : '';
    
    return (
        loading ? <AdminLayout title={t("common.loading")} /> : 
        <AdminLayout title={patronRequest?.clusterRecord?.title}>
                <Stack direction="row" justifyContent="end">
                        <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> 
                </Stack>
                <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                        <AccordionSummary aria-controls="request-general-details" id="request_details_general" 
                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                </IconContext.Provider>}>
                                <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.general")} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.request_id")}
                                                </Typography>
                                                {patronRequest?.id}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.request_created")}
                                                </Typography>
                                                {dayjs(patronRequest?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.request_updated")} 
                                                </Typography>
                                                {dayjs(patronRequest?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.description")}
                                                </Typography>
                                                {patronRequest?.description}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.requestor_note")} 
                                                </Typography>
                                                {patronRequest?.requestorNote}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.status")} 
                                                </Typography>        
                                                {patronRequest?.status}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.error")} 
                                                </Typography>       
                                                {patronRequest?.errorMessage}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.active_workflow")} 
                                                </Typography>        
                                                {patronRequest?.activeWorkflow}
                                        </Stack>
                                </Grid>
                        </Grid>
                        </AccordionDetails>
                </Accordion>
                <Accordion expanded={expandedAccordions[6]} onChange={handleAccordionChange(6)}>
                        <AccordionSummary aria-controls="request-bib-record" id="request_bib_record" 
                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                </IconContext.Provider>}>
                                <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.bib_record")} </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.bib_cluster_id")}
                                                        </Typography>
                                                        {(bibClusterRecordUrl == '') ? patronRequest?.bibClusterId : <Link href={bibClusterRecordUrl} key="bibClusterRecordLink" target='_blank' rel="noreferrer" title={t("link.discovery_tip")}>{patronRequest?.bibClusterId}</Link>}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.title")}
                                                        </Typography>
                                                        {patronRequest?.clusterRecord?.title}
                                                </Stack>
                                        </Grid>
                                        {patronRequest?.clusterRecord?.members[0]?.author != null ? (
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.author")}
                                                        </Typography>
                                                        {patronRequest?.clusterRecord?.members[0]?.author}
                                                </Stack>
                                        </Grid>
                                        ) : null}
                                        {/* Add similar Grid items for other Typography elements */}
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.record_created")}
                                                        </Typography>
                                                        {dayjs(patronRequest?.clusterRecord?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.record_updated")}
                                                        </Typography>
                                                        {dayjs(patronRequest?.clusterRecord?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.selected_bib")}
                                                        </Typography>
                                                        {patronRequest?.clusterRecord?.selectedBib}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.source_record_id")}
                                                        </Typography>
                                                        {patronRequest?.clusterRecord?.members[0]?.sourceRecordId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.source_system_id")}
                                                        </Typography>
                                                        {patronRequest?.clusterRecord?.sourceSystemId}
                                                </Stack>
                                        </Grid>
                                </Grid>
                                <Card variant="outlined">
                                <Accordion expanded={expandedAccordions[7]} onChange={handleAccordionChange(7)}>
                                <AccordionSummary aria-controls="request-source-record" id="request_source_record" 
                                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                        </IconContext.Provider>}>
                                        <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.source_record")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                        {members && members.some((member: { sourceRecord: any; }) => member.sourceRecord !== null) ? (
                                                members.map((member: { sourceRecord: any; }, index: number) => (
                                                        member.sourceRecord && (
                                                        <pre key={index}>{JSON.stringify(member.sourceRecord, null, 2)}</pre>
                                                )
                                                ))
                                        ) : (
                                        <Typography variant="body1">{t("details.source_record_not_found")}</Typography>
                                )}                             
                                </AccordionDetails>
                                </Accordion>
                                </Card>
                                </AccordionDetails>
                </Accordion>
                <Accordion expanded={expandedAccordions[1]} onChange={handleAccordionChange(1)}>
                                <AccordionSummary aria-controls="request-patron-details" id="request_details_patron" 
                                        expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                        </IconContext.Provider>} >
                                        <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.patron")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.patron_id")}
                                                </Typography>
                                                {patronRequest?.patron?.id}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.patron_hostlms")}
                                                </Typography>
                                                {patronRequest?.patronHostlmsCode}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.requestor_id")}
                                                </Typography>
                                                {patronRequest?.requestingIdentity?.id}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.local_item_id")}
                                                </Typography>
                                                {patronRequest?.localItemId}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.local_item_status")}
                                                </Typography>
                                                {patronRequest?.localItemStatus}
                                        </Stack>
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Stack direction={"column"}>
                                                <Typography variant="attributeTitle">{t("details.local_bib_id")}
                                                </Typography>
                                                {patronRequest?.localBibId}
                                        </Stack>
                                </Grid>
                                </Grid>
                                </AccordionDetails>
                </Accordion>
                <Accordion expanded={expandedAccordions[2]} onChange={handleAccordionChange(2)}>
                                        <AccordionSummary aria-controls="request-pickup-details" id="request_details_pickup" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.pickup")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.pickup_code")}
                                                        </Typography>
                                                        {patronRequest?.pickupLocationCode}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.pickup_item_id")}
                                                        </Typography>
                                                        {patronRequest?.pickupItemId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.pickup_item_status")}
                                                        </Typography>
                                                        {patronRequest?.pickupItemStatus}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.pickup_item_type")}
                                                        </Typography>
                                                        {patronRequest?.pickupItemType}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.pickup_patron_id")}
                                                        </Typography>
                                                        {patronRequest?.pickupPatronId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.pickup_request_id")}
                                                        </Typography>
                                                        {patronRequest?.pickupRequestId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.pickup_request_status")}
                                                        </Typography>
                                                        {patronRequest?.pickupRequestStatus}
                                                </Stack>
                                        </Grid>
                                        </Grid>

                                        </AccordionDetails>
                        </Accordion>
                        <Accordion expanded={expandedAccordions[3]} onChange={handleAccordionChange(3)}>
                                        <AccordionSummary aria-controls="request-supplier-details" id="request_details_supplier" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.supplier")} </Typography>
                                        </AccordionSummary>
                                        {/* We may have to change this for multiple suppliers. Could make it a grid. */}
                                        <AccordionDetails>
                                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.supplier_id")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.id}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.supplier_ctype")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.canonicalItemType}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.date_created")}
                                                        </Typography>
                                                        {dayjs(patronRequest?.suppliers[0]?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.date_updated")}
                                                        </Typography>
                                                        {dayjs(patronRequest?.suppliers[0]?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.hostlms_code")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.hostLmsCode}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.active")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.isActive}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_item_id")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localItemId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_bib_id")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localBibId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_item_barcode")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localItemBarcode}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_item_loc")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localItemLocationCode}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_item_status")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localItemStatus}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_item_type")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localItemType}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_supplier_id")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_request_status")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localStatus}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.local_item_type")}
                                                        </Typography>
                                                        {patronRequest?.suppliers[0]?.localAgency}
                                                </Stack>
                                        </Grid>
                                        </Grid>
                                        </AccordionDetails>
                        </Accordion>
                        <Accordion expanded={expandedAccordions[4]} onChange={handleAccordionChange(4)}>
                                        <AccordionSummary aria-controls="request-details-borrowing" id="request_details_borrowing" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.borrowing", "Borrowing")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_request_id")}
                                                        </Typography>
                                                        {patronRequest?.localRequestId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_request_status")}
                                                        </Typography>
                                                        {patronRequest?.localRequestStatus}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_patron_id")}
                                                        </Typography>
                                                        {patronRequest?.requestingIdentity?.id}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_patron_type")}
                                                        </Typography>
                                                        {patronRequest?.requestingIdentity?.localPtype}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_virtual_id")}
                                                        </Typography>
                                                        {patronRequest?.localItemId}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_virtual_item_status")}
                                                        </Typography>
                                                        {patronRequest?.localItemStatus}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_virtual_type")}
                                                        </Typography>
                                                        {patronRequest?.localItemType}
                                                </Stack>
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Stack direction={"column"}>
                                                        <Typography variant="attributeTitle">{t("details.borrowing_virtual_bib_id")}
                                                        </Typography>
                                                        {patronRequest?.localBibId}
                                                </Stack>
                                        </Grid>
                                        </Grid>
                                        </AccordionDetails>
                        </Accordion>
                        <Accordion expanded={expandedAccordions[5]} onChange={handleAccordionChange(5)}>
                                        <AccordionSummary aria-controls="request-audit_log" id="request_audit_log" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.audit_log")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <ClientDataGrid 
                                                data={patronRequest?.audit}
                                                columns={[
                                                        {field: 'auditDate', headerName: "Audit date", minWidth: 60, flex: 0.2,
                                                        valueGetter: (params: { row: { auditDate: any; }; }) => {
								const auditDate = params.row.auditDate;
								return dayjs(auditDate).format('YYYY-MM-DD HH:mm:ss.SSS'); }},
                                                        {field: 'briefDescription', headerName: "Description", minWidth: 100, flex: 0.4},
                                                        {field: 'fromStatus', headerName: "fromStatus", minWidth: 50, flex: 0.25}, 
                                                        {field: 'toStatus', headerName: "toStatus", minWidth: 50, flex: 0.25}, ]}	
                                                type = "Audit"
                                                // This grid could show click-through details of its own for each audit log entry
                                                selectable= {false}
                                                noDataTitle={t("details.audit_log_no_data")}
                                                noDataMessage={t("details.audit_log_no_rows")}
                                                sortModel={[{field: 'auditDate', sort: 'desc'}]}		
                                                />
                                                <pre>{JSON.stringify(patronRequest?.audit?.auditData, null, 2)}</pre>
                                        </AccordionDetails>
                        </Accordion>
        </AdminLayout>
    )

}

export async function getServerSideProps(ctx: any) {
            const { locale } = ctx;
            let translations = {};
            if (locale) {
                translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
            }
            const patronRequestId = ctx.params.patronRequestId;
            return {
                props: {
                    patronRequestId,
                    ...translations,
                },
            };
}