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

        // Handles response variables with hyphens, which will throw an error if you try and reference the same way as everything else
        const shelving = 'shelving-locations';
        const numRecord = 'num-records-to-generate';

        const findItemById = (array: any[], id: any) => {
                return array.find(item => item.id === id);
                };
        const toDisplay = findItemById(content, i);

        // experimental - fix with a map solution as numbers of needed accordions will change
        // State values for expanded accordions
        const [expandedAccordions, setExpandedAccordions] = useState([false, false, false, false, false]);

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
                                        {t("details.view", "View")} {type} {t("details.details", "Details")} - {toDisplay?.name ?? toDisplay?.id}
                                        </Typography>
                                </Toolbar>
                        </AppBar>
                <DialogContent>
                        {/* // These items are shown for every 'Details' instance, excluding Requests*/}                        
                        {type !== "Request"?<Card variant = 'outlined'>
                        <CardContent>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} {t("details.id", "ID: ")}: </span>
                        {toDisplay?.id}
                        </Typography>
                        </CardContent>
                        </Card>: null}
                        {type !== "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} {t("details.code", "code")}: </span>
                                 {toDisplay?.code} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* // These are the items that we typically need to only show for 'Request Details', hence the conditional rendering*/}
                        {type == "Request"? <Stack direction="row" justifyContent="end">
                                <Button onClick={expandAll}>{expandedAccordions[0] ? "Close all": "Expand all"}</Button> </Stack> : null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[0]} onChange={handleAccordionChange(0)}>
                                        <AccordionSummary aria-controls="request-general-details" id="request_details_general" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.general", "General")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_id", "Request ID: ")} </span>
                                                {toDisplay?.id}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_created", "Request created: ")} </span>
                                                {dayjs(toDisplay?.dateCreated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_updated", "Request updated: ")} </span>
                                                {dayjs(toDisplay?.dateUpdated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.description", "Description: ")}</span>
                                                {toDisplay?.description}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.bib_cluster_id", "Bib cluster ID: ")}</span> 
                                                {toDisplay?.bibClusterId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.requestor_note", "Requestor note: ")}</span> 
                                                {toDisplay?.requestorNote}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.status", "Status: ")}</span> 
                                                {toDisplay?.status}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.error", "Error message: ")}</span> 
                                                {toDisplay?.errorMessage}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.active_workflow", "Active workflow: ")}</span> 
                                                {toDisplay?.activeWorkflow}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[1]} onChange={handleAccordionChange(1)}>
                                        <AccordionSummary aria-controls="request-patron-details" id="request_details_patron" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>} >
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.patron", "Patron")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.patron_id", "Patron ID: ")} </span>
                                                        {toDisplay?.patron?.id}
                                                </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.requestor_id", "Requesting agency ID: ")}</span>
                                                {toDisplay?.requestingIdentity?.id}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.patron_hostlms", "Patron HostLMS code: ")}</span>
                                                {toDisplay?.patronHostlmsCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_request_id", "Local request ID: ")}</span>
                                                {toDisplay?.localRequestId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_request_status", "Local request status: ")}</span>
                                                {toDisplay?.localRequestStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id", "Local item ID: ")}</span>
                                                {toDisplay?.localItemId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status", "Local item status: ")}</span>
                                                {toDisplay?.localItemStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id", "Local Bib ID: ")}</span>
                                                {toDisplay?.localBibId}</Typography>
                                                        {/* Requesting Identity stuff maybe goes here? All need 3 IDs*/}
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[2]} onChange={handleAccordionChange(2)}>
                                        <AccordionSummary aria-controls="request-pickup-details" id="request_details_pickup" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.pickup", "Pickup")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_code", "Pickup location code: ")}</span> 
                                                {toDisplay?.pickupLocationCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_id", "Pickup item ID: ")}</span> 
                                                {toDisplay?.pickupItemId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_status", "Pickup item status: ")}</span> 
                                                {toDisplay?.pickupItemStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_item_type", "Pickup item type: ")}</span> 
                                                {toDisplay?.pickupItemType}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_patron_id", "Pickup patron ID: ")}</span> 
                                                {toDisplay?.pickupPatronId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_id", "Pickup request ID: ")}</span> 
                                                {toDisplay?.pickupRequestId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_request_status", "Pickup request status: ")}</span> 
                                                {toDisplay?.pickupRequestStatus}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[3]} onChange={handleAccordionChange(3)}>
                                        <AccordionSummary aria-controls="request-supplier-details" id="request_details_supplier" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.supplier", "Supplier")} </Typography>
                                        </AccordionSummary>
                                        {/* We may have to change this for multiple suppliers. Could make it a grid. */}
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.supplier_id", "Supplier ID: ")}</span> 
                                                {toDisplay?.suppliers[0]?.id}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.supplier_ctype", "Canonical item type: ")}</span> 
                                                {toDisplay?.suppliers[0]?.canonicalItemType}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.dateCreated", "Date created: ")}</span> 
                                                {dayjs(toDisplay?.suppliers[0]?.dateCreated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.dateUpdated", "Date updated: ")}</span> 
                                                {dayjs(toDisplay?.suppliers[0]?.dateUpdated).format('YYYY-MM-DD HH:mm')}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_code", "Host LMS code: ")}</span> 
                                                {toDisplay?.suppliers[0]?.hostLmsCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.is_active", "isActive: ")}</span> 
                                                {toDisplay?.suppliers[0]?.isActive}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id", "Local item ID: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id", "Local bib ID: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localBibId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_barcode", "Local item barcode: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemBarcode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_loc", "Local item location code: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemLocationCode}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status", "Local item status: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_type", "Local item type: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localItemType}</Typography>
                                                {/* We need clarity on what local ID is meant to be in this context - likewise for status and ctype */}
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_supplier_id", "Local supplier request ID: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localId}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_status", "Local status: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localStatus}</Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_status", "Local agency code: ")}</span> 
                                                {toDisplay?.suppliers[0]?.localAgency}</Typography>
                                        </AccordionDetails>
                        </Accordion>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <Accordion expanded={expandedAccordions[4]} onChange={handleAccordionChange(4)}>
                                        <AccordionSummary aria-controls="request-audit_log" id="request_audit_log" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.audit_log", "Audit log")} </Typography>
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
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.agency_name", "Agency name: ")}</span>
                                {toDisplay?.name}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.agency_hostlms", "Agency HostLMS code: ")}</span>
                                {toDisplay?.hostLMSCode}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.agency_auth", "Agency auth profile: ")}</span>
                                {toDisplay?.authProfile} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="agency_details_location_info" id="agency_details_location_info" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.location_info", "Location information")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.long", "Longitude: ")}</span>
                                                {toDisplay?.longitude} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.lat", "Latitude: ")}</span>
                                                {toDisplay?.latitude} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}               
                        {/* These are the items we typically only need to show for 'HostLMS Details'.
                        We should also include an accordion component for Client Config*/}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.hostlms_name", "HostLMS name: ")}</span>
                                {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.lms_client", "LmsClientClass: ")}</span>
                                {toDisplay?.lmsClientClass} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="client-config-hostlms-details" id="client-config-hostlms-details" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.client_config", "Client config")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_ingest", "Ingest: ")}</span>
                                                {toDisplay?.clientConfig?.ingest} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_shelving", "Shelving locations: ")}</span>
                                                {toDisplay?.clientConfig?.[shelving]} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.client_config_records", "Number of records to generate: ")}</span>
                                                {toDisplay?.clientConfig?.[numRecord]} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Location Details'*/}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_name", "Location name: ")} </span>
                                {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_type", "Type: ")} </span>
                                {toDisplay?.type} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography  component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.location_agency", "Location agency ID: ")} </span>
                                {toDisplay?.agency?.id} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="client-config-location-details" id="client-config-location-details" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> {t("details.location_info", "Location information")} </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.long", "Longitude: ")}</span>
                                                {toDisplay?.longitude} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.lat", "Latitude: ")}</span>
                                                {toDisplay?.latitude} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Group Details'*/}
                        {/* Table of group member agencies. These will be editable in future versions)'*/}
                        {type == "Group"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.group_name", "Group name: ")}</span>
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
                </DialogContent>
                </div>
        </Dialog>
        );
}
