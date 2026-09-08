import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
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

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { createLibraryGroup } from "@mutations/createLibraryGroup";
import type { CreateLibraryGroupMutationVariables } from "@generated/graphql";

interface FormData {
	name: string;
	code: string;
	type: string;
}

type NewGroupType = {
	show: boolean;
	onClose: () => void;
};

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

export default function NewGroup({ show, onClose }: NewGroupType) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
	});

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

	const mutation = useMutation({
		mutationFn: async (values: FormData) => {
			return gqlClient.request<any, CreateLibraryGroupMutationVariables>(
				createLibraryGroup,
				{
					input: {
						name: values.name,
						code: values.code,
						type: values.type,
					},
				},
			);
		},
		onSuccess: (data) => {
			if (data) {
				queryClient.invalidateQueries({ queryKey: ["groups"] });

				setAlert({
					open: true,
					severity: "success",
					text: t("groups.new_group_success"),
				});

				// Delay modal closing slightly so the user sees the confirmation banner
				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			} else {
				throw new Error("No data returned from service layer");
			}
		},
		onError: (error) => {
			console.error("Error creating new group:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("groups.new_group_error"),
			});
		},
	});

	const onSubmit = (values: FormData) => {
		mutation.mutate(values);
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				aria-labelledby="new-group-modal-title"
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle
					id="new-group-modal-title"
					data-tid="new-group-title"
					variant="modalTitle"
				>
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
						id="new-group-form"
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
						form="new-group-form"
						variant="contained"
						color="primary"
						disabled={!isValid || !isDirty || mutation.isPending}
					>
						{mutation.isPending
							? t("ui.actions.submitting")
							: t("groups.type_new")}
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
