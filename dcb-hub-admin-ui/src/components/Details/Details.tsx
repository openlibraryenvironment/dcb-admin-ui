import { forwardRef, useState } from 'react';
import { CardContent, Card, Typography, Dialog, Slide, AppBar, IconButton, Toolbar, DialogContent, AccordionSummary, Accordion, AccordionDetails, Button, Stack }from "@mui/material"
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import { TransitionProps } from '@mui/material/transitions';
import dayjs from 'dayjs';
import { ClientDataGrid } from '@components/ClientDataGrid';
import { MdClose, MdExpandMore } from 'react-icons/md'
import { IconContext } from 'react-icons';
import { useTranslation } from 'next-i18next';

type DetailsType = {
        i: any,
        content: any,
        show: boolean,
        onClose: any,
        type: string;
};


const Transition = forwardRef(function Transition(
        props: TransitionProps & {
          children: React.ReactElement;
        },
        ref: React.Ref<unknown>,
      ) {
        return <Slide direction="left" ref={ref} {...props} />;
});

export default function Details({i, content, show, onClose, type}: DetailsType) {
        const { t } = useTranslation();


        const findItemById = (array: any[], id: any) => {
                return array.find(item => item.id === id);
                };
        const toDisplay = findItemById(content, i);

        // experimental - fix with a map solution as numbers of needed accordions will change
        // State values for expanded accordions
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
                 <Dialog open={show} onClose={onClose} fullScreen TransitionComponent={Transition} aria-labelledby="details-dialog">
                        <div>
                                <AppBar sx={{ position: 'relative' }}>
                                <Toolbar>
                                        <IconButton
                                        edge="start"
                                        color="inherit"
                                        onClick={onClose}
                                        aria-label="close"
                                        >
                                        <IconContext.Provider value={{size: "1em"}}>
                                                <MdClose />
                                        </IconContext.Provider>
                                        </IconButton>
                                        <Typography sx={{ ml: 2, flex: 1, fontWeight: 'bold'}} component="div" variant="h3">
                                        {toDisplay?.name ?? toDisplay?.id}
                                        </Typography>
                                </Toolbar>
                        </AppBar>
                <DialogContent>
                        {type == "patronRequests"? <Stack direction="row" justifyContent="end">
                                <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> </Stack> : null}
                        {type == "patronRequests"?<Card variant = 'outlined'>
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
                                                                {toDisplay?.id}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_created")} </span>
                                                                </Typography>
                                                                {dayjs(toDisplay?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_updated")} </span>
                                                                </Typography>
                                                                {dayjs(toDisplay?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.description")}</span>
                                                                </Typography>
                                                                {toDisplay?.description}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.requestor_note")}</span> 
                                                                </Typography>
                                                                {toDisplay?.requestorNote}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.status")}</span> 
                                                                </Typography>        
                                                                {toDisplay?.status}
                                                                
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.error")}</span> 
                                                                </Typography>       
                                                                {toDisplay?.errorMessage}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.active_workflow")}</span> 
                                                                </Typography>        
                                                                {toDisplay?.activeWorkflow}
                                                        </Grid>
                                                </Grid>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "patronRequests"?<Card variant = 'outlined'>
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
                                                        {toDisplay?.bibClusterId}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.title")}</span>
                                                        </Typography>
                                                        {toDisplay?.clusterRecord?.title}
                                                </Grid>
                                                {toDisplay?.clusterRecord?.members[0]?.author != null ? (
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.author")}</span>
                                                        </Typography>
                                                        {toDisplay?.clusterRecord?.members[0]?.author}
                                                </Grid>
                                                ) : null}
                                                {/* Add similar Grid items for other Typography elements */}
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.request_created")}</span>
                                                        </Typography>
                                                        {dayjs(toDisplay?.clusterRecord?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.request_updated")}</span>
                                                        </Typography>
                                                        {dayjs(toDisplay?.clusterRecord?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.selected_bib")}</span>
                                                        </Typography>
                                                        {toDisplay?.clusterRecord?.selectedBib}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.source_record_id")}</span>
                                                        </Typography>
                                                        {toDisplay?.clusterRecord?.members[0]?.sourceRecordId}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.source_system_id")}</span>
                                                        </Typography>
                                                        {toDisplay?.clusterRecord?.sourceSystemId}
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
                                                <pre>{JSON.stringify(toDisplay?.clusterRecord?.members[0]?.sourceRecord, null, 2)}</pre>
                                        </AccordionDetails>
                                        </Accordion>
                                        </Card>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}
                        {type == "patronRequests"?<Card variant = 'outlined'>
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
                                                {toDisplay?.patron?.id}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.patron_hostlms")}</span>
                                                </Typography>
                                                {toDisplay?.patronHostlmsCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.requestor_id")}</span>
                                                </Typography>
                                                {toDisplay?.requestingIdentity?.id}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.patron_hostlms")}</span>
                                                </Typography>
                                                {toDisplay?.patronHostlmsCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id")}</span>
                                                </Typography>
                                                {toDisplay?.localItemId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span>
                                                </Typography>
                                                {toDisplay?.localItemStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id")}</span>
                                                </Typography>
                                                {toDisplay?.localBibId}
                                        </Grid>
                                        </Grid>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "patronRequests"?<Card variant = 'outlined'>
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
                                                {toDisplay?.pickupLocationCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_id")}</span>
                                                </Typography>
                                                {toDisplay?.pickupItemId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_status")}</span>
                                                </Typography>
                                                {toDisplay?.pickupItemStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_type")}</span>
                                                </Typography>
                                                {toDisplay?.pickupItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_patron_id")}</span>
                                                </Typography>
                                                {toDisplay?.pickupPatronId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_id")}</span>
                                                </Typography>
                                                {toDisplay?.pickupRequestId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_status")}</span>
                                                </Typography>
                                                {toDisplay?.pickupRequestStatus}
                                        </Grid>
                                        </Grid>

                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "patronRequests"?<Card variant = 'outlined'>
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
                                                {toDisplay?.suppliers[0]?.id}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.supplier_ctype")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.canonicalItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.date_created")}</span>
                                                </Typography>
                                                {dayjs(toDisplay?.suppliers[0]?.dateCreated).format('YYYY-MM-DD HH:mm')}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.date_updated")}</span>
                                                </Typography>
                                                {dayjs(toDisplay?.suppliers[0]?.dateUpdated).format('YYYY-MM-DD HH:mm')}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_code")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.hostLmsCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.active")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.isActive}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localItemId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localBibId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_barcode")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localItemBarcode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_loc")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localItemLocationCode}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localItemStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_type")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_supplier_id")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localStatus}
                                                </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.local_item_type")}</span>
                                                </Typography>
                                                {toDisplay?.suppliers[0]?.localAgency}
                                        </Grid>
                                        </Grid>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}              
                        {type == "patronRequests"?<Card variant = 'outlined'>
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
                                                {toDisplay?.localRequestId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_request_status")}</span>
                                                </Typography>
                                                {toDisplay?.localRequestStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_patron_id")}</span>
                                                </Typography>
                                                {toDisplay?.requestingIdentity?.id}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_patron_type")}</span>
                                                </Typography>
                                                {toDisplay?.requestingIdentity?.localPtype}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_id")}</span>
                                                </Typography>
                                                {toDisplay?.localItemId}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_item_status")}</span>
                                                </Typography>
                                                {toDisplay?.localItemStatus}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_type")}</span>
                                                </Typography>
                                                {toDisplay?.localItemType}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_bib_id")}</span>
                                                </Typography>
                                                {toDisplay?.localBibId}
                                        </Grid>
                                        </Grid>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "patronRequests"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[5]} onChange={handleAccordionChange(5)}>
                                        <AccordionSummary aria-controls="request-audit_log" id="request_audit_log" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.audit_log")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <ClientDataGrid 
                                                data={toDisplay?.audit}
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
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Agency Details'*/}
                        {type == "agencies" ? (
                        <Card variant="outlined">
                        <CardContent>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.agency_id")}</span>
                                </Typography>
                                {toDisplay?.id}
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.agency_name")}</span>
                                </Typography>
                                {toDisplay?.name}
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.agency_code")}</span>
                                </Typography>
                                {toDisplay?.code}
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.agency_hostlms")}</span>
                                </Typography>
                                {toDisplay?.hostLMSCode}
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.agency_auth")}</span>
                                </Typography>
                                {toDisplay?.authProfile}
                        </Grid>
                        </Grid>
                        </CardContent>
                        </Card>
                        ) : null}
                        {type == "agencies"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="agency_details_location_info" id="agency_details_location_info" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.location_info")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.long")}</span>
                                                {toDisplay?.longitude} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.lat")}</span>
                                                {toDisplay?.latitude} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}               
                        {/* These are the items we typically only need to show for 'HostLMS Details'.*/}
                        {type == "hostLms"? <Stack direction="row" justifyContent="end">
                                <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> </Stack> : null}
                        {type == "hostLms"?<Card variant = 'outlined'>
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
                                                        {toDisplay?.id}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_code")}</span>
                                                        </Typography>
                                                        {toDisplay?.code}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_name")}</span>
                                                        </Typography>
                                                        {toDisplay?.name}
                                                        </Grid>
                                                        <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div">
                                                                <span style={{ fontWeight: 'bold' }}>{t("details.lms_client")}</span>
                                                        </Typography>
                                                        {toDisplay?.lmsClientClass}
                                                        </Grid>
                                                </Grid>
                                        </AccordionDetails>
                        </Accordion>
                        </Card> : null}
                        {type == "hostLms"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[1]} onChange={handleAccordionChange(1)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details" id="hostlms_details_client_config" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant="h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config", "Client config")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                        {toDisplay?.clientConfig?.apikey != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_api")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.apikey}

                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.ingest != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_ingest")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.ingest}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['shelving-locations'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_shelving")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['shelving-locations']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['num-records-to-generate'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_records")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['num-records-to-generate']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['record-syntax'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_record_syntax")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['record-syntax']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['metadata-prefix'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_metadata_prefix")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['metadata-prefix']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['base-url'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_base")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['base-url']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['access-id'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_access_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['access-id']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['domain-id'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_domain_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['domain-id']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['page-size'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_page_size")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['page-size']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['access-key'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_access_key")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['access-key']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['staff-username'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_staff_username")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['staff-username']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.['staff-password'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_staff_password")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.['staff-password']}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.secret != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_secret")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.secret}
                                        </Grid>
                                        )}
                                        {toDisplay?.clientConfig?.key != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_key")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.key}
                                        </Grid>
                                        )}
                                </Grid>
                                {/* // For the 'item' object on some HostLMS */}
                                {toDisplay?.clientConfig?.item != null ?<Card variant = 'outlined'>
                                <Accordion expanded={expandedAccordions[2]} onChange={handleAccordionChange(2)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details-item" id="hostlms_details_client_config_item" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography  variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config_item")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                {toDisplay?.clientConfig?.item?.['fine-code-id'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_fine")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.item?.['fine-code-id']}
                                        </Grid>
                                        )}
                                {toDisplay?.clientConfig?.item?.['renewal-limit'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_renewal_limit")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.item?.['renewal-limit']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.item?.['barcode-prefix'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_barcode_prefix")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.item?.['barcode-prefix']}
                                        </Grid>
                                )}
                                {toDisplay?.clientConfig?.item?.['history-action-id'] != null && (
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_history_action_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.item?.['history-action-id']}
                                        </Grid>
                                )}
                                {toDisplay?.clientConfig?.item?.['shelving-scheme-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_shelving_scheme_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.item?.['shelving-scheme-id']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.item?.['loan-period-code-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_loan_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.item?.['loan-period-code-id']}
                                </Grid>
                                )}
                                </Grid>
                                </AccordionDetails>
                                </Accordion>
                                </Card>: null }           
                                {/* // For the 'PAPI' object on some HostLMS */}
                                {toDisplay?.clientConfig?.papi != null ?<Card variant = 'outlined'>
                                <Accordion expanded={expandedAccordions[3]} onChange={handleAccordionChange(3)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details-papi" id="hostlms_details_client_config_papi" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography  variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config_papi")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                {toDisplay?.clientConfig?.papi?.['app-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_app_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.papi?.['app-id']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.papi?.['org-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_org_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.papi?.['org-id']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.papi?.['lang-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_lang_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.papi?.['lang-id']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.papi?.['papi-version'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_version")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.papi?.['papi-version']}
                                </Grid>
                                )}
                                </Grid>
                                </AccordionDetails>
                                </Accordion>
                                </Card>: null } 
                                {/* // For 'services' object on some HostLMS */}
                                {toDisplay?.clientConfig?.services != null ?<Card variant = 'outlined'>
                                <Accordion expanded={expandedAccordions[4]} onChange={handleAccordionChange(4)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details-services" id="hostlms_details_client_config_services" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography  variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.client_config_services")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                {toDisplay?.clientConfig?.services?.language!= null ? 
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_language")}</span>
                                        </Typography> 
                                        {toDisplay?.clientConfig?.services?.language}
                                </Grid>: null}
                                
                                {toDisplay?.clientConfig?.services?.['product-id']!= null ? 
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_product_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.services?.['product-id']}
                                </Grid> : null}
                                {toDisplay?.clientConfig?.services?.['site-domain']!= null ? 
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_site_domain")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.services?.['site-domain']}
                                </Grid> : null}
                                {toDisplay?.clientConfig?.services?.['workstation-id']!= null ?
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_workstation_id")}</span>
                                        </Typography>
                                        {toDisplay?.clientConfig?.services?.['workstation-id']}
                                </Grid> : null}
                                {toDisplay?.clientConfig?.services?.['organisation-id']!= null ? 
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_organisation_id")}</span>
                                        </Typography> 
                                        {toDisplay?.clientConfig?.services?.['organisation-id']}
                                </Grid>: null}
                                {toDisplay?.clientConfig?.services?.['services-version']!= null ? 
                                <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_version")}</span>
                                        </Typography> 
                                        {toDisplay?.clientConfig?.services?.['services-version']}
                                </Grid>: null}
                                {toDisplay?.clientConfig?.services?.language != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_language")}</span>
                                </Typography>
                                {toDisplay?.clientConfig?.services?.language}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.services?.['product-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_product_id")}</span>
                                </Typography>
                                {toDisplay?.clientConfig?.services?.['product-id']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.services?.['site-domain'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_site_domain")}</span>
                                </Typography>
                                {toDisplay?.clientConfig?.services?.['site-domain']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.services?.['workstation-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_workstation_id")}</span>
                                </Typography>
                                {toDisplay?.clientConfig?.services?.['workstation-id']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.services?.['organisation-id'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                        <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_organisation_id")}</span>
                                </Typography>
                                {toDisplay?.clientConfig?.services?.['organisation-id']}
                                </Grid>
                                )}
                                {toDisplay?.clientConfig?.services?.['services-version'] != null && (
                                <Grid xs={2} sm={4} md={4}>
                                <Typography component="div">
                                <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_version")}</span>
                                </Typography>
                                {toDisplay?.clientConfig?.services?.['version']}
                                </Grid>
                                )}
                                </Grid>
                                </AccordionDetails>
                                </Accordion>
                                </Card>: null }
                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "locations"?<Card variant = 'outlined'>
                                <CardContent>
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.location_name")}</span>
                                                </Typography>
                                                {toDisplay?.name}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.location_type")}</span>
                                                </Typography>
                                                {toDisplay?.type}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.location_id")}</span>
                                                </Typography>
                                                {toDisplay?.id}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                        <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.location_code")}</span>
                                                </Typography>
                                                {toDisplay?.code}
                                        </Grid>
                                        <Grid xs={2} sm={4} md={4}>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.location_agency")}</span>
                                                </Typography>
                                                {toDisplay?.agency?.id}
                                        </Grid>
                                        </Grid>
                                </CardContent>
                        </Card>: null}
                        {type == "locations"?<Card variant = 'outlined'>
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
                                                {toDisplay?.longitude}
                                                </Typography>
                                                <Typography component="div">
                                                <span style={{ fontWeight: 'bold' }}>{t("details.lat")}</span>
                                                {toDisplay?.latitude}
                                                </Typography>
                                        </AccordionDetails>
                                        </Accordion>
                        </Card>: null}               
                        {/* These are the items we typically only need to show for 'Group Details'*/}
                        {/* Table of group member agencies. These will be editable in future versions)'*/}
                        {type == "agencyGroups"?<Card variant = 'outlined'>
                        <CardContent>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_name")}</span>
                                </Typography>
                                {toDisplay?.name} 
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_code")}</span>
                                </Typography>
                                {toDisplay?.code} 
                        </Grid>
                        <Grid xs={2} sm={4} md={4}>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_id")}</span>
                                </Typography>
                                {toDisplay?.id}
                        </Grid>
                        </Grid>
                        </CardContent>
                        </Card>: null}
                        {type == "agencyGroups"?<Card variant='outlined'>
                                <CardContent>
                                        <ClientDataGrid 
                                        data={toDisplay?.members.map((item: { agency: any; }) => item.agency) ?? []}
                                        columns={[ {field: 'name', headerName: "Agency name", minWidth: 100, flex: 1}, 
                                                { field: 'id', headerName: "Agency ID", minWidth: 50, flex: 0.5}, 
                                                { field: 'code', headerName: "Agency code", minWidth: 50, flex: 0.5}]}	
                                        type = "GroupDetails"
                                        // This grid doesn't need to show Details
                                        selectable= {false}
                                        noDataTitle={"No agencies found."}
                                        noDataMessage={"Try changing your filters or search terms."}
                                        />                                
                                </CardContent>
                        </Card>: null}
                        {type == "sourceBibs"? <Stack direction="row" justifyContent="end">
                                <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> </Stack> : null}
                        {type == "sourceBibs"?<Card variant = 'outlined'>
                                <CardContent>
                                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_bib_id")}</span>
                                                        </Typography>
                                                        {toDisplay?.id}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.title")}</span>
                                                        </Typography>
                                                        {toDisplay?.title}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.author")}</span>
                                                        </Typography>
                                                        {toDisplay?.author}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_system_id")}</span>
                                                        </Typography>
                                                        {toDisplay?.sourceSystemId} 
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_record_id")}</span>
                                                        </Typography>
                                                        {toDisplay?.sourceRecordId} 
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.contributor_id")}</span>
                                                        </Typography>
                                                        {toDisplay?.contributesTo?.id}
                                                </Grid>
                                                <Grid xs={2} sm={4} md={4}>
                                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.contributor_title")}</span>
                                                        </Typography>
                                                        {toDisplay?.contributesTo?.title}
                                                </Grid>
                                        </Grid>
                                        <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                                        <AccordionSummary aria-controls="source-bibs-json-details" id="source-bibs-json-details" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.canonical_metadata")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <pre>{JSON.stringify(toDisplay?.canonicalMetadata, null, 2)}</pre>
                                        </AccordionDetails>
                                        </Accordion>
                                        <Accordion expanded={expandedAccordions[8]} onChange={handleAccordionChange(8)}>
                                        <AccordionSummary aria-controls="source-bibs-source-record-json-details" id="source-bibs-source-record-json-details" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography variant = "h3" sx={{ fontWeight: 'bold' }}> {t("details.source_record")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <pre>{JSON.stringify(toDisplay?.sourceRecord, null, 2)}</pre>
                                        </AccordionDetails>
                                        </Accordion>
                                </CardContent>
                        </Card>: null}
                </DialogContent>
                </div>
        </Dialog>
        );
}
