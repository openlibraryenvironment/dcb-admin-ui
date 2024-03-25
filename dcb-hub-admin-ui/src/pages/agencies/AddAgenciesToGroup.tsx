import { useState } from "react";
import { useFormik } from "formik";
import { addAgenciesToGroup } from "src/queries/queries";
import { gql, useMutation } from "@apollo/client";
import * as Yup from "yup";
import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
	useTheme,
} from "@mui/material";
import Alert from "@components/Alert/Alert";
//localisation
import { useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

interface FormData {
	groupId: string;
	agencyId: string;
	// Add more fields as needed when we know them
}
// This is a TypeScript type definition for the response we get from the GraphQL server.
// Without this, we receive a 'property does not exist on type unknown' error.
interface AddAgenciesResponse {
	addAgencyToGroup: {
		id: string;
		agency: {
			id: string;
			code: string;
			name: string;
		};
		group: {
			id: string;
			code: string;
			name: string;
		};
	};
}

const initialValues: FormData = {
	groupId: "",
	agencyId: "",
};

type NewGroupType = {
	show: boolean;
	onClose: any;
	// type: string; - for if/when we make this a generic 'New' form later
	// this will also eventually contain an array of agencies for multi-select
};

//This validates input client-side for the form
const validationSchema = Yup.object().shape({
	groupId: Yup.string()
		.required("Group ID is required")
		.max(36, "Group ID must be at most 36 characters"),
	agencyId: Yup.string()
		.required("Agency ID is required")
		.max(36, "Agency ID must be at most 36 characters"),
});

export default function AddAgenciesToGroup({ show, onClose }: NewGroupType) {
	// State management variables.
	const [isSuccess, setSuccess] = useState(false);
	const [isError, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const theme = useTheme();

	// As this returns an updated agency, not a group, and we can't refetch non-active queries, we must update cache ourselves. If we were able to force a refetch, that would be much better
	//https://www.apollographql.com/docs/react/data/mutations#refetching-queries

	const [addAgenciesMutation, { loading }] = useMutation<AddAgenciesResponse>(
		addAgenciesToGroup,
		{
			update(cache, { data }) {
				// Ensure that groups are updated instantly client-side with this new info
				const newAgency = data?.addAgencyToGroup?.agency;

				const groupId = data?.addAgencyToGroup?.group?.id;

				cache.modify({
					id: cache.identify({ __typename: "AgencyGroup", id: groupId }),

					fields: {
						members(existingMembers = [], { readField }) {
							const newMemberRef = cache.writeFragment({
								data: newAgency,
								fragment: gql`
									fragment NewAgency on Agency {
										id
										code
										name
									}
								`,
							});
							if (
								existingMembers.some(
									(member: any) =>
										readField("id", member.agency) === newAgency?.id,
								)
							) {
								return existingMembers;
							}

							return [...existingMembers, { agency: newMemberRef }];
						},
					},
				});
			},
			onCompleted: () => {
				setSuccess(true);
				onClose();
			},
			onError: (error) => {
				setError(true);
				setErrorMessage(
					"Failed to add agency to group. Please retry, and if this issue persists please sign out and back in again.",
				);
				// console.error('Error:', error);
			},
		},
	);

	// This function governs what happens after we click 'submit'.
	const handleSubmit = async (values: FormData) => {
		try {
			await addAgenciesMutation({
				variables: {
					input: {
						group: values.groupId,
						agency: values.agencyId,
					},
				},
			});
			onClose(); // close on success
		} catch (error) {
			// We should bear in mind that GraphQL errors often come as '200' responses and implement better handling.
			console.error("Error adding agency to group:", error);
		}
	};

	const FormikMaterial = () => {
		const formik = useFormik({
			initialValues: {
				groupId: "",
				agencyId: "",
			},
			validationSchema: validationSchema,
			onSubmit: handleSubmit,
		});
		return (
			<div>
				<form id="add-agency-form" onSubmit={formik.handleSubmit}>
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
					<Button
						color="primary"
						data-tid="add-agency-submit"
						variant="contained"
						fullWidth
						type="submit"
					>
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
			<Dialog
				open={show}
				onClose={onClose}
				aria-labelledby="centred-add-agency-dialog"
			>
				<DialogTitle data-tid="add-agency-title" variant="modalTitle">
					{" "}
					{t("agencies.add_to_group")}
				</DialogTitle>
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: "absolute",
						right: 8,
						top: 8,
						color: (theme) => theme.palette.grey[500],
					}}
				>
					<MdClose />
				</IconButton>
				<DialogContent>
					<FormikMaterial />
				</DialogContent>
				{isSuccess && (
					<Alert
						textColor={theme.palette.common.black}
						severityType="success"
						onCloseFunc={() => setSuccess(false)}
						alertText={t("agencies.alert_text_success")}
					></Alert>
				)}
				{isError && (
					<Alert
						severityType="error"
						onCloseFunc={() => setError(false)}
						alertText={errorMessage}
						textColor={theme.palette.common.white}
					></Alert>
				)}
			</Dialog>
		</div>
	);
}

export async function getStaticProps({ locale }: { locale: any }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
				"application",
				"common",
				"validation",
			])),
		},
	};
}
