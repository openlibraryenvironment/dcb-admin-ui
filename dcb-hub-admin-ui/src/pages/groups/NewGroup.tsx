import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import axios from 'axios';
import { NextPage } from 'next';
import { AdminLayout } from '@layout';
import { Button, Modal } from 'react-bootstrap';


interface GroupFormData {
  groupId: number;
  groupName: string;
  groupCode: string;
  // Add more fields as needed when we know them
}

const initialValues: GroupFormData = {
  groupId: 0,
  groupName: '',
  groupCode: '',
};

type NewGroupType = {
  show: boolean,
  onClose: any,
  // type: string; - for if/when we make this a generic 'New' form later
};
// sort Group typings
export default function NewGroup({show, onClose}: NewGroupType) {
        
    const handleSubmit = async (values: GroupFormData) => {
    try {
      const response = await axios.post('/api/groups', values);
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // make this a modal, to pop up when 'new group' is clicked
  // Once it's a modal, add cancel button and fix positioning of 'Create Group'
  // This will only work when Groups endpoint is live
  return (
    <Modal show={show} onHide={onClose}  size="lg"
    aria-labelledby="centred-new-group-modal"
    centered>
      <Modal.Header closeButton aria-labelledby='close-new-group-modal'>
      <Modal.Title> New Group</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <Form>
        <div>
          <label htmlFor="groupName">Group Name</label>
          <Field type="text" id="groupName" name="groupName" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}/>
          <ErrorMessage name="groupName" component="div" />
        </div>

        <div>
          <label htmlFor="groupCode">Group Code</label>
          <Field type="text" id="lastName" name="lastName" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          <ErrorMessage name="lastName" component="div" />
        </div>
        <div>
          <label htmlFor="groupId">Description</label>
          <Field type="text" id="groupId" name="groupId" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          <ErrorMessage name="groupId" component="div" />
        </div>
    {/* // add the agencies stuff here. Should really post an array of all the agencies that'll be part of the group (or at least their IDs) - but check implementation when we have it
      We should also consider whether the user should have the ability to create a new agency here, or whether we wish to transition them to the 'Add Agencies to Group' screen*/}
        <Button variant="primary" type="submit">Create Group</Button>
      </Form>
    </Formik>
    </Modal.Body>
    </Modal>

  );
};
