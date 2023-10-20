import * as React from 'react';
import { CardContent, Card, Typography, Dialog, Slide, AppBar, IconButton, Toolbar, DialogContent, AccordionSummary, Accordion, AccordionDetails }from "@mui/material"
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


const Transition = React.forwardRef(function Transition(
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
                        {/* // These are the items that we always show on every 'Details' instance. */}
                        <Card variant = 'outlined'>
                        <CardContent>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} {t("details.id", "ID: ")}: </span>
                        {toDisplay?.id}
                        </Typography>
                        </CardContent>
                        </Card>
                        {/* // These items are shown for all types, excluding Requests*/}
                        {type !== "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} {t("details.code", "code")}: </span>
                                 {toDisplay?.code} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* // These are the items that we typically need to only show for 'Request Details', hence the conditional rendering*/}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_created", "Request created: ")} </span>
                                 {dayjs(toDisplay?.dateCreated).format('DD/MM/YYYY, HH:mm')}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.request_updated", "Request updated: ")} </span>
                                {dayjs(toDisplay?.dateUpdated).format('DD/MM/YYYY, HH:mm')}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.patron_id", "Patron ID: ")} </span>
                                {toDisplay?.patron?.id}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.requestor_id", "Requesting agency ID: ")}</span>
                                {toDisplay?.requestingIdentity?.id}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.bib_cluster_id", "BibClusterID")}</span> 
                                {toDisplay?.bibClusterId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.pickup_id", "Pickup location code: ")}</span> 
                                {toDisplay?.pickupLocationCode}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.description", "Description: ")}</span>
                                {toDisplay?.description}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_request_id", "Local request ID: ")}</span>
                                {toDisplay?.localRequestId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_request_status", "Local request status: ")}</span>
                                {toDisplay?.localRequestStatus}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_id", "Local item ID: ")}</span>
                                {toDisplay?.localItemId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_item_status", "Local item status: ")}</span>
                                {toDisplay?.localItemStatus}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.local_bib_id", "Local Bib ID: ")}</span>
                                {toDisplay?.localBibId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.active_workflow", "Active workflow: ")}</span>
                                {toDisplay?.activeWorkflow}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{t("details.patron_hostlms", "Patron HostLMS code: ")}</span>
                                {toDisplay?.patronHostlmsCode}</Typography>
                        </CardContent>
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
