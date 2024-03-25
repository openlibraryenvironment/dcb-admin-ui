import { useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@apollo/client";
import * as Yup from "yup";
import { createGroup } from "src/queries/queries";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	styled,
	Button,
	TextField,
	useTheme,
} from "@mui/material";
import Alert from "@components/Alert/Alert";
import { MdClose } from "react-icons/md";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

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
	show: boolean;
	onClose: any;
	// type: string; - for if/when we make this a generic 'New' form later
};

//This validates input client-side for the form
const validationSchema = Yup.object().shape({
	name: Yup.string()
		.required("Group name is required")
		.max(32, "Group name must be at most 32 characters"),
	code: Yup.string()
		.required("Group code is required")
		.max(5, "Group code must be at most 5 characters"),
});

// sort Group typings
export default function NewGroup({ show, onClose }: NewGroupType) {
	const [isSuccess, setSuccess] = useState(false);
	const [isError, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const { t } = useTranslation();
	const theme = useTheme();

	const [createGroupMutation, { loading }] = useMutation<CreateGroupResponse>(
		createGroup,
		{
			refetchQueries: ["LoadGroups"],
			onCompleted: () => {
				setSuccess(true);
				onClose();
			},
			onError: (error) => {
				setError(true);
				setErrorMessage(
					"Failed to create a new group. Please retry, and if this issue persists, sign out and back in again.",
				);
				console.error("Error:", error);
			},
		},
	);

	const handleSubmit = async (values: FormData) => {
		try {
			await createGroupMutation({
				variables: {
					input: {
						name: values.name,
						code: values.code,
					},
				},
			});
			onClose(); // this is supposed to auto-close on success
		} catch (error) {
			// We should bear in mind that GraphQL errors often come as '200' responses.
			console.error("Error creating a new group:", error);
		}
	};

	const FormikMaterial = () => {
		const formik = useFormik({
			initialValues: {
				name: "",
				code: "",
			},
			validationSchema: validationSchema,
			onSubmit: handleSubmit,
		});
		return (
			<div>
				<form id="new-group-form" onSubmit={formik.handleSubmit}>
					<TextField
						fullWidth
						data-tid="new-group-name"
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
						data-tid="new-group-code"
						id="code"
						name="code"
						label="Group Code"
						value={formik.values.code}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						error={formik.touched.code && Boolean(formik.errors.code)}
						helperText={formik.touched.code && formik.errors.code}
					/>
					<Button
						data-tid="new-group-submit"
						color="primary"
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

	return (
		<Dialog open={show} onClose={onClose} aria-labelledby="new-group-dialog">
			<DialogTitle data-tid="new-group-title" variant="modalTitle">
				{" "}
				{t("groups.type_new")}
			</DialogTitle>
			<IconButton
				data-tid="new-group-close"
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
					severityType="success"
					onCloseFunc={() => setSuccess(false)}
					alertText={t("groups.new_group_success")}
					textColor={theme.palette.common.black}
				/>
			)}
			{isError && (
				<Alert
					severityType="error"
					onCloseFunc={() => setError(false)}
					alertText={errorMessage}
					textColor={theme.palette.common.black}
				/>
			)}
		</Dialog>
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
