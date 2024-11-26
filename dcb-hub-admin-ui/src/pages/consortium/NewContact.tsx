import { useMutation } from "@apollo/client";
import TimedAlert from "@components/TimedAlert/TimedAlert";
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
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	createConsortiumContact,
	getConsortiaContacts,
} from "src/queries/queries";
import * as Yup from "yup";

interface NewContactFormData {
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	isPrimaryContact: boolean;
	reason: string;
	changeCategory: string;
	changeReferenceUrl?: string;
}

type NewContactType = {
	show: boolean;
	onClose: () => void;
	consortiumId: string;
	consortiumName: string;
};

export default function NewContact({
	show,
	onClose,
	consortiumId,
	consortiumName,
}: NewContactType) {
	const { t } = useTranslation();

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
				t("ui.validation.required", {
					field: t("libraries.contacts.role"),
				}),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
		isPrimaryContact: Yup.boolean().required(),
		reason: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("data_change_log.reason"),
				}),
			)
			.max(100, t("ui.validation.max_length", { length: 100 })),
		changeCategory: Yup.string().required(
			t("ui.validation.required", {
				field: t("data_change_log.category"),
			}),
		),
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
		},
		resolver: yupResolver(validationSchema),
		mode: "onBlur",
	});

	const [createNewContact, { loading }] = useMutation(createConsortiumContact, {
		refetchQueries: [getConsortiaContacts],
	});

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
	});

	const onSubmit = async (data: NewContactFormData) => {
		try {
			const result = await createNewContact({
				variables: { input: { ...data, consortiumId } },
			});

			if (result.data) {
				setAlert({
					open: true,
					severity: "success",
					text: t("consortium.new_contact.success", {
						consortium: consortiumName,
					}),
				});

				// Delay the modal closing and form reset to ensure the alert is visible
				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			}
		} catch (error) {
			console.error("Error creating new contact:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("consortium.new_contact.error", {
					consortium: consortiumName,
				}),
			});
		}
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-contact-modal"
			>
				<DialogTitle variant="modalTitle">
					{t("consortium.new_contact.consortium")}
				</DialogTitle>
				<Divider aria-hidden="true" />
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
									{...field}
									value={field.value || null}
									onChange={(_, newValue) => {
										field.onChange(newValue);
									}}
									options={[
										t("libraries.contacts.roles.implementation"),
										t("libraries.contacts.roles.library_service_admin"),
										t("libraries.contacts.roles.operations"),
										t("libraries.contacts.roles.sign_off"),
										t("libraries.contacts.roles.support"),
										t("libraries.contacts.roles.technical"),
									]}
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
						<Controller
							name="changeCategory"
							control={control}
							render={({ field }) => (
								<Autocomplete
									{...field}
									value={field.value || null}
									onChange={(_, newValue) => {
										field.onChange(newValue);
									}}
									options={[t("data_change_log.new_contact")]}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											label={t("data_change_log.category")}
											error={!!errors.changeCategory}
											helperText={errors.changeCategory?.message}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option === value || (!option && !value)
									}
								/>
							)}
						/>
						<Controller
							name="reason"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("data_change_log.reason")}
									variant="outlined"
									fullWidth
									required
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
							name={t("data_change_log.reference_url")}
							error={!!errors.changeReferenceUrl}
							helperText={errors.changeReferenceUrl?.message}
						/>
						<Box>
							<Controller
								name="isPrimaryContact"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={<Checkbox {...field} checked={field.value} />}
										label={t("libraries.contacts.primary")}
									/>
								)}
							/>
						</Box>
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
						{loading
							? t("ui.action.submitting")
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
