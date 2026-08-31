import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	MenuItem,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { provisionLibraryUser } from "@mutations/provisionLibraryUser";
import {
	buildNewLibraryUserSchema,
	NewLibraryUserFormData,
	PROVISIONABLE_ROLES,
} from "@schemas/newLibraryUserSchema";

/** A person this library already records, offered as a starting point. */
export interface ContactSuggestion {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
}

interface NewLibraryUserProps {
	show: boolean;
	onClose: () => void;
	libraryId: string;
	libraryName?: string;
	/**
	 * The library's existing contacts. Selecting one fills the name and address in
	 * rather than asking for them a second time — WCAG 3.3.7 (redundant entry), and the
	 * obvious courtesy: these people were entered on the contacts tab already.
	 */
	contacts?: ContactSuggestion[];
}

export default function NewLibraryUser({
	show,
	onClose,
	libraryId,
	libraryName,
	contacts = [],
}: NewLibraryUserProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({ open: false, severity: "success", text: null });

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isValid, isSubmitting },
	} = useForm<NewLibraryUserFormData>({
		defaultValues: {
			email: "",
			firstName: "",
			lastName: "",
			role: "LIBRARY_READ_ONLY",
		},
		// The narrower of the two roles by default. An account that can read but not
		// change is the safer thing to create by accident.
		resolver: yupResolver(buildNewLibraryUserSchema(t)) as never,
		mode: "onChange",
	});

	const provision = useMutation({
		mutationFn: (data: NewLibraryUserFormData) =>
			gqlClient.request<unknown>(provisionLibraryUser, {
				input: {
					libraryId,
					email: data.email,
					firstName: data.firstName,
					lastName: data.lastName,
					role: data.role,
					reason: data.reason,
					changeCategory: data.changeCategory,
					changeReferenceUrl: data.changeReferenceUrl,
				},
			}),
		onSuccess: () => {
			// The narrowest key that is actually stale. A bare invalidateQueries() would
			// re-fire every mounted query on the page.
			queryClient.invalidateQueries({
				queryKey: ["libraryUsers", libraryId],
			});

			setAlert({
				open: true,
				severity: "success",
				text: t("libraries.accounts.new.success", { library: libraryName }),
			});

			setTimeout(() => {
				reset();
				onClose();
			}, 1000);
		},
		onError: (error: Error) => {
			// The message is the server's, because its refusals are specific and useful:
			// "this library has no agency code", "already has an account for that email".
			// Swallowing them into a generic failure would hide the one thing the user
			// needs to act on.
			setAlert({
				open: true,
				severity: "error",
				text: t("libraries.accounts.new.error", { error: error.message }),
			});
		},
	});

	const usableContacts = contacts.filter((contact) => Boolean(contact.email));

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-library-user-title"
			>
				<DialogTitle id="new-library-user-title" variant="modalTitle">
					{t("libraries.accounts.new.title")}
				</DialogTitle>
				<Divider aria-hidden="true" />
				<DialogContent>
					<Typography variant="body2" sx={{ mb: 2 }}>
						{t("libraries.accounts.new.explanation")}
					</Typography>

					<Box
						component="form"
						id="new-library-user-form"
						onSubmit={handleSubmit((data) => provision.mutate(data))}
						sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
					>
						{usableContacts.length > 0 && (
							<TextField
								select
								fullWidth
								defaultValue=""
								label={t("libraries.accounts.new.from_contact")}
								helperText={t("libraries.accounts.new.from_contact_help")}
								onChange={(event) => {
									const contact = usableContacts[Number(event.target.value)];

									if (!contact) {
										return;
									}

									// shouldValidate so the form reflects that it is now
									// complete; without it the submit button stays disabled
									// after a pre-fill that filled everything in.
									setValue("firstName", contact.firstName ?? "", {
										shouldValidate: true,
									});
									setValue("lastName", contact.lastName ?? "", {
										shouldValidate: true,
									});
									setValue("email", contact.email ?? "", {
										shouldValidate: true,
									});
								}}
							>
								{usableContacts.map((contact, index) => (
									<MenuItem key={contact.email} value={String(index)}>
										{`${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() ||
											contact.email}
									</MenuItem>
								))}
							</TextField>
						)}

						<Controller
							name="firstName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.accounts.first_name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.firstName}
									helperText={errors.firstName?.message}
									// Colour is never the only signal, and the message is
									// linked to the field rather than merely near it.
									aria-invalid={!!errors.firstName}
								/>
							)}
						/>
						<Controller
							name="lastName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.accounts.last_name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.lastName}
									helperText={errors.lastName?.message}
									aria-invalid={!!errors.lastName}
								/>
							)}
						/>
						<Controller
							name="email"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									type="email"
									label={t("libraries.accounts.email")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.email}
									helperText={
										errors.email?.message ??
										t("libraries.accounts.new.email_help")
									}
									aria-invalid={!!errors.email}
								/>
							)}
						/>
						<Controller
							name="role"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									select
									label={t("libraries.accounts.role")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.role}
									helperText={errors.role?.message}
									aria-invalid={!!errors.role}
								>
									{PROVISIONABLE_ROLES.map((role) => (
										<MenuItem key={role} value={role}>
											{t(`libraries.accounts.roles.${role.toLowerCase()}`)}
										</MenuItem>
									))}
								</TextField>
							)}
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>{t("ui.action.cancel")}</Button>
					<Button
						type="submit"
						form="new-library-user-form"
						variant="contained"
						disabled={!isValid || isSubmitting || provision.isPending}
					>
						{t("libraries.accounts.new.submit")}
					</Button>
				</DialogActions>
			</Dialog>

			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={5000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={
					alert.severity === "success"
						? t("libraries.accounts.new.success_title")
						: t("libraries.accounts.new.error_title")
				}
			/>
		</>
	);
}
