import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	useForm,
	Controller,
	FormProvider,
	useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
	Alert,
	AlertTitle,
	Autocomplete,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormLabel,
	IconButton,
	LinearProgress,
	Stack,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import TimedAlert from "@components/TimedAlert/TimedAlert";
import Confirmation from "@components/Confirmation/Confirmation";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getGroupsSelection } from "@queries/getGroupsSelection";
import { createLibraryGroup } from "@mutations/createLibraryGroup";
import { createConsortiumMutation } from "@mutations/createConsortium";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import {
	CONTACT_ROLE_OPTIONS,
	contactRoleLabelKey,
} from "@constants/contactRoles";
import {
	CONSORTIUM_FUNCTIONAL_SETTINGS,
	defaultFunctionalSettingSelection,
	storedDescription,
} from "@constants/functionalSettings";
import {
	newConsortiumSchema,
	type NewConsortiumFormValues,
} from "@schemas/newConsortiumSchema";
import { CONSORTIUM_BASICS_QUERY_KEY } from "@/queryOptions/consortium";
import type {
	CreateConsortiumMutationVariables,
	CreateLibraryGroupMutationVariables,
	LoadGroupsSelectionQueryVariables,
} from "@generated/graphql";

/**
 * Standing a consortium up on an empty DCB instance.
 *
 * There was no way to do this from DCB Admin at all: `createConsortium` existed
 * on the schema, nothing called it, and a fresh instance showed "No consortium
 * has been set up on this system yet" on the consortium page with no action
 * attached. Every other page then behaved as though the user had simply not
 * looked hard enough.
 *
 * The awkward part is a backend precondition rather than a UI choice:
 * CreateConsortiumDataFetcher resolves `groupName` against an existing
 * LibraryGroup of type "Consortium" and refuses if there is not one, so this
 * form creates that group itself rather than sending the user away to do it and
 * come back.
 */

type NewConsortiumProps = {
	show: boolean;
	onClose: () => void;
	/** Offered on the confirmation step - initial setup is many libraries. */
	onAddFirstLibrary?: () => void;
};

const STEPS = [
	{ id: "details", labelKey: "consortium.new.step_details" },
	{ id: "settings", labelKey: "consortium.new.step_settings" },
	{ id: "contact", labelKey: "consortium.new.step_contact" },
	{ id: "done", labelKey: "consortium.new.step_done" },
] as const;

/** Derived, not hardcoded: a hardcoded index silently stopped advancing to the
 *  confirmation step the moment a step was inserted ahead of it. */
const DONE_STEP_INDEX = STEPS.findIndex((step) => step.id === "done");

const STEP_FIELDS: Record<string, (keyof NewConsortiumFormValues)[]> = {
	details: [
		"name",
		"displayName",
		"groupName",
		"groupCode",
		"dateOfLaunch",
		"websiteUrl",
		"catalogueSearchUrl",
		"description",
		"reason",
	],
	settings: ["functionalSettings"],
	contact: ["contacts"],
};

/**
 * Each functional setting, with a description of what it does. Add new ones here.
 *
 *  Everything here is changeable later on the
 * functional settings page - this screen exists so the user gets chance to choose what they start with
 */
const FunctionalSettingsStep = () => {
	const { t } = useTranslation();
	const { control } = useFormContext<NewConsortiumFormValues>();

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			<Typography>{t("consortium.new.settings_explanation")}</Typography>

			<FormControl component="fieldset" sx={{ width: "100%" }}>
				<FormLabel component="legend">
					<Typography variant="hitCount">
						{t("consortium.new.settings_legend")}
					</Typography>
				</FormLabel>
				<FormGroup>
					<Stack spacing={1} sx={{ mt: 1 }}>
						{CONSORTIUM_FUNCTIONAL_SETTINGS.map((setting) => (
							<Controller
								key={setting.name}
								name={`functionalSettings.${setting.name}`}
								control={control}
								render={({ field }) => (
									<FormControlLabel
										sx={{ alignItems: "flex-start" }}
										control={
											<Checkbox
												{...field}
												id={`functional-setting-${setting.name}`}
												checked={field.value === true}
												onChange={(event) =>
													field.onChange(event.target.checked)
												}
											/>
										}
										label={
											<>
												<Typography variant="body1">
													{t(setting.labelKey)}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{t(setting.descriptionKey)}
												</Typography>
											</>
										}
									/>
								)}
							/>
						))}
					</Stack>
				</FormGroup>
			</FormControl>

			<Alert severity="info">{t("consortium.new.settings_changeable")}</Alert>
		</Stack>
	);
};

