import { useState } from "react";
import { useFormik } from "formik";
import { addLibraryToGroup } from "src/queries/queries";
import { gql, useMutation } from "@apollo/client";
import * as Yup from "yup";
import {
	Box,
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

// FUTURE WORK: Make this take a name or code - something easier than UUID
interface FormData {
	groupId: string;
	libraryId: string;
	// Add more fields as needed when we know them
}
// This is a TypeScript type definition for the response we get from the GraphQL server.
// Without this, we receive a 'property does not exist on type unknown' error.
interface AddLibrariesResponse {
	addLibraryToGroup: {
		id: string;
		library: {
			id: string;
			libraryCode: string;
			fullName: string;
		};
		libraryGroup: {
			id: string;
			code: string;
			name: string;
			type: string;
		};
	};
}

type AddLibraryType = {
	show: boolean;
	onClose: any;
	// type: string; - for if/when we make this a generic 'New' form later
	// this will also eventually contain an array of libraries for multi-select
};

//This validates input client-side for the form - TRANSLATIONS NEEDED
const validationSchema = Yup.object().shape({
	groupId: Yup.string()
		.required("Group UUID is required")
		.max(36, "Group UUID must be at most 36 characters"),
	libraryId: Yup.string()
		.required("Library UUID is required")
		.max(36, "Library UUID must be at most 36 characters"),
});

export default function AddLibraryToGroup({ show, onClose }: AddLibraryType) {
	// State management variables.
	const [isSuccess, setSuccess] = useState(false);
	const [isError, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const theme = useTheme();

	// As this returns an updated library, not a group, and we can't refetch non-active queries, we must update cache ourselves. If we were able to force a refetch, that would be much better
	//https://www.apollographql.com/docs/react/data/mutations#refetching-queries

	const [addLibraryMutation] = useMutation<AddLibrariesResponse>(
		addLibraryToGroup,
		{
			update(cache, { data }) {
				// Ensure that groups are updated instantly client-side with this new info
				const newLibrary = data?.addLibraryToGroup?.library;

				const libraryGroupId = data?.addLibraryToGroup?.libraryGroup?.id;

				cache.modify({
					id: cache.identify({
						__typename: "LibraryGroup",
						id: libraryGroupId,
					}),

					fields: {
						members(existingMembers = [], { readField }) {
							const newMemberRef = cache.writeFragment({
								data: newLibrary,
								fragment: gql`
									fragment NewLibrary on Library {
										id
										agencyCode
										fullName
										type
									}
								`,
							});
							if (
								existingMembers.some(
									(member: any) =>
										readField("id", member.library) === newLibrary?.id,
								)
							) {
								return existingMembers;
							}

							return [...existingMembers, { library: newMemberRef }];
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
				setErrorMessage(t("libraries.error_adding_to_group"));
				console.log(t("libraries.error_adding_to_group"), error);
			},
		},
	);

	// This function governs what happens after we click 'submit'.
	const handleSubmit = async (values: FormData) => {
		try {
			await addLibraryMutation({
				variables: {
					input: {
						libraryGroup: values.groupId,
						library: values.libraryId,
					},
				},
			});
			onClose(); // close on success
		} catch (error) {
			// We should bear in mind that GraphQL errors often come as '200' responses and implement better handling.
			console.error(t("libraries.error_adding_to_group"));
		}
	};

	const FormikMaterial = () => {
		const formik = useFormik({
			initialValues: {
				groupId: "",
				libraryId: "",
			},
			validationSchema: validationSchema,
			onSubmit: handleSubmit,
		});
		return (
			<Box>
				<form id="add-library-form" onSubmit={formik.handleSubmit}>
					<TextField
						fullWidth
						id="groupId"
						data-tid="add-library-groupid"
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
						id="libraryId"
						data-tid="add-library-libraryid"
						name="libraryId"
						label="Library ID"
						value={formik.values.libraryId}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						error={formik.touched.libraryId && Boolean(formik.errors.libraryId)}
						helperText={formik.touched.libraryId && formik.errors.libraryId}
					/>
					<Button
						color="primary"
						data-tid="add-library-submit"
						variant="contained"
						fullWidth
						type="submit"
					>
						{t("general.submit", "Submit")}
					</Button>
				</form>
			</Box>
		);
	};

	const { t } = useTranslation();

	//All modals/dialogs should have centered and bold headings, and must close onSuccess
	return (
		<div>
			<Dialog
				open={show}
				onClose={onClose}
				aria-labelledby="centred-add-library-dialog"
			>
				<DialogTitle data-tid="add-library-title" variant="modalTitle">
					{t("libraries.add_to_group")}
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
						alertText={t("libraries.alert_text_success")}
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

export async function getStaticProps({ locale }: { locale: string }) {
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
