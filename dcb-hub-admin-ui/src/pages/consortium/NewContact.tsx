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
}

type NewContactType = {
	show: boolean;
	onClose: () => void;
	consortiumId: string;
};

export default function NewContact({
	show,
	onClose,
	consortiumId,
}: NewContactType) {
	const { t } = useTranslation();

	const validationSchema = Yup.object().shape({
		firstName: Yup.string().required(t("ui.new_contact.first_name_required")),
		lastName: Yup.string().required(t("ui.new_contact.last_name_required")),
		email: Yup.string()
			.email(t("ui.new_contact.invalid_email"))
			.required(t("ui.new_contact.email_required")),
		role: Yup.string().required(t("ui.new_contact.role_required")),
		reason: Yup.string().required(t("ui.new_contact.reason_required")),
		changeCategory: Yup.string().required(
			t("ui.new_contact.change_category_required"),
		),
		isPrimaryContact: Yup.boolean().required("Required"),
	});

	const { control, handleSubmit, reset, formState, register } =
		useForm<NewContactFormData>({
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
			mode: "onChange",
		});

	const [createNewContact] = useMutation(createConsortiumContact, {
		refetchQueries: [getConsortiaContacts],
	});
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
	});

	const onSubmit = async (data: NewContactFormData) => {
		try {
			const result = await createNewContact({
				variables: { input: { ...data, consortiumId: consortiumId } },
			});
			if (result.data)
				setAlert({
					open: true,
					severity: "success",
					text: t("ui.new_contact.success"),
				});
			reset();
			onClose();
		} catch (error) {
			console.error("Error creating new contact:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.new_contact.error"),
			});
		}
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				aria-labelledby="new-contact-modal"
			>
				<DialogTitle variant="modalTitle">
					{t("ui.new_contact.title")}
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
						}}
					>
						<TextField
							{...register("firstName", { required: true })}
							label={t("libraries.contacts.first_name")}
							variant="outlined"
							fullWidth
						/>
						<TextField
							{...register("lastName", { required: true })}
							label={t("libraries.contacts.last_name")}
							variant="outlined"
							fullWidth
						/>
						<TextField
							{...register("email", { required: true, pattern: /^\S+@\S+$/i })}
							label={t("libraries.contacts.email")}
							variant="outlined"
							fullWidth
						/>
						<TextField
							{...register("role", { required: true })}
							label={t("libraries.contacts.role")}
							variant="outlined"
							fullWidth
						/>
						<TextField
							{...register("reason", { required: true })}
							label={t("data_change_log.reason")}
							variant="outlined"
							fullWidth
						/>
						<Controller
							name="changeCategory"
							control={control}
							render={({ field }) => (
								<Autocomplete
									{...field}
									value={field.value ? field.value : null}
									onChange={(event, newValue) => field.onChange(newValue)}
									options={[
										t("data_change_log.categories.error_correction"),
										t("data_change_log.categories.details_changed"),
										t("data_change_log.categories.new_member"),
										t("data_change_log.categories.membership_ended"),
										t("data_change_log.categories.additional_information"),
										t("data_change_log.categories.changing_status"),
										t("data_change_log.categories.initial_setup"),
										t("data_change_log.categories.mappings_replacement"),
										t("data_change_log.categories.other"),
									]}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											name="changeCategory"
											label={t("data_change_log.category")}
											error={!!formState.errors.changeCategory}
											helperText={
												formState.errors.changeCategory
													? formState.errors.changeCategory.message
													: null
											}
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
										control={<Checkbox {...field} />}
										label={t("libraries.contacts.is_primary_contact")}
									/>
								)}
							/>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose} variant="outlined" color="primary">
						{t("mappings.cancel")}
					</Button>
					<div style={{ flex: "1 0 0" }} />
					<Button
						type="submit"
						variant="contained"
						color="primary"
						onClick={handleSubmit(onSubmit)}
					>
						{t("libraries.contacts.create_new")}
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