const DetailsStep = () => {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext<NewConsortiumFormValues>();

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			<Typography>{t("consortium.new.details_explanation")}</Typography>

			<Controller
				name="name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-name"
						label={t("consortium.name")}
						required
						fullWidth
						error={!!errors.name}
						helperText={errors.name?.message ?? t("consortium.new.name_helper")}
					/>
				)}
			/>
			<Controller
				name="displayName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-display-name"
						label={t("consortium.display_name")}
						required
						fullWidth
						error={!!errors.displayName}
						helperText={
							errors.displayName?.message ??
							t("consortium.new.display_name_helper")
						}
					/>
				)}
			/>

			<Alert severity="info">{t("consortium.new.group_explanation")}</Alert>

			<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
				<Controller
					name="groupName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-group-name"
							label={t("groups.name")}
							required
							fullWidth
							error={!!errors.groupName}
							helperText={errors.groupName?.message}
						/>
					)}
				/>
				<Controller
					name="groupCode"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-group-code"
							label={t("groups.code")}
							required
							fullWidth
							error={!!errors.groupCode}
							helperText={errors.groupCode?.message}
						/>
					)}
				/>
			</Stack>

			<Controller
				name="dateOfLaunch"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-date-of-launch"
						type="date"
						label={t("consortium.date_of_launch")}
						required
						fullWidth
						error={!!errors.dateOfLaunch}
						helperText={errors.dateOfLaunch?.message}
						slotProps={{ inputLabel: { shrink: true } }}
					/>
				)}
			/>

			<Controller
				name="websiteUrl"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-website-url"
						label={t("consortium.url")}
						fullWidth
						error={!!errors.websiteUrl}
						helperText={errors.websiteUrl?.message}
					/>
				)}
			/>
			<Controller
				name="catalogueSearchUrl"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-catalogue-search-url"
						label={t("consortium.search_url")}
						fullWidth
						error={!!errors.catalogueSearchUrl}
						helperText={errors.catalogueSearchUrl?.message}
					/>
				)}
			/>
			<Controller
				name="description"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-description"
						label={t("consortium.description_title")}
						fullWidth
						multiline
						rows={3}
						error={!!errors.description}
						helperText={errors.description?.message}
					/>
				)}
			/>
			<Controller
				name="reason"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-reason"
						label={t("data_change_log.reason_addition")}
						required
						fullWidth
						error={!!errors.reason}
						helperText={errors.reason?.message}
					/>
				)}
			/>
			<Controller
				name="changeReferenceUrl"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-change-reference-url"
						label={t("data_change_log.reference_url")}
						fullWidth
						error={!!errors.changeReferenceUrl}
						helperText={errors.changeReferenceUrl?.message}
					/>
				)}
			/>
		</Stack>
	);
};

