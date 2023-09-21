import * as React from 'react';
import { CardContent, Card, Typography, Dialog, Slide, AppBar, IconButton, Toolbar, DialogContent, AccordionSummary, Accordion, AccordionDetails }from "@mui/material"
import { TransitionProps } from '@mui/material/transitions';
import dayjs from 'dayjs';
import { DataGrid } from '@components/DataGrid';
import { MdClose, MdExpandMore } from 'react-icons/md'
import { IconContext } from 'react-icons';

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
                                        View {type} Details - {toDisplay?.name ?? toDisplay?.id}
                                        </Typography>
                                </Toolbar>
                        </AppBar>

                        {/* <Modal.Header closeButton aria-labelledby='close-details-modal'> */}
                {/* // <Modal.Title> View {type} Details - {toDisplay?.name ?? toDisplay?.id} </Modal.Title> */}
                {/* </Modal.Header> */}
                <DialogContent>
                        {/* // These are the items that we always show on every 'Details' instance. */}
                        <Card variant = 'outlined'>
                        <CardContent>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} ID: </span>
                        {toDisplay?.id}
                        </Typography>
                        </CardContent>
                        </Card>
                        {/* // These items are shown for all types, excluding Requests*/}
                        {type !== "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>{type} code: </span>
                                 {toDisplay?.code} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* // These are the items that we typically need to only show for 'Request Details', hence the conditional rendering*/}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Request created: </span>
                                 {dayjs(toDisplay?.dateCreated).format('DD/MM/YYYY, HH:mm')}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Request updated: </span>
                                {dayjs(toDisplay?.dateUpdated).format('DD/MM/YYYY, HH:mm')}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Patron ID: </span>
                                {toDisplay?.patron?.id}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Requesting agency ID: </span>
                                {toDisplay?.requestingIdentity?.id}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>BibClusterID: </span> 
                                {toDisplay?.bibClusterId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Pickup location code: </span> 
                                {toDisplay?.pickupLocationCode}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Description: </span>
                                {toDisplay?.description}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Local Request ID: </span>
                                {toDisplay?.localRequestId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Local Request Status: </span>
                                {toDisplay?.localRequestStatus}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Local Item ID: </span>
                                {toDisplay?.localItemId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Local Item Status: </span>
                                {toDisplay?.localItemStatus}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Local Bib Id:  </span>
                                {toDisplay?.localBibId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Active Workflow: </span>
                                {toDisplay?.activeWorkflow}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Patron Host LMS Code: </span>
                                {toDisplay?.patronHostlmsCode}</Typography>
                        </CardContent>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Agency Details'*/}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Agency Name: </span>
                                {toDisplay?.name}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Agency HostLMS Code: </span>
                                {toDisplay?.hostLMSCode}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Agency Auth Profile: </span>
                                {toDisplay?.authProfile} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="client-config" id="client-config" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> Location information </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Longitude: </span>
                                                {toDisplay?.longitude} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Latitude: </span>
                                                {toDisplay?.latitude} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}               
                        {/* These are the items we typically only need to show for 'HostLMS Details'.
                        We should also include an accordion component for Client Config*/}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>HostLMS Name: </span>
                                {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                        <Typography component="div"> <span style={{ fontWeight: 'bold' }}>LmsClientClass: </span>
                                {toDisplay?.lmsClientClass} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="client-config" id="client-config" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> Client Config </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Ingest: </span>
                                                {toDisplay?.clientConfig?.ingest} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Shelving locations: </span>
                                                {toDisplay?.clientConfig?.[shelving]} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Client Config - Number of records to generate: </span>
                                                {toDisplay?.clientConfig?.[numRecord]} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Location Details'*/}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Location name: </span>
                                {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Type: </span>
                                {toDisplay?.type} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography  component="div"> <span style={{ fontWeight: 'bold' }}>Location agency ID: </span>
                                {toDisplay?.agency?.id} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                                <Accordion>
                                        <AccordionSummary aria-controls="client-config" id="client-config" 
                                                expandIcon={<IconContext.Provider value={{size: "2em"}}> <MdExpandMore/> 
                                                </IconContext.Provider>}>
                                               <Typography sx={{ fontWeight: 'bold' }}> Location information </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Longitude: </span>
                                                {toDisplay?.longitude} </Typography>
                                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Latitude: </span>
                                                {toDisplay?.latitude} </Typography>
                                        </AccordionDetails>
                                </Accordion>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Group Details'*/}
                        {/* Table of group member agencies. These will be editable in future versions)'*/}
                        {type == "Group"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography component="div"> <span style={{ fontWeight: 'bold' }}>Group name: </span>
                                {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Group"?<Card variant='outlined'>
                                <CardContent>
                                        <DataGrid 
                                        data={toDisplay?.members.map((item: { agency: any; }) => item.agency) ?? []}
                                        columns={[ {field: 'name', headerName: "Agency name", minWidth: 100, flex: 1}, { field: 'id', headerName: "Agency ID", minWidth: 50, flex: 0.5}, {field: 'code', headerName: "Agency code", minWidth: 50, flex: 0.5}]}	
                                        type = "Group"
                                        selectable= {true}/>                                
                                </CardContent>
                        </Card>: null}
                </DialogContent>
                </div>
        </Dialog>
        );
}
