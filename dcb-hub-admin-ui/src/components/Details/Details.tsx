import { forwardRef, useState } from 'react';
import { CardContent, Card, Typography, Dialog, Slide, AppBar, IconButton, Toolbar, DialogContent, AccordionSummary, Accordion, AccordionDetails, Button, Stack }from "@mui/material"
import { TransitionProps } from '@mui/material/transitions';
import dayjs from 'dayjs';
import { DataGrid } from '@components/DataGrid';
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
                                        <Typography sx={{ ml: 2, flex: 1 }} component="div" variant="h6">
                                        {t("details.view")} {type} {t("details.details")} - {toDisplay?.name ?? toDisplay?.id}
                                        </Typography>
                                </Toolbar>
                        </AppBar>
                <DialogContent>
                        {/* // These items are shown for every 'Details' instance, excluding Requests, sourceBibs, and HostLMS due to their different UX*/}                        
                        {(type !== "Request" && type!== "HostLMS" && type!== "sourceBibs") ?<Card variant = 'outlined'>
                        <CardContent>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} {t("details.id")}: </span>
                        {toDisplay?.id}
                        </Typography>
                        </CardContent>
                        </Card>: null}
                        {(type !== "Request" && type!== "HostLMS" && type!== "sourceBibs")?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} {t("details.code")}: </span>
                                 {toDisplay?.code} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* // These are the items that we typically need to only show for 'Request Details', hence the conditional rendering*/}
                        {type == "Request"? <Stack direction="row" justifyContent="end">
                                <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> </Stack> : null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                                        <AccordionSummary aria-controls="request-general-details" id="request_details_general" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.general")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_id")} </span>
                                                {toDisplay?.id}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_created")} </span>
                                                {dayjs(toDisplay?.dateCreated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_updated")} </span>
                                                {dayjs(toDisplay?.dateUpdated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.description")}</span>
                                                {toDisplay?.description}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.requestor_note")}</span> 
                                                {toDisplay?.requestorNote}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.status")}</span> 
                                                {toDisplay?.status}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.error")}</span> 
                                                {toDisplay?.errorMessage}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.active_workflow")}</span> 
                                                {toDisplay?.activeWorkflow}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                                <Accordion expanded={expandedAccordions[6]} onChange={handleAccordionChange(6)}>
                                        <AccordionSummary aria-controls="request-bib-record" id="request_bib_record" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.bib_record")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.bib_cluster_id")}</span> 
                                                {toDisplay?.bibClusterId}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.title")}</span> 
                                                {toDisplay?.clusterRecord?.title}</Typography>
                                        {toDisplay?.clusterRecord?.members[0]?.author != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.author")}</span> 
                                                {toDisplay?.clusterRecord?.members[0]?.author}</Typography> : null}
                                                {/* If author isn't where it should be, we can fetch from canonical metadata */}
                                        {/* {toDisplay?.clusterRecord?.members[0]?.canonicalMetadata?.agents[0]?.label != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.author")}</span> 
                                                {toDisplay?.clusterRecord?.members[0]?.canonicalMetadata?.agents[0]?.label}</Typography> : null}                        */}
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_created")} </span>
                                                {dayjs(toDisplay?.clusterRecord?.dateCreated).format('YYYY-MM-DD HH:mm')}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_updated")} </span>
                                                {dayjs(toDisplay?.clusterRecord?.dateUpdated).format('YYYY-MM-DD HH:mm')}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.selected_bib")}</span> 
                                                {toDisplay?.clusterRecord?.selectedBib}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_record_id")}</span> 
                                                {toDisplay?.clusterRecord?.members[0]?.sourceRecordId}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_system_id")}</span> 
                                                {toDisplay?.clusterRecord?.sourceSystemId}</Typography>
                                        <Card variant="outlined">
                                        <Accordion expanded={expandedAccordions[7]} onChange={handleAccordionChange(7)}>
                                        <AccordionSummary aria-controls="request-source-record" id="request_source_record" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.source_record")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <pre>{JSON.stringify(toDisplay?.clusterRecord?.members[0]?.sourceRecord, null, 2)}</pre>
                                        </AccordionDetails>
                                        </Accordion>
                                        </Card>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[1]} onChange={handleAccordionChange(1)}>
                                        <AccordionSummary aria-controls="request-patron-details" id="request_details_patron" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>} >
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.patron")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.patron_id")} </span>
                                                        {toDisplay?.patron?.id}
                                                </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.patron_hostlms")}</span>
                                                {toDisplay?.patronHostlmsCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.requestor_id")}</span>
                                                {toDisplay?.requestingIdentity?.id}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.patron_hostlms")}</span>
                                                {toDisplay?.patronHostlmsCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id")}</span>
                                                {toDisplay?.localItemId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span>
                                                {toDisplay?.localItemStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id")}</span>
                                                {toDisplay?.localBibId}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[2]} onChange={handleAccordionChange(2)}>
                                        <AccordionSummary aria-controls="request-pickup-details" id="request_details_pickup" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.pickup")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_code")}</span> 
                                                {toDisplay?.pickupLocationCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_id")}</span> 
                                                {toDisplay?.pickupItemId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_status")}</span> 
                                                {toDisplay?.pickupItemStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_type")}</span> 
                                                {toDisplay?.pickupItemType}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_patron_id")}</span> 
                                                {toDisplay?.pickupPatronId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_id")}</span> 
                                                {toDisplay?.pickupRequestId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_status")}</span> 
                                                {toDisplay?.pickupRequestStatus}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[3]} onChange={handleAccordionChange(3)}>
                                        <AccordionSummary aria-controls="request-supplier-details" id="request_details_supplier" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.supplier")} </Typography>
                                        </AccordionSummary>
                                        {/* We may have to change this for multiple suppliers. Could make it a grid. */}
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.supplier_id")}</span> 
                                                {toDisplay?.suppliers[0]?.id}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.supplier_ctype")}</span> 
                                                {toDisplay?.suppliers[0]?.canonicalItemType}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.date_created")}</span> 
                                                {dayjs(toDisplay?.suppliers[0]?.dateCreated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.date_updated")}</span> 
                                                {dayjs(toDisplay?.suppliers[0]?.dateUpdated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_code")}</span> 
                                                {toDisplay?.suppliers[0]?.hostLmsCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.active")}</span> 
                                                {toDisplay?.suppliers[0]?.isActive}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id")}</span> 
                                                {toDisplay?.suppliers[0]?.localBibId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_barcode")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemBarcode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_loc")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemLocationCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_type")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemType}</Typography>
                                                {/* We need clarity on what local ID is meant to be in this context - likewise for status and ctype */}
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_supplier_id")}</span> 
                                                {toDisplay?.suppliers[0]?.localId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status")}</span> 
                                                {toDisplay?.suppliers[0]?.localStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_type")}</span> 
                                                {toDisplay?.suppliers[0]?.localAgency}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}              
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[4]} onChange={handleAccordionChange(4)}>
                                        <AccordionSummary aria-controls="request-details-borrowing" id="request_details_borrowing" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.borrowing", "Borrowing")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_request_id")}</span>
                                                {toDisplay?.localRequestId}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_request_status")}</span>
                                                {toDisplay?.localRequestStatus}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_patron_id")}</span>
                                                {toDisplay?.requestingIdentity?.id}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_patron_type")}</span>
                                                {toDisplay?.requestingIdentity?.localPtype}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_id")}</span>
                                                {toDisplay?.localItemId}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_item_status")}</span>
                                                {toDisplay?.localItemStatus}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_type")}</span>
                                                {toDisplay?.localItemType}</Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.borrowing_virtual_bib_id")}</span>
                                                {toDisplay?.localBibId}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[5]} onChange={handleAccordionChange(5)}>
                                        <AccordionSummary aria-controls="request-audit_log" id="request_audit_log" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.audit_log")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <DataGrid 
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
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.agency_name")}</span>
                                {toDisplay?.name}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.agency_hostlms")}</span>
                                {toDisplay?.hostLMSCode}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.agency_auth")}</span>
                                {toDisplay?.authProfile} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="agency_details_location_info" id="agency_details_location_info" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.location_info")} </Typography>
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
                        {type == "HostLMS"? <Stack direction="row" justifyContent="end">
                                <Button onClick={expandAll}>{expandedAccordions[0] ?  t("details.collapse"): t("details.expand")}</Button> </Stack> : null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                                        <AccordionSummary aria-controls="hostlms-general-details" id="hostlms_details_general" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.general", "General")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_id")}</span>
                                                {toDisplay?.id} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_code")}</span>
                                                {toDisplay?.code} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_name")}</span>
                                                {toDisplay?.name} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.lms_client")}</span>
                                                {toDisplay?.lmsClientClass} </Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card> : null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[1]} onChange={handleAccordionChange(1)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details" id="hostlms_details_client_config" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.client_config", "Client config")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                {toDisplay?.clientConfig?.apikey != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_api")}</span>
                                        {toDisplay?.clientConfig?.apikey} </Typography> : null}
                                {toDisplay?.clientConfig?.ingest != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_ingest")}</span>
                                        {toDisplay?.clientConfig?.ingest} </Typography> : null}
                                {toDisplay?.clientConfig?.['shelving-locations'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_shelving")}</span>
                                        {toDisplay?.clientConfig?.['shelving-locations']} </Typography> : null}
                                {toDisplay?.clientConfig?.['num-records-to-generate'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_records")}</span>
                                        {toDisplay?.clientConfig?.['num-records-to-generate']} </Typography> : null}
                                {toDisplay?.clientConfig?.['record-syntax'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_record_syntax")}</span>
                                        {toDisplay?.clientConfig?.['record-syntax']} </Typography> : null}
                                {toDisplay?.clientConfig?.['metadata-prefix'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_metadata_prefix")}</span>
                                        {toDisplay?.clientConfig?.['metadata-prefix']} </Typography> : null}
                                {toDisplay?.clientConfig?.['base-url'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_base")}</span>
                                        {toDisplay?.clientConfig?.['base-url']} </Typography> : null}
                                {toDisplay?.clientConfig?.['access-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_access_id")}</span>
                                        {toDisplay?.clientConfig?.['access-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.['domain-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_domain_id")}</span>
                                        {toDisplay?.clientConfig?.['domain-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.['page-size'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_page_size")}</span>
                                        {toDisplay?.clientConfig?.['page-size']} </Typography> : null}
                                {toDisplay?.clientConfig?.['access-key'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_access_key")}</span>
                                        {toDisplay?.clientConfig?.['access-key']} </Typography> : null}
                                {toDisplay?.clientConfig?.['staff-username'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_staff_username")}</span>
                                        {toDisplay?.clientConfig?.['staff-username']} </Typography> : null} 
                                {toDisplay?.clientConfig?.['staff-password'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_staff_password")}</span>
                                        {toDisplay?.clientConfig?.['staff-password']} </Typography> : null} 
                                {toDisplay?.clientConfig?.secret != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_secret")}</span>
                                        {toDisplay?.clientConfig?.secret} </Typography> : null}
                                {toDisplay?.clientConfig?.key != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_key")}</span>
                                        {toDisplay?.clientConfig?.key} </Typography> : null} 
                                {/* // For the 'item' object on some HostLMS */}
                                {toDisplay?.clientConfig?.item != null ?<Card variant = 'outlined'>
                                <Accordion expanded={expandedAccordions[2]} onChange={handleAccordionChange(2)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details-item" id="hostlms_details_client_config_item" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.client_config_item")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                {toDisplay?.clientConfig?.item?.['fine-code-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_fine")}</span>
                                        {toDisplay?.clientConfig?.item?.['fine-code-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.item?.['renewal-limit'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_renewal_limit")}</span>
                                        {toDisplay?.clientConfig?.item?.['renewal-limit']} </Typography> : null}
                                {toDisplay?.clientConfig?.item?.['barcode-prefix'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_barcode_prefix")}</span>
                                        {toDisplay?.clientConfig?.item?.['barcode-prefix']} </Typography> : null}
                                {toDisplay?.clientConfig?.item?.['history-action-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_history_action_id")}</span>
                                        {toDisplay?.clientConfig?.item?.['history-action-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.item?.['shelving-scheme-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_shelving_scheme_id")}</span>
                                        {toDisplay?.clientConfig?.item?.['shelving-scheme-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.item?.['loan-period-code-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_loan_id")}</span>
                                        {toDisplay?.clientConfig?.item?.['loan-period-code-id']} </Typography> : null}
                                </AccordionDetails>
                                </Accordion>
                                </Card>: null }                        
                                {/* // For the 'PAPI' object on some HostLMS */}
                                {toDisplay?.clientConfig?.papi != null ?<Card variant = 'outlined'>
                                <Accordion expanded={expandedAccordions[3]} onChange={handleAccordionChange(3)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details-papi" id="hostlms_details_client_config_papi" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.client_config_papi")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                {toDisplay?.clientConfig?.papi?.['app-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_app_id")}</span>
                                        {toDisplay?.clientConfig?.papi?.['app-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.papi?.['org-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_org_id")}</span>
                                        {toDisplay?.clientConfig?.papi?.['org-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.papi?.['lang-id'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_lang_id")}</span>
                                        {toDisplay?.clientConfig?.papi?.['lang-id']} </Typography> : null}
                                {toDisplay?.clientConfig?.papi?.['papi-version'] != null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_papi_version")}</span>
                                        {toDisplay?.clientConfig?.papi?.['papi-version']} </Typography> : null}
                                </AccordionDetails>
                                </Accordion>
                                </Card>: null } 
                                {/* // For 'services' object on some HostLMS */}
                                {toDisplay?.clientConfig?.services != null ?<Card variant = 'outlined'>
                                <Accordion expanded={expandedAccordions[4]} onChange={handleAccordionChange(4)}>
                                <AccordionSummary aria-controls="hostlms-client-config-details-services" id="hostlms_details_client_config_services" expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.client_config_services")} </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                {toDisplay?.clientConfig?.services?.language!= null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_language")}</span>
                                        {toDisplay?.clientConfig?.services?.language}</Typography> : null}
                                {toDisplay?.clientConfig?.services?.['product-id']!= null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_product_id")}</span>
                                        {toDisplay?.clientConfig?.services?.['product-id']}</Typography> : null}
                                {toDisplay?.clientConfig?.services?.['site-domain']!= null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_site_domain")}</span>
                                        {toDisplay?.clientConfig?.services?.['site-domain']}</Typography> : null}
                                {toDisplay?.clientConfig?.services?.['workstation-id']!= null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_workstation_id")}</span>
                                        {toDisplay?.clientConfig?.services?.['workstation-id']}</Typography> : null}
                                {toDisplay?.clientConfig?.services?.['organisation-id']!= null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_organisation_id")}</span>
                                        {toDisplay?.clientConfig?.services?.['organisation-id']}</Typography> : null}
                                {toDisplay?.clientConfig?.services?.['services-version']!= null ? <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_services_version")}</span>
                                        {toDisplay?.clientConfig?.services?.['services-version']}</Typography> : null}
                                </AccordionDetails>
                                </Accordion>
                                </Card>: null } 
                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Location Details'*/}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_name")} </span>
                                {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_type")} </span>
                                {toDisplay?.type} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography  component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_agency")} </span>
                                {toDisplay?.agency?.id} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="client-config-location-details" id="client-config-location-details" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.location_info")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.long")}</span>
                                                {toDisplay?.longitude} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.lat")}</span>
                                                {toDisplay?.latitude} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Group Details'*/}
                        {/* Table of group member agencies. These will be editable in future versions)'*/}
                        {type == "Group"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_name")}</span>
                                {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Group"?<Card variant='outlined'>
                                <CardContent>
                                        {/* // Map is causing a problem */}
                                        <DataGrid 
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
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_bib_id")}</span>
                                                {toDisplay?.id} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.title")}</span>
                                                {toDisplay?.title} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.author")}</span>
                                                {toDisplay?.author} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_system_id")}</span>
                                                {toDisplay?.sourceSystemId} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.source_record_id")}</span>
                                                {toDisplay?.sourceRecordId} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.contributor_id")}</span>
                                                {toDisplay?.contributesTo?.id} </Typography>
                                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.contributor_title")}</span>
                                                {toDisplay?.contributesTo?.title} </Typography>
                                        <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                                        <AccordionSummary aria-controls="source-bibs-json-details" id="source-bibs-json-details" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.canonical_metadata")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <pre>{JSON.stringify(toDisplay?.canonicalMetadata, null, 2)}</pre>
                                        </AccordionDetails>
                                        </Accordion>
                                        <Accordion expanded={expandedAccordions[8]} onChange={handleAccordionChange(8)}>
                                        <AccordionSummary aria-controls="source-bibs-source-record-json-details" id="source-bibs-source-record-json-details" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.source_record")} </Typography>
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
