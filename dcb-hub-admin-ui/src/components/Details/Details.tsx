import * as React from 'react';
import Modal from 'react-bootstrap/Modal';
import { CardContent, Card, Typography  }from "@mui/material"
import dayjs from 'dayjs';
import { DataGrid } from '@components/DataGrid';

// this can be changed to be fullscreen if desired - just pass the fullscreen prop. It can also be adjusted depending on screen size.

type DetailsType = {
        i: any,
        content: any,
        show: boolean,
        onClose: any,
        type: string;
};
export default function Details({i, content, show, onClose, type}: DetailsType) {

        const base = 'base-url';
        const size = 'page-size';

        const findItemById = (array: any[], id: any) => {
                return array.find(item => item.id === id);
                };
        const toDisplay = findItemById(content, i);
                
        return (
                <Modal show={show} onHide={onClose}  size="lg"
                aria-labelledby="centred-details-modal"
                centered>
                        <Modal.Header closeButton aria-labelledby='close-details-modal'>
                <Modal.Title> View {type} Details - {toDisplay?.name ?? toDisplay?.id} </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                        {/* // These are the items that we always show on every 'Details' instance. */}
                        <Card variant = 'outlined'>
                        <CardContent>
                        <Typography variant = "h6" component="div">{type} ID: : {toDisplay?.id}</Typography>
                        </CardContent>
                        </Card>
                        {/* // These items are shown for all types, excluding Requests*/}
                        {type !== "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> {type} Code: {toDisplay?.code} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* // These are the items that we typically need to only show for 'Request Details', hence the conditional rendering*/}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Request Created: {dayjs(toDisplay?.dateCreated).format('DD/MM/YYYY, HH:mm')}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                        <Typography variant = "h6" component="div">
                        Request Updated: {dayjs(toDisplay?.dateUpdated).format('DD/MM/YYYY, HH:mm')}
                        </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div">Patron ID: {toDisplay?.patron?.id}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div">Requesting Agency ID: {toDisplay?.requestingIdentity?.id}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> BibClusterID: {toDisplay?.bibClusterId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Pickup location code: {toDisplay?.pickupLocationCode}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Description: {toDisplay?.description}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div">  Local Request ID: {toDisplay?.localRequestId} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div">  Local Request Status: {toDisplay?.localRequestStatus} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div">Local Item ID: {toDisplay?.localItemId}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div">Local Item Status: {toDisplay?.localItemStatus}</Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Local Bib Id: {toDisplay?.localBibId} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Active Workflow: {toDisplay?.activeWorkflow} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Request"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Patron Host LMS Code: {toDisplay?.patronHostlmsCode} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Agency Details'*/}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Agency Name: {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Agency HostLMS Code: {toDisplay?.hostLMSCode} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Agency"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Agency Auth Profile: {toDisplay?.authProfile} </Typography>
                        </CardContent>
                        </Card>: null}                
                        {/* These are the items we typically only need to show for 'HostLMS Details'*/}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> HostLMS Name: {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> lmsClientClass: {toDisplay?.lmsClientClass} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Client Config Key: {toDisplay?.clientConfig?.key} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Client Config Ingest: {toDisplay?.clientConfig?.ingest} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Client Config Secret: {toDisplay?.clientConfig?.secret} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Client Config Base URL: {toDisplay?.clientConfig?.[base]} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "HostLMS"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Client Config Page Size: {toDisplay?.clientConfig?.[size]} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Location Details'*/}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Location Name: {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Type: {toDisplay?.type} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Location"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Host System ID: {toDisplay?.hostSystem?.id} </Typography>
                        </CardContent>
                        </Card>: null}
                        {/* These are the items we typically only need to show for 'Group Details'*/}
                        {/* Table of group member agencies. These will be editable in future versions)'*/}
                        {type == "Group"?<Card variant = 'outlined'>
                        <CardContent>
                                <Typography variant = "h6" component="div"> Group Name: {toDisplay?.name} </Typography>
                        </CardContent>
                        </Card>: null}
                        {type == "Group"?<Card variant='outlined'>
                                <CardContent>
                                        {/* <Typography variant = "h6" component="div"> Group Members: </Typography> */}
                                        <DataGrid 
                                        data={toDisplay?.members.map((item: { agency: any; }) => item.agency) ?? []}
                                        columns={[ {field: 'name', headerName: "Agency name", minWidth: 100, flex: 1}, { field: 'id', headerName: "Agency ID", minWidth: 50, flex: 0.5}, {field: 'code', headerName: "Agency code", minWidth: 50, flex: 0.5}]}	
                                        type = "Group"
                                        selectable= {true}/>                                
                                </CardContent>
                        </Card>: null}
                </Modal.Body>
        </Modal>
        );
}