const ContactStep = () => {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext<NewConsortiumFormValues>();
	const contactErrors = errors.contacts as any;

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			<Typography>{t("consortium.new.contact_explanation")}</Typography>

			<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
				<Controller
					name="contacts.0.firstName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-contact-first-name"
							label={t("libraries.contacts.first_name")}
							required
							fullWidth
							autoComplete="given-name"
							error={!!contactErrors?.[0]?.firstName}
							helperText={contactErrors?.[0]?.firstName?.message}
						/>
					)}
				/>
				<Controller
					name="contacts.0.lastName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-contact-last-name"
							label={t("libraries.contacts.last_name")}
							required
							fullWidth
							autoComplete="family-name"
							error={!!contactErrors?.[0]?.lastName}
							helperText={contactErrors?.[0]?.lastName?.message}
						/>
					)}
				/>
			</Stack>
			<Controller
				name="contacts.0.email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-contact-email"
						label={t("libraries.contacts.email")}
						type="email"
						required
						fullWidth
						autoComplete="email"
						error={!!contactErrors?.[0]?.email}
						helperText={contactErrors?.[0]?.email?.message}
					/>
				)}
			/>
			<Controller
				name="contacts.0.role"
				control={control}
				render={({ field }) => (
					<Autocomplete
						options={CONTACT_ROLE_OPTIONS.map((option) => option.value)}
						getOptionLabel={(value) => t(contactRoleLabelKey(value))}
						onChange={(_, newValue) => field.onChange(newValue ?? "")}
						onBlur={field.onBlur}
						value={field.value || null}
						isOptionEqualToValue={(option, value) => option === value}
						renderInput={(params) => (
							<TextField
								{...params}
								id="consortium-contact-role"
								required
								label={t("libraries.contacts.role")}
								error={!!contactErrors?.[0]?.role}
								helperText={contactErrors?.[0]?.role?.message}
							/>
						)}
					/>
				)}
			/>
			<Controller
				name="contacts.0.isPrimaryContact"
				control={control}
				render={({ field }) => (
					<FormControlLabel
						control={<Checkbox {...field} checked={field.value === true} />}
						label={t("libraries.contacts.primary")}
					/>
				)}
			/>
		</Stack>
	);
};

