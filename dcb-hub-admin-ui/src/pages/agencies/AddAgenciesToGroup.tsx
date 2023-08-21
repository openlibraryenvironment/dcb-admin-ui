import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Alert, Button, Modal } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import request, { GraphQLClient } from 'graphql-request';
import { addAgenciesToGroup } from 'src/queries/queries';
import { useMutation } from '@tanstack/react-query';
import * as Yup from 'yup';
interface FormData {
  groupId: string;
  agencyId: string;
  // Add more fields as needed when we know them
}
// This is a TypeScript type definition for the response we get from the GraphQL server.
// Without this, we receive a 'property does not exist on type unknown' error.
interface AddAgenciesResponse {
  data: {
    addAgencyToGroup: {
      id: string,
      agency: {
        id: string,
        code: string,
        name: string,
      }
    }
  }
}

const initialValues: FormData = {
  groupId: '',
  agencyId: '',
};

type NewGroupType = {
  show: boolean,
  onClose: any,
  // type: string; - for if/when we make this a generic 'New' form later
  // this will also eventually contain an array of agencies for multi-select
};

//This validates input client-side for the form
const validationSchema = Yup.object().shape({
    groupId: Yup.string().required('Group ID is required').max(36, 'Group ID must be at most 36 characters'),
    agencyId: Yup.string().required('Agency ID is required').max(36, 'Agency ID must be at most 36 characters'),
  });

// sort Group typings
export default function AddAgenciesToGroup({show, onClose}: NewGroupType) {
    const { data: session, status } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isSuccess, setSuccess] = useState(false);
    const [isError, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');


    const graphQLClient = new GraphQLClient('https://dcb-uat.sph.k-int.com/graphql'); 
    const headers = { Authorization: `Bearer ${session?.accessToken}` }
    // remember your headers - these don't get added automatically with the client we're using
    // TODO: Implement a GraphQL client that does do this and supports OAuth. Our current client is glitchy and is suffering from 401s.

    // This is the react-query mutation that performs the request + updates state
    // https://tanstack.com/query/v4/docs/react/reference/useMutation
    // We have callbacks for both success and error states, in order to display our respective alerts.

    const addAgenciesMutation = useMutation(
      async (values: FormData) => {
        const { data } = await request<AddAgenciesResponse>('https://dcb-uat.sph.k-int.com/graphql', addAgenciesToGroup, {
          input: {
            group: values.groupId,
            agency: values.agencyId
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
              'Failed to add agency to group. Please retry, and if this issue persists please sign out and back in again.'
            );
            console.error('Error:', error);
          },
      }
    );
    
    // This function governs what happens after we click 'submit'.
    const handleSubmit = async (values: FormData) => {
    try {
        setIsSubmitting(true);
        await addAgenciesMutation.mutateAsync(values);
        console.log(isSuccess, isSubmitting);
    } catch (error) {
        console.error('Error:', error);
    }
    finally {
        setIsSubmitting(false); // Sets isSubmitting back to false after submission so we don't have infinite 'submitting'
      }
  };

//All modals should have centered and bold headings, and must close onSuccess
  return (
    <div>
    <Modal show={show} onHide={onClose}  size="lg"
    aria-labelledby="centred-new-group-modal"
    centered>
        <Modal.Header closeButton aria-labelledby='close-new-group-modal'>
        <Modal.Title style={{ textAlign: 'center', fontWeight: 'bold' }}> Add agencies to a group</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={validationSchema}>
      <Form>
        <div>
          <label htmlFor="groupId">Group ID</label>
          <Field type="text" id="groupId" name="groupId" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}/>
          <ErrorMessage name="groupId" component="div" />
        </div>
        <div>
          <label htmlFor="agencyId">Agency ID</label>
          <Field type="text" id="agencyId" name="agencyId" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          <ErrorMessage name="agencyId" component="div" />
        </div>
        <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Add agencies to group'}</Button>
      </Form>
    </Formik>
    </Modal.Body>
    {isSuccess && (
        <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
         Success: Agency added to group!
        </Alert>
      )}
    {isError && (
        <Alert variant="danger" onClose={() => setError(false)} dismissible>
            {errorMessage}
        </Alert>
    )}
    </Modal>
    </div>
  );
};
