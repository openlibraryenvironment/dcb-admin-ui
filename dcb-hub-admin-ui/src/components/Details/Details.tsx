import * as React from 'react';
import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';
import Card from 'react-bootstrap/Card';
import CardGroup from 'react-bootstrap/Card';
import * as dayjs from 'dayjs';




// this can be changed to be fullscreen if desired - just pass the fullscreen prop and uncomment  code
// fullscreen code goes here. we can set it depending on the screen size
// {fullscreen, }
// change 'Details' to the details of whatever it is 
// pass down the information we need to display.

// type Props = {
//     content
// }
type DetailsType = {
        i: any,
        content: any,
        show: boolean,
        onClose: any,
        type: string;
};
export default function Details({i, content, show, onClose, type}: DetailsType) {

    // const [fullscreen, setFullscreen] = useState(true);
        // make sure modal and close button are labelled for screen readers - accessibility flag
        // need a better way of accessing data, will research 
        // guard against some of these properties not being available
        // list items in something interesting. card will do for now and can be created ad-hoc as needed
        
        // { console.log(content[i].localItemStatus)}

        // content array passed down with ID, which we use to do lookup to find the relevant request item to display. 
        // done because we can't get row id out of TST + other table weirdness is causing issues.
        // ideally we'd only pass down what we need here - working on that now. Lookup should ideally take place in table before this component loads.




        const dayjs = require('dayjs');
        const base = 'base-url';
        const size = 'page-size';

        const findItemById = (array, id) => {
                return array.find(item => item.id === id);
            };
        const toDisplay = findItemById(content, i);

        if (type == "Request")
        {
                const isRequest = true;
        }
        else if (type == "Location")
        {
                const isLocation = true;
        }

        /// const whereIsId = content.find(i)
        // console.log(content.find((i)));
        //const requestCreated = dayjs(content[i]?.dateCreated).format('DD/MM/YYYY, HH:mm A');
        // const requestUpdated = dayjs.unix(content[i]?.dateUpdated)

            // titles will need to be conditionally shown depending on type (i.e. agencies will have different things)
    return (
        <Modal show={show} onHide={onClose}  size="lg"
        aria-labelledby="centred-details-modal"
        centered>
                    <Modal.Header closeButton aria-labelledby='close-details-modal'>
          <Modal.Title> {type} Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <CardGroup>
                {/* // These are the items that we always show on every 'Details' instance*/}

                <Card>
                <Card.Body>
                    <Card.Title>{type} ID: : {toDisplay?.id}</Card.Title>
            </Card.Body>
            </Card>
            {/* // These items are shown for all types, excluding Requests*/}

            {type !== "Request"?<Card>
            <Card.Body>
                    <Card.Title> {type} Code: {toDisplay?.code} </Card.Title>
            </Card.Body>
            </Card>: null}

            {/* // These are the items that we typically need to only show for 'Request Details', hence the conditional rendering*/}
            {type == "Request"?<Card>
            <Card.Body>
                   <Card.Title> Request Created: {dayjs(toDisplay?.dateCreated).format('DD/MM/YYYY, HH:mm A')}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
                <Card.Body>
                    <Card.Title>
                    Request Updated: {dayjs(toDisplay?.dateUpdated).format('DD/MM/YYYY, HH:mm A')}
                    </Card.Title>
                </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title>Patron ID: {toDisplay?.patron?.id}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title>Requesting Agency ID: {toDisplay?.requestingIdentity?.id}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title> BibClusterID: {toDisplay?.bibClusterId}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title> Pickup location code: {toDisplay?.pickupLocationCode}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title> Description: {toDisplay?.description}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title>  Local Request ID: {toDisplay?.localRequestId} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title>  Local Request Status: {toDisplay?.localRequestStatus} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title>Local Item ID: {toDisplay?.localItemId}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title>Local Item Status: {toDisplay?.localItemStatus}</Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title> Local Bib Id: {toDisplay?.localBibId} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title> Active Workflow: {toDisplay?.activeWorkflow} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Request"?<Card>
            <Card.Body>
                    <Card.Title> Patron Host LMS Code: {toDisplay?.patronHostlmsCode} </Card.Title>
            </Card.Body>
            </Card>: null}
            
             {/* These are the items we typically only need to show for 'Agency Details'*/}
            {type == "Agency"?<Card>
            <Card.Body>
                    <Card.Title> Agency Name: {toDisplay?.name} </Card.Title>
            </Card.Body>
            </Card>: null}
            {/* These are the items we typically only need to show for 'HostLMS Details'*/}
            {type == "HostLMS"?<Card>
            <Card.Body>
                    <Card.Title> HostLMS Name: {toDisplay?.name} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "HostLMS"?<Card>
            <Card.Body>
                    <Card.Title> lmsClientClass: {toDisplay?.lmsClientClass} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "HostLMS"?<Card>
            <Card.Body>
                    <Card.Title> Client Config Key: {toDisplay?.clientConfig?.key} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "HostLMS"?<Card>
            <Card.Body>
                    <Card.Title> Client Config Ingest: {toDisplay?.clientConfig?.ingest} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "HostLMS"?<Card>
            <Card.Body>
                    <Card.Title> Client Config Secret: {toDisplay?.clientConfig?.secret} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "HostLMS"?<Card>
            <Card.Body>
                    <Card.Title> Client Config Base URL: {toDisplay?.clientConfig?.[base]} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "HostLMS"?<Card>
            <Card.Body>
                    <Card.Title> Client Config Page Size: {toDisplay?.clientConfig?.[size]} </Card.Title>
            </Card.Body>
            </Card>: null}

            {/* These are the items we typically only need to show for 'Location Details'*/}

            {type == "Location"?<Card>
            <Card.Body>
                    <Card.Title> Location Name: {toDisplay?.name} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Location"?<Card>
            <Card.Body>
                    <Card.Title> Type: {toDisplay?.type} </Card.Title>
            </Card.Body>
            </Card>: null}
            {type == "Location"?<Card>
            <Card.Body>
                    <Card.Title> Host System ID: {toDisplay?.hostSystem?.id} </Card.Title>
            </Card.Body>
            </Card>: null}


            </CardGroup>
            {/* <p> Error message: {content[i]?.errorMessage} </p> */}
        </Modal.Body>

      </Modal>

    );


}