import { ClientDataGrid } from "@components/ClientDataGrid";
import { AdminLayout } from "@layout";
import { Stack, Button, Typography, Accordion, AccordionDetails, AccordionSummary, Card } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import createApolloClient from "apollo-client";
import dayjs from "dayjs";
import { getSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { getPatronRequestById } from "src/queries/queries";

type PatronRequestDetails = {
    patronRequest: any,
    // update to use PatronRequest data model.
};

export default function PatronRequestDetails( {patronRequest}: PatronRequestDetails) {
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
        <AdminLayout title={patronRequest?.description}>
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
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_id")} </span>
                                        </Typography>
                                        {patronRequest.id}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_created")} </span>
                                        </Typography>
                                        {dayjs(patronRequest?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_updated")} </span>
                                        </Typography>
                                        {dayjs(patronRequest?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.description")}</span>
                                        </Typography>
                                        {patronRequest?.description}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.requestor_note")}</span> 
                                        </Typography>
                                        {patronRequest?.requestorNote}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.status")}</span> 
                                        </Typography>        
                                        {patronRequest?.status}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.error")}</span> 
                                        </Typography>       
                                        {patronRequest?.errorMessage}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.active_workflow")}</span> 
                                        </Typography>        
                                        {patronRequest?.activeWorkflow}
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
                                                <Typography component="div"> 
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.bib_cluster_id")}</span>
                                                </Typography>
                                                {patronRequest?.bibClusterId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.title")}</span>
                                                </Typography>
                                                {patronRequest?.clusterRecord?.title}
                                        </Grid>
                                        {patronRequest?.clusterRecord?.members[0]?.author != null ? (
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.author")}</span>
                                                </Typography>
                                                {patronRequest?.clusterRecord?.members[0]?.author}
                                        </Grid>
                                        ) : null}
                                        {/* Add similar Grid items for other Typography elements */}
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.request_created")}</span>
                                                </Typography>
                                                {dayjs(patronRequest?.clusterRecord?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.request_updated")}</span>
                                                </Typography>
                                                {dayjs(patronRequest?.clusterRecord?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.selected_bib")}</span>
                                                </Typography>
                                                {patronRequest?.clusterRecord?.selectedBib}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.source_record_id")}</span>
                                                </Typography>
                                                {patronRequest?.clusterRecord?.members[0]?.sourceRecordId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                        <span style={{ fontWeight: 'bold' }}>{t("details.source_system_id")}</span>
                                                </Typography>
                                                {patronRequest?.clusterRecord?.sourceSystemId}
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
                                        <pre>{JSON.stringify(patronRequest?.clusterRecord?.members[0]?.sourceRecord, null, 2)}</pre>
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
                                        <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.patron_id")}</span>
                                        </Typography>
                                        {patronRequest?.patron?.id}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.patron_hostlms")}</span>
                                        </Typography>
                                        {patronRequest?.patronHostlmsCode}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.requestor_id")}</span>
                                        </Typography>
                                        {patronRequest?.requestingIdentity?.id}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id")}</span>
                                        </Typography>
                                        {patronRequest?.localItemId}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span>
                                        </Typography>
                                        {patronRequest?.localItemStatus}
                                </Grid>
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id")}</span>
                                        </Typography>
                                        {patronRequest?.localBibId}
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
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_code")}</span>
                                                </Typography>
                                                {patronRequest?.pickupLocationCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_id")}</span>
                                                </Typography>
                                                {patronRequest?.pickupItemId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_status")}</span>
                                                </Typography>
                                                {patronRequest?.pickupItemStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_type")}</span>
                                                </Typography>
                                                {patronRequest?.pickupItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_patron_id")}</span>
                                                </Typography>
                                                {patronRequest?.pickupPatronId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_id")}</span>
                                                </Typography>
                                                {patronRequest?.pickupRequestId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_status")}</span>
                                                </Typography>
                                                {patronRequest?.pickupRequestStatus}
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
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.supplier_id")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.id}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.supplier_ctype")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.canonicalItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.date_created")}</span>
                                                </Typography>
                                                {dayjs(patronRequest?.suppliers[0]?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.date_updated")}</span>
                                                </Typography>
                                                {dayjs(patronRequest?.suppliers[0]?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_code")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.hostLmsCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.active")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.isActive}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localItemId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localBibId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_barcode")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localItemBarcode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_loc")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localItemLocationCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localItemStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_type")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_supplier_id")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localStatus}
                                                </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_type")}</span>
                                                </Typography>
                                                {patronRequest?.suppliers[0]?.localAgency}
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
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_request_id")}</span>
                                                </Typography>
                                                {patronRequest?.localRequestId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_request_status")}</span>
                                                </Typography>
                                                {patronRequest?.localRequestStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_patron_id")}</span>
                                                </Typography>
                                                {patronRequest?.requestingIdentity?.id}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_patron_type")}</span>
                                                </Typography>
                                                {patronRequest?.requestingIdentity?.localPtype}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_id")}</span>
                                                </Typography>
                                                {patronRequest?.localItemId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_item_status")}</span>
                                                </Typography>
                                                {patronRequest?.localItemStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_type")}</span>
                                                </Typography>
                                                {patronRequest?.localItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_bib_id")}</span>
                                                </Typography>
                                                {patronRequest?.localBibId}
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
                                                columns={[{ field: 'id', headerName: "ID", minWidth: 100, flex: 0.3}, 
                                                        {field: 'auditDate', headerName: "Audit date", minWidth: 30, flex: 0.2,
                                                        valueGetter: (params: { row: { auditDate: any; }; }) => {
								const auditDate = params.row.auditDate;
								return dayjs(auditDate).format('YYYY-MM-DD HH:mm:ss'); }},
                                                        {field: 'briefDescription', headerName: "Description", minWidth: 100, flex: 0.5},
                                                        {field: 'fromStatus', headerName: "fromStatus", minWidth: 50, flex: 0.2}, 
                                                        {field: 'toStatus', headerName: "toStatus", minWidth: 50, flex: 0.2}, ]}	
                                                type = "Audit"
                                                // This grid could show click-through details of its own for each audit log entry
                                                selectable= {false}
                                                noDataTitle={"No audit log found."}
                                                noDataMessage={"Try changing your filters or search terms."}
                                                />
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
        const session = await getSession(ctx);
        // The way this works is through Dynamic Routing. 
        // That means that the filename must match the attribute name exactly: i.e. just 'requestId' in the filename wouldn't work here.
        // NextJS needs to know the id so that it can use SSR to dynamically generate a page based on it.
        // That's why we have to fetch the data here server-side.
        const patronRequestId = ctx.params.patronRequestId
        const client = createApolloClient(session?.accessToken);
        const { data } = await client.query({
            query: getPatronRequestById,
            variables: {
                query: "id:"+patronRequestId
            }        
          });
        const patronRequest = data?.patronRequests?.content?.[0];    
        return {
          props: {
            patronRequestId,
            patronRequest,
            ...translations,
          },
        }
    }

