import { useMemo, useState } from 'react';
import { useFormik} from 'formik';
import { useSession } from 'next-auth/react';
import request, { GraphQLClient } from 'graphql-request';
import { addAgenciesToGroup } from 'src/queries/queries';
import { useMutation } from '@tanstack/react-query';
import * as Yup from 'yup';
import { Button, Dialog, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import Alert from '@components/Alert/Alert';
//localisation
import { useTranslation } from 'next-i18next';
import { MdClose } from 'react-icons/md'
import getConfig from 'next/config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
    const url = useMemo(() => {
      const { publicRuntimeConfig } = getConfig();
      return publicRuntimeConfig.DCB_API_BASE + '/graphql';
    }, []);

    const graphQLClient = new GraphQLClient(url); 
    const headers = { Authorization: `Bearer ${session?.accessToken}` }
    // remember your headers - these don't get added automatically with the client we're using
    // TODO: Implement a GraphQL client that does do this and supports OAuth. Our current client is glitchy and is suffering from 401s.

    // This is the react-query mutation that performs the request + updates state
    // https://tanstack.com/query/v4/docs/react/reference/useMutation
    // We have callbacks for both success and error states, in order to display our respective alerts.

    const addAgenciesMutation = useMutation(
      async (values: FormData) => {
        const { data } = await request<AddAgenciesResponse>(url, addAgenciesToGroup, {
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
    } catch (error) {
        console.error('Error:', error);
    }
    finally {
        setIsSubmitting(false); // Sets isSubmitting back to false after submission so we don't have infinite 'submitting'
      }
  };

  const FormikMaterial = () => {
    const formik = useFormik({
      initialValues: {
        groupId: '',
        agencyId: '',
      },
      validationSchema: validationSchema,
      onSubmit: handleSubmit,
    });
    return (
      <div>
        <form id = "add-agency-form" onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="groupId"
            data-tid="add-agency-groupid"
            name="groupId"
            label="Group ID"
            value={formik.values.groupId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.groupId && Boolean(formik.errors.groupId)}
            helperText={formik.touched.groupId && formik.errors.groupId}
          />
          <TextField
            fullWidth
            id="agencyId"
            data-tid="add-agency-agencyid"
            name="agencyId"
            label="Agency ID"
            value={formik.values.agencyId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.agencyId && Boolean(formik.errors.agencyId)}
            helperText={formik.touched.agencyId && formik.errors.agencyId}
          />
          <Button color="primary" data-tid="add-agency-submit" variant="contained" fullWidth type="submit">
            {t("general.submit", "Submit")}  
          </Button>
        </form>
      </div>
    );
  };

  const { t } = useTranslation();

//All modals/dialogs should have centered and bold headings, and must close onSuccess
  return (
    <div>
    <Dialog open={show} onClose={onClose}
    aria-labelledby="centred-add-agency-dialog">
        <DialogTitle data-tid="add-agency-title" style={{ textAlign: 'center'}}> {t("agencies.add_to_group")}</DialogTitle>
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
        <Alert severityType="success" onCloseFunc={() => setSuccess(false)} alertText = {t("agencies.alert_text_success")}>
        </Alert>
      )}
    {isError && (
      <Alert severityType="error" onCloseFunc={() => setError(false)} alertText = {errorMessage}>
      </Alert>
    )}
    </Dialog>
    </div>
  );
};

export async function getStaticProps({ locale }: {locale: any}) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
			'application',
			'common',
			'validation'
			])),
		},
	}
};