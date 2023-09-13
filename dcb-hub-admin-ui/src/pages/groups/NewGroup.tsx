import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Alert, Button, Modal } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import request, {gql, GraphQLClient } from 'graphql-request';
import { useMutation } from '@tanstack/react-query';
import * as Yup from 'yup';
import { createGroup } from 'src/queries/queries';

interface FormData {
  name: string;
  code: string;
  // Add more fields as needed when we know them
}

interface CreateGroupResponse {
  data: {
    createAgencyGroup: {
      id: string;
      code: string;
      name: string;
    };
  };
}

const initialValues: FormData = {
  name: '',
  code: '',
};

type NewGroupType = {
  show: boolean,
  onClose: any,
  // type: string; - for if/when we make this a generic 'New' form later
};

//This validates input client-side for the form
const validationSchema = Yup.object().shape({
  name: Yup.string().required('Group name is required').max(32, 'Group name must be at most 32 characters'),
  code: Yup.string().required('Group code is required').max(5, 'Group code must be at most 5 characters'),
});
// sort Group typings
export default function NewGroup({show, onClose}: NewGroupType) {
    const { data: session, status } = useSession();
    const [isSuccess, setSuccess] = useState(false);
    const [isError, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const graphQLClient = new GraphQLClient('https://dcb-uat.sph.k-int.com/graphql'); 
    const headers = { Authorization: `Bearer ${session?.accessToken}` }
    // remember your headers - these don't get added automatically with the client we're using
    // look at a client that does do this

    const createGroupMutation = useMutation(
      async (values: FormData) => {
        const { data } = await request<CreateGroupResponse>('https://dcb-uat.sph.k-int.com/graphql', createGroup, {
          input: {
            name: values.name,
            code: values.code,
          },
        }, headers);
        return data;
      },
      {
        onSuccess: () => {
          setSuccess(true);
          onClose();
        },
        onError: (error) => {
          setError(true);
          setErrorMessage(
            'Failed to create new group. Please retry, and if this issue persists please sign out and back in again.'
          );
          console.error('Error:', error);
        },
    }
    );

    const handleSubmit = async (values: FormData) => {
    try {
      const data  = await createGroupMutation.mutateAsync(values);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // We will also need validation here, once we know what these should be
  return (
    <Modal show={show} onHide={onClose}  size="lg"
    aria-labelledby="centred-new-group-modal"
    centered>
      <Modal.Header closeButton aria-labelledby='close-new-group-modal'>
      <Modal.Title> New Group</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={validationSchema}>
      <Form>
        <div>
          <label htmlFor="name">Group Name</label>
          <Field type="text" id="name" name="name" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}/>
          <ErrorMessage name="name" component="div" />
        </div>
        <div>
          <label htmlFor="code">Group Code</label>
          <Field type="text" id="code" name="code" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          <ErrorMessage name="code" component="div" />
        </div>
        {/* <div>
          <label htmlFor="groupId">Description</label>
          <Field type="text" id="groupId" name="groupId" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          <ErrorMessage name="groupId" component="div" />
        </div> */}
    {/* // add the agencies stuff here. Should really post an array of all the agencies that'll be part of the group (or at least their IDs) - but check implementation when we have it
      We should also consider whether the user should have the ability to create a new agency here, or whether we wish to transition them to the 'Add Agencies to Group' screen*/}
        <Button variant="primary" type="submit">Create Group</Button>
      </Form>
    </Formik>
    </Modal.Body>
    {isSuccess && (
        <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
          Success: New group created!
        </Alert>
      )}
    {isError && (
        <Alert variant="danger" onClose={() => setError(false)} dismissible>
            {errorMessage}
        </Alert>
    )}
    </Modal>
  );
};
