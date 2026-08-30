import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	LinearProgress,
	Stack,
	Step,
	StepLabel,
	Stepper,
	Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import TimedAlert from "@components/TimedAlert/TimedAlert";
import Confirmation from "@components/Confirmation/Confirmation";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { defaultFunctionalSettingSelection } from "@constants/functionalSettings";
import ConsortiumDetailsFields from "@forms/ConsortiumSetup/steps/ConsortiumDetailsFields";
import FunctionalSettingsFields from "@forms/ConsortiumSetup/steps/FunctionalSettingsFields";
import ConsortiumContactFields from "@forms/ConsortiumSetup/steps/ConsortiumContactFields";
import { createConsortiumWithGroup } from "@forms/ConsortiumSetup/createConsortiumWithGroup";
import {
	newConsortiumSchema,
	type NewConsortiumFormValues,
} from "@schemas/newConsortiumSchema";
import { CONSORTIUM_BASICS_QUERY_KEY } from "@/queryOptions/consortium";

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

	// The group-then-consortium sequence, and the retry-safe group lookup, are shared
	// with the setup flow so the two cannot drift apart on the next dcb-service change.
	const { mutateAsync: createConsortium } = useMutation({
		mutationFn: (values: NewConsortiumFormValues) =>
			createConsortiumWithGroup(gqlClient, {
				values,
				// The dialog collects both on steps of its own, so both go with the
				// create. The setup flow commits earlier and writes them afterwards.
				includeFunctionalSettings: true,
				includeContacts: true,
				translate: t,
				onProgress: (stage) =>
					setBusyMessage(
						stage === "group"
							? t("consortium.new.busy_group")
							: t("consortium.new.busy_consortium"),
					),
			}),
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

		try {
			const { groupCreated } = await createConsortium(methods.getValues());

			if (groupCreated) {
				queryClient.invalidateQueries({ queryKey: ["groupsSelection"] });
				queryClient.invalidateQueries({ queryKey: ["groups"] });
			}

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
							{STEPS[activeStep].id === "details" && (
								<ConsortiumDetailsFields />
							)}
							{STEPS[activeStep].id === "settings" && (
								<FunctionalSettingsFields />
							)}
							{STEPS[activeStep].id === "contact" && (
								<ConsortiumContactFields />
							)}
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
