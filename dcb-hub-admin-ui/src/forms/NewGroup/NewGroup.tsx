import { useState } from "react";
import { useMutation } from "@apollo/client";
import * as Yup from "yup";
import { createLibraryGroup } from "src/queries/queries";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Button,
	TextField,
	Box,
	DialogActions,
} from "@mui/material";
import { Close } from "@mui/icons-material";
//localisation
import { useTranslation } from "next-i18next";
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import TimedAlert from "@components/TimedAlert/TimedAlert";

interface FormData {
	name: string;
	code: string;
	type: string;
}

interface CreateGroupResponse {
	data: {
		createLibraryGroup: {
			id: string;
			code: string;
			name: string;
			type: string;
		};
	};
}

type NewGroupType = {
	show: boolean;
	onClose: any;
	// type: string; - for if/when we make this a generic 'New' form later
};

//This validates input client-side for the form
// add translation keys
const validationSchema = Yup.object().shape({
	name: Yup.string()
		.required("Group name is required")
		.max(32, "Group name must be at most 32 characters"),
	code: Yup.string()
		.required("Group code is required")
		.max(5, "Group code must be at most 5 characters"),
	type: Yup.string()
		.required("Group type is required")
		.max(32, "Group type must be at most 32 characters"),
});

// sort Group typings
export default function NewGroup({ show, onClose }: NewGroupType) {
	const { t } = useTranslation();
	const [createGroupMutation, { loading }] = useMutation<CreateGroupResponse>(
		createLibraryGroup,
		{
			refetchQueries: ["LoadGroups"],
		},
	);
	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
	});

	const onSubmit = async (values: FormData) => {
		try {
			const result = await createGroupMutation({
				variables: {
					input: {
						name: values.name,
						code: values.code,
						type: values.type,
					},
				},
			});
			if (result.data) {
				setAlert({
					open: true,
					severity: "success",
					text: t("groups.new_group_success"),
				});

				// Delay the modal closing and form reset to ensure the alert is visible
				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			} else {
				console.error("Error creating new group");
				setAlert({
					open: true,
					severity: "error",
					text: t("groups.new_group_error"),
				});
			}
		} catch (error) {
			// We should bear in mind that GraphQL errors often come as '200' responses.
			console.error("Error creating new group:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("groups.new_group_error"),
			});
		}
	};

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty },
	} = useForm<FormData>({
		defaultValues: {
			name: "",
			code: "",
			type: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				aria-labelledby="new-group-modal"
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle data-tid="new-group-title" variant="modalTitle">
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
					<Close />
				</IconButton>
				<DialogContent>
					<Box
						component="form"
						onSubmit={handleSubmit(onSubmit)}
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2,
							mt: 2,
						}}
					>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("groups.name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.name}
									helperText={errors.name?.message}
								/>
							)}
						/>
						<Controller
							name="code"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("groups.code")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.code}
									helperText={errors.code?.message}
								/>
							)}
						/>
						<Controller
							name="type"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("groups.type")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.type}
									helperText={errors.type?.message}
								/>
							)}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={onClose} variant="outlined" color="primary">
						{t("mappings.cancel")}
					</Button>
					<div style={{ flex: "1 0 0" }} />
					<Button
						type="submit"
						variant="contained"
						color="primary"
						disabled={!isValid || !isDirty || loading}
						onClick={handleSubmit(onSubmit)}
					>
						{loading ? t("ui.action.submitting") : t("groups.type_new")}
					</Button>
				</DialogActions>
			</Dialog>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</>
	);
}

// export async function getStaticProps({ locale }: { locale: string }) {
// 	return {
// 		props: {
// 			...(await serverSideTranslations(locale, [
// 				"application",
// 				"common",
// 				"validation",
// 			])),
// 		},
// 	};
// }