export default function NewConsortium({
	show,
	onClose,
	onAddFirstLibrary,
}: NewConsortiumProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [activeStep, setActiveStep] = useState(0);
	const [busyMessage, setBusyMessage] = useState<string | null>(null);
	const [showAbandonConfirmation, setShowAbandonConfirmation] = useState(false);
	/**
	 * Disabling the button on `busyMessage` is not enough on its own: the step's
	 * validation is awaited BEFORE anything is set, so two quick clicks both got
	 * through that gap and created the consortium twice. A ref closes it in the
	 * handler itself, before the first await.
	 */
	const isSubmitting = useRef(false);
	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string;
	}>({ open: false, severity: "success", text: "" });

	const methods = useForm<NewConsortiumFormValues>({
		mode: "onTouched",
		resolver: zodResolver(newConsortiumSchema) as any,
		defaultValues: {
			name: "",
			displayName: "",
			groupName: "",
			groupCode: "",
			dateOfLaunch: new Date().toISOString().slice(0, 10),
			websiteUrl: "",
			catalogueSearchUrl: "",
			description: "",
			reason: "Initial consortium setup",
			changeReferenceUrl: "",
			functionalSettings: defaultFunctionalSettingSelection(),
			contacts: [
				{
					firstName: "",
					lastName: "",
					email: "",
					role: "",
					isPrimaryContact: true,
				},
			],
		},
	});

	// Needed to decide whether the consortium group has to be created or already
	// exists - a retry after a half-failed attempt must not try to create it
	// twice and fail on the duplicate.
	const { data: groupsData } = useQuery({
		queryKey: ["groupsSelection"],
		queryFn: () =>
			gqlClient.request<any, LoadGroupsSelectionQueryVariables>(
				getGroupsSelection,
				{ order: "name", orderBy: "ASC", pageno: 0, pagesize: 1000 },
			),
		staleTime: 1000 * 60 * 5,
	});

	const { mutateAsync: createGroup } = useMutation({
		mutationFn: (variables: CreateLibraryGroupMutationVariables) =>
			gqlClient.request<any, CreateLibraryGroupMutationVariables>(
				createLibraryGroup,
				variables,
			),
	});

	const { mutateAsync: createConsortium } = useMutation({
		mutationFn: (variables: CreateConsortiumMutationVariables) =>
			gqlClient.request<any, CreateConsortiumMutationVariables>(
				createConsortiumMutation,
				variables,
			),
	});

	const handleNext = async () => {
		if (isSubmitting.current) return;
		isSubmitting.current = true;
		try {
			await advance();
		} finally {
			isSubmitting.current = false;
		}
	};

	const advance = async () => {
		const step = STEPS[activeStep];
		const fields = STEP_FIELDS[step.id] ?? [];
		if (fields.length > 0 && !(await methods.trigger(fields as any))) return;

		// Only the contact step commits anything; everything before it just
		// advances.
		if (step.id !== "contact") {
			setActiveStep((current) => current + 1);
			return;
		}

		const values = methods.getValues();
		try {
			const existingGroup = (groupsData?.libraryGroups?.content ?? []).find(
				(group: any) =>
					group?.type?.toLowerCase() === "consortium" &&
					group?.name?.toLowerCase() === values.groupName.toLowerCase(),
			);

			if (!existingGroup) {
				setBusyMessage(t("consortium.new.busy_group"));
				await createGroup({
					input: {
						name: values.groupName,
						code: values.groupCode,
						// The data fetcher matches on this exact type, case-insensitively.
						type: "Consortium",
					},
				});
				queryClient.invalidateQueries({ queryKey: ["groupsSelection"] });
				queryClient.invalidateQueries({ queryKey: ["groups"] });
			}

			setBusyMessage(t("consortium.new.busy_consortium"));
			await createConsortium({
				input: {
					name: values.name,
					displayName: values.displayName,
					groupName: values.groupName,
					dateOfLaunch: values.dateOfLaunch,
					websiteUrl: values.websiteUrl || undefined,
					catalogueSearchUrl: values.catalogueSearchUrl || undefined,
					description: values.description || undefined,
					reason: values.reason,
					changeCategory: "Initial setup",
					changeReferenceUrl: values.changeReferenceUrl || undefined,
					contacts: values.contacts.map((contact) => ({
						firstName: contact.firstName.trim(),
						lastName: contact.lastName.trim(),
						email: contact.email.trim(),
						role: contact.role,
						isPrimaryContact: contact.isPrimaryContact,
					})),
					// CreateConsortiumDataFetcher calls Flux.fromIterable on this
					// without a null check, so omitting it is an NPE rather than a
					// default - and it reads `description` with .toString(), so every
					// entry must carry one.
					functionalSettings: CONSORTIUM_FUNCTIONAL_SETTINGS.map((setting) => ({
						name: setting.name,
						enabled: values.functionalSettings[setting.name] === true,
						// The same wording the user read when they chose it, trimmed to
						// what the column accepts - see storedDescription.
						description: storedDescription(t(setting.descriptionKey)),
					})),
				},
			});

			queryClient.invalidateQueries({ queryKey: CONSORTIUM_BASICS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["LoadConsortium"] });
			setActiveStep(DONE_STEP_INDEX);
		} catch (error: any) {
			console.error("Consortium creation failed:", error);
			setAlert({
				open: true,
				severity: "error",
				text: describeGraphQLError(error, t("consortium.new.error")),
			});
		} finally {
			setBusyMessage(null);
		}
	};

	const handleClose = () => {
		methods.reset();
		setActiveStep(0);
		setShowAbandonConfirmation(false);
		onClose();
	};

	const isBusy = busyMessage !== null;
	const isDone = STEPS[activeStep].id === "done";

	/**
	 * This form is three steps long and none of it is recoverable once the
	 * dialog closes, so closing asks first - the same bargain the library wizard
	 * makes. Nothing typed yet, or already created, means nothing to lose.
	 */
	const requestClose = () => {
		if (isBusy) return;
		if (isDone || !methods.formState.isDirty) {
			handleClose();
			return;
		}
		setShowAbandonConfirmation(true);
	};

	return (
		<>
			<Dialog
				open={show}
				// A backdrop click is too easy to do by accident to be a way out of a
				// three-step form at all; Escape is deliberate enough to be offered,
				// and goes through the same confirmation as the buttons.
				onClose={(_event, reason) => {
					if (reason === "backdropClick") return;
					requestClose();
				}}
				aria-labelledby="new-consortium-title"
				fullWidth
				maxWidth="md"
			>
				<DialogTitle id="new-consortium-title" variant="modalTitle">
					{t("consortium.new.title")}
				</DialogTitle>
				<IconButton
					onClick={requestClose}
					aria-label={t("ui.actions.close")}
					disabled={isBusy}
					sx={{ position: "absolute", right: 8, top: 8 }}
				>
					<Close />
				</IconButton>
				<Divider aria-hidden="true" />
				{/* Reserves its own row whether or not it is running, so the dialog
				    does not jump when a mutation starts. */}
				<Box sx={{ height: 4 }}>{isBusy && <LinearProgress />}</Box>

				<DialogContent>
					<Stepper
						activeStep={activeStep}
						alternativeLabel
						sx={{ mb: 4, mt: 1 }}
					>
						{STEPS.map((step) => (
							<Step key={step.id}>
								<StepLabel>{t(step.labelKey)}</StepLabel>
							</Step>
						))}
					</Stepper>

					{isBusy && (
						<Alert severity="info" sx={{ mb: 2 }} role="status">
							{busyMessage}
						</Alert>
					)}

					<FormProvider {...methods}>
						<Box component="form" noValidate>
							{STEPS[activeStep].id === "details" && <DetailsStep />}
							{STEPS[activeStep].id === "settings" && (
								<FunctionalSettingsStep />
							)}
							{STEPS[activeStep].id === "contact" && <ContactStep />}
							{isDone && (
								<Stack spacing={2} sx={{ mt: 1 }}>
									<Alert severity="success">
										<AlertTitle>{t("consortium.new.success_title")}</AlertTitle>
										{t("consortium.new.success_body", {
											consortium: methods.getValues("displayName"),
										})}
									</Alert>
									<Typography>{t("consortium.new.next_steps")}</Typography>
								</Stack>
							)}

							<Stack
								direction="row"
								spacing={2}
								sx={{ justifyContent: "space-between", mt: 4 }}
							>
								{isDone ? (
									<>
										<Button
											variant="outlined"
											onClick={() => {
												handleClose();
												router.navigate({ to: "/consortium" });
											}}
										>
											{t("consortium.new.go_to_consortium")}
										</Button>
										<Stack direction="row" spacing={2}>
											<Button variant="outlined" onClick={handleClose}>
												{t("ui.actions.close")}
											</Button>
											{onAddFirstLibrary && (
												<Button
													variant="contained"
													color="success"
													onClick={() => {
														handleClose();
														onAddFirstLibrary();
													}}
												>
													{t("consortium.new.add_first_library")}
												</Button>
											)}
										</Stack>
									</>
								) : (
									<>
										<Button
											variant="outlined"
											onClick={requestClose}
											disabled={isBusy}
										>
											{t("ui.actions.cancel")}
										</Button>
										<Stack direction="row" spacing={2}>
											{activeStep > 0 && (
												<Button
													variant="outlined"
													onClick={() => setActiveStep((step) => step - 1)}
													disabled={isBusy}
												>
													{t("ui.actions.back")}
												</Button>
											)}
											<Button
												variant="contained"
												onClick={handleNext}
												disabled={isBusy}
											>
												{STEPS[activeStep].id === "contact"
													? t("consortium.new.create")
													: t("ui.actions.next")}
											</Button>
										</Stack>
									</>
								)}
							</Stack>
						</Box>
					</FormProvider>
				</DialogContent>
			</Dialog>

			<Confirmation
				open={showAbandonConfirmation}
				onClose={() => setShowAbandonConfirmation(false)}
				onConfirm={handleClose}
				action="unsaved"
			/>

			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				autoHideDuration={6000}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</>
	);
}
