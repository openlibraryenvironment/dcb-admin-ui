// Modal with list of agencies that we want to add to the group
// Group select to decide which group they go to - ability to add new group here? 
// Ability to remove - do we also want the ability to add ?
// Confirmation modal button will add all these agencies to group selected

import { Modal } from "react-bootstrap";

export default function AddAgenciesToGroup() {

    return (
        <Modal>
                <Modal.Header closeButton aria-labelledby='close-details-modal'>
                <Modal.Title> Add agencies to Group</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                </Modal.Body>
        </Modal>
    )
}
