import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import {
	Autocomplete,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	TextField,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { createConsortiumContact } from "@mutations/createConsortiumContact";
import { createLibraryContact } from "@mutations/createLibraryContact";

interface NewContactFormData {
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	isPrimaryContact?: boolean;
	reason?: string;
	changeCategory?: string;
	changeReferenceUrl?: string;
}

type NewContactType = {
	show: boolean;
	onClose: () => void;
	id: string;
	name: string;
	entity: "Library" | "Consortium";
};

export default function NewContact({
	show,
	onClose,
	id,
	name,
	entity,
}: NewContactType) {
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

	const validationSchema = Yup.object().shape({
		firstName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.contacts.first_name"),
				}),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
		lastName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.contacts.last_name"),
				}),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
		email: Yup.string()
			.trim()
			.required(
				t("ui.validation.invalid_email", {
					field: t("libraries.contacts.email"),
				}),
			)
			.test("is-email", t("ui.validation.invalid_email"), (value) =>
				value ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : true,
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		role: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", { field: t("libraries.contacts.role") }),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty },
		register,
	} = useForm<NewContactFormData>({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			role: "",
			reason: "",
			changeCategory: "",
			isPrimaryContact: false,
			changeReferenceUrl: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	const contactMutation = useMutation({
		mutationFn: async (data: NewContactFormData) => {
			const targetMutation =
				entity === "Consortium"
					? createConsortiumContact
					: createLibraryContact;
			const payload =
				entity === "Consortium"
					? { ...data, consortiumId: id }
					: { ...data, libraryId: id };

			return gqlClient.request<any>(targetMutation, { input: payload });
		},
		onSuccess: (responseData) => {
			if (responseData) {
				// UPGRADE: Invalidate clean dynamic state structures depending on entity context
				const queryKeyToInvalidate =
					entity === "Consortium"
						? "getConsortiaContacts"
						: "getLibraryContacts";
				queryClient.invalidateQueries({ queryKey: [queryKeyToInvalidate] });

				setAlert({
					open: true,
					severity: "success",
					text:
						entity === "Consortium"
							? t("consortium.new_contact.success", { consortium: name })
							: t("libraries.new_contact.success", { library: name }),
				});

				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			}
		},
		onError: (error) => {
			console.error("Error creating new contact:", error);
			setAlert({
				open: true,
				severity: "error",
				text:
					entity === "Consortium"
						? t("consortium.new_contact.error", { consortium: name })
						: t("libraries.new_contact.error", { library: name }),
			});
		},
	});

	const onSubmit = (data: NewContactFormData) => {
		contactMutation.mutate(data);
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-contact-modal-title"
			>
				<DialogTitle id="new-contact-modal-title" variant="modalTitle">
					{entity === "Consortium"
						? t("consortium.new_contact.consortium")
						: t("consortium.new_contact.library")}
				</DialogTitle>
				<Divider aria-hidden="true" />
				<DialogContent>
					<Box
						component="form"
						id="new-contact-form"
						onSubmit={handleSubmit(onSubmit)}
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2,
							mt: 2,
						}}
					>
						<Controller
							name="firstName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.contacts.first_name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.firstName}
									helperText={errors.firstName?.message}
								/>
							)}
						/>
						<Controller
							name="lastName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.contacts.last_name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.lastName}
									helperText={errors.lastName?.message}
								/>
							)}
						/>
						<Controller
							name="email"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.contacts.email")}
									variant="outlined"
									type="email"
									fullWidth
									required
									error={!!errors.email}
									helperText={errors.email?.message}
								/>
							)}
						/>
						<Controller
							name="role"
							control={control}
							render={({ field }) => (
								<Autocomplete
									options={[
										t("libraries.contacts.roles.implementation"),
										t("libraries.contacts.roles.library_service_admin"),
										t("libraries.contacts.roles.operations"),
										t("libraries.contacts.roles.sign_off"),
										t("libraries.contacts.roles.support"),
										t("libraries.contacts.roles.technical"),
									]}
									value={field.value || null}
									onChange={(_, newValue) => {
										field.onChange(newValue);
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											label={t("libraries.contacts.role")}
											error={!!errors.role}
											helperText={errors.role?.message}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option === value || (!option && !value)
									}
								/>
							)}
						/>
						<Box>
							<Controller
								name="isPrimaryContact"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={
											<Checkbox
												checked={!!field.value}
												onChange={(e) => field.onChange(e.target.checked)}
											/>
										}
										label={t("libraries.contacts.primary")}
									/>
								)}
							/>
						</Box>
						<Controller
							name="reason"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("data_change_log.reason_addition")}
									variant="outlined"
									fullWidth
									error={!!errors.reason}
									helperText={errors.reason?.message}
								/>
							)}
						/>

						<TextField
							{...register("changeReferenceUrl")}
							fullWidth
							variant="outlined"
							label={t("data_change_log.reference_url")}
							error={!!errors.changeReferenceUrl}
							helperText={errors.changeReferenceUrl?.message}
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
						form="new-contact-form"
						variant="contained"
						color="primary"
						disabled={!isValid || !isDirty || contactMutation.isPending}
					>
						{contactMutation.isPending
							? t("ui.actions.submitting")
							: t("consortium.new_contact.title")}
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
