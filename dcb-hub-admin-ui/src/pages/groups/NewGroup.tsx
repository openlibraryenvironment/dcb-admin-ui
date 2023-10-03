import React, { useState } from 'react';
import { useFormik } from 'formik';
import { useSession } from 'next-auth/react';
import request, {gql, GraphQLClient } from 'graphql-request';
import { useMutation } from '@tanstack/react-query';
import * as Yup from 'yup';
import { createGroup } from 'src/queries/queries';
import { Dialog, DialogContent, DialogTitle, IconButton, styled, Button, TextField } from '@mui/material';
import Alert from '@components/Alert/Alert';
import { MdClose } from 'react-icons/md'
//localisation
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';

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
    const url = React.useMemo(() => {
      const { publicRuntimeConfig } = getConfig();
      return publicRuntimeConfig.DCB_API_BASE + '/graphql';
    }, []);
    const graphQLClient = new GraphQLClient(url); 
    const headers = { Authorization: `Bearer ${session?.accessToken}` }
    // remember your headers - these don't get added automatically with the client we're using
    // look at a client that does do this

    const { t } = useTranslation();

    const createGroupMutation = useMutation(
      async (values: FormData) => {
        const { data } = await request<CreateGroupResponse>(url, createGroup, {
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

    const FormikMaterial = () => {
      const formik = useFormik({
        initialValues: {
          name: '',
          code: '',
        },
        validationSchema: validationSchema,
        onSubmit: handleSubmit,

      });
      return (
        <div>
          <form id = "new-group-form" onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Group name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              id="code"
              name="code"
              label="Group Code"
              value={formik.values.code}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
            />
            <Button color="primary" variant="contained" fullWidth type="submit">
              Submit
            </Button>
          </form>
        </div>
      );
    };


  return (
    <Dialog open={show} onClose={onClose} aria-labelledby="new-group-dialog">
      <DialogTitle style={{ textAlign: 'center'}}> New Group</DialogTitle>
      <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <MdClose/>
        </IconButton>
    <DialogContent>
      <FormikMaterial/>
    </DialogContent>
    {isSuccess && (
      <Alert severityType="success" onCloseFunc={() => setSuccess(false)} alertText={t("groups.new_group_success")}/>
      )}
    {isError && (
      <Alert severityType="error" onCloseFunc={() => setError(false)} alertText={errorMessage}/>
    )}
    </Dialog>
  );
};
