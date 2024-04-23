import { useState } from "react";
import { useFormik } from "formik";
import {
	addLibraryToGroup,
	getGroupsSelection,
	getLibrariesSelection,
	getLibraryGroupById,
} from "src/queries/queries";
import { useMutation, useQuery } from "@apollo/client";
import * as Yup from "yup";
import {
	Autocomplete,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
} from "@mui/material";
//localisation
import { useTranslation } from "next-i18next";
import { MdClose } from "react-icons/md";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import TimedAlert from "@components/TimedAlert/TimedAlert";

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

export default function AddLibraryToGroup({ show, onClose }: AddLibraryType) {
	// State management variables.
	const [isSuccess, setSuccess] = useState(false);
	const [isError, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [open, setOpen] = useState(true);
	const handleClose = (
		event?: React.SyntheticEvent | Event,
		reason?: string,
	) => {
		if (reason === "clickaway") {
			return;
		}
		setOpen(false);
	};

	const { data: libraries } = useQuery(getLibrariesSelection, {
		variables: { order: "fullName", orderBy: "ASC" },
	});

	const { data: groups } = useQuery(getGroupsSelection, {
		variables: { order: "name", orderBy: "ASC" },
	});

	const [addLibraryMutation] = useMutation<AddLibrariesResponse>(
		addLibraryToGroup,
		{
			refetchQueries: (mutationResult) => {
				const groupId =
					mutationResult?.data?.addLibraryToGroup?.libraryGroup?.id;
				return [
					{
						query: getLibraryGroupById,
						variables: { query: `id:${groupId}` },
					},
				];
			},

			onCompleted: () => {
				setSuccess(true);
				setTimeout(() => {
					// The delay is so the success alert shows and the user gets feedback
					// rather than instant close
					onClose();
					setSuccess(false);
				}, 1000);
			},
			onError: (error) => {
				setError(true);
				setErrorMessage(t("libraries.error_adding_to_group"));
				console.log(t("libraries.error_adding_to_group"), error);
			},
		},
	);

	const formik = useFormik({
		initialValues: {
			groupId: "",
			libraryId: "",
		},
		validationSchema: Yup.object({
			groupId: Yup.string().required("Group is required"),
			libraryId: Yup.string().required("Library is required"),
		}),
		onSubmit: (values) => {
			addLibraryMutation({
				variables: {
					input: {
						libraryGroup: values.groupId,
						library: values.libraryId,
					},
				},
			});
		},
	});

	const { t } = useTranslation();

	//All modals/dialogs should have centered and bold headings, and must close onSuccess
	return (
		<Dialog
			open={show}
			onClose={onClose}
			aria-labelledby="form-dialog-title"
			fullWidth={true}
			maxWidth={"xs"}
		>
			<DialogTitle id="form-dialog-title">
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
				<form onSubmit={formik.handleSubmit}>
					<Autocomplete
						options={groups?.libraryGroups?.content}
						getOptionLabel={(option: any) => option.name}
						onChange={(event, value) =>
							formik.setFieldValue("groupId", value.id)
						}
						renderInput={(params) => <TextField {...params} label="Group" />}
					/>
					<Autocomplete
						options={libraries?.libraries?.content}
						getOptionLabel={(option: any) => option.fullName}
						onChange={(event, value) =>
							formik.setFieldValue("libraryId", value.id)
						}
						renderInput={(params) => <TextField {...params} label="Library" />}
					/>
					<Button type="submit" color="primary" variant="contained" fullWidth>
						{t("general.submit")}
					</Button>
				</form>
			</DialogContent>
			{isSuccess && (
				<TimedAlert
					severityType="success"
					open={open}
					autoHideDuration={3000}
					onCloseFunc={handleClose}
					alertText={t("libraries.alert_text_success")}
					key={"add-library-success"}
				/>
			)}
			{isError && (
				<TimedAlert
					severityType="error"
					open={open}
					autoHideDuration={3000}
					onCloseFunc={handleClose}
					alertText={errorMessage}
					key={"add-library-success"}
				/>
			)}
		</Dialog>
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
