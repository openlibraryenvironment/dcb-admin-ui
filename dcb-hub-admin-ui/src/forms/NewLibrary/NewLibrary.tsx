import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	useForm,
	FormProvider,
	useWatch,
	type Resolver,
} from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "@mui/material";
import { Close } from "@mui/icons-material";

import TimedAlert from "@components/TimedAlert/TimedAlert";
import Confirmation from "@components/Confirmation/Confirmation";
import { useGraphQLClient } from "@hooks/useGraphQLClient";

import { createHostLmsMutation } from "@mutations/createHostLms";
import { createLibraryMutation } from "@mutations/createLibrary";
import { zodResolver } from "@hookform/resolvers/zod";
import ModeSelectionStep from "./steps/ModeSelectionStep";
import HostLmsStep from "./steps/HostLmsStep";
import HostLmsSelectStep from "./steps/HostLmsSelectStep";
import HostLmsResultStep from "./steps/HostLmsResultStep";
import { ProfileStep } from "./steps/ProfileStep";
import ContactsStep from "./steps/ContactsStep";
import GroupStep from "./steps/GroupStep";
import RefValueMappingStep from "./steps/RefValueMappingStep";
import NumericMappingStep from "./steps/NumericRangeMappingStep";
import LocationsStep from "./steps/LocationsStep";
import CompletionStep from "./steps/CompletionStep";
import { addLibraryToGroup } from "@mutations/addLibraryToGroup";
import {
	newLibrarySchema,
	resolveClientConfig,
	type NewLibraryFormValues,
} from "@schemas/newLibrarySchema";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import type { LibrarySetupStepId } from "@helpers/librarySetup";
import {
	isIngestTimeout,
	type HostLmsVerificationResult,
} from "@helpers/hostLmsVerification";
import {
	consortiumBasicsQuery,
	readConsortiumPresence,
} from "@/queryOptions/consortium";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import { updateAgencyQuery } from "@mutations/updateAgency";
import { createLibraryContact } from "@mutations/createLibraryContact";
import {
	buildAgencyUpdateInput,
	buildContactInput,
	buildLibraryInput,
	buildLibraryUpdateInput,
	EMPTY_LIBRARY_FORM,
	formValuesFromLibrary,
	newContactsOf,
	shouldCreateHostLms,
	shouldCreateLibrary,
	shouldJoinGroup,
} from "./libraryPayloads";
import type {
	CreateHostLmsMutationVariables,
	CreateLibraryMutationVariables,
} from "@generated/graphql";

type NewLibraryType = {
	show: boolean;
	onClose: () => void;
	consortiumName?: string;
	/**
	 * An existing, part-configured library to resume. When set the wizard skips
	 * mode selection and Host LMS creation, prefills from the record, and starts
	 * at `startAtStep` - see "finish setup" on the library page.
	 */
	resumeLibrary?: any;
	startAtStep?: LibrarySetupStepId;
	/** Shown when there is no consortium yet, so the user can go and make one. */
	onCreateConsortium?: () => void;
};

// Maps each wizard step to the newLibrarySchema fields it's responsible for, so
// handleNext only validates the step actually being shown.
//
// `profile` was missing from this map, and because handleNext treats an empty
// field list as "valid", the profile step advanced unconditionally - every
// `required` marker on it was decoration. The mapping steps genuinely have no
// schema fields (they are import UI), so they stay absent.
const STEP_SCHEMA_FIELDS: Record<string, (keyof NewLibraryFormValues)[]> = {
	hostLms: [
		"hostLmsCode",
		"hostLmsName",
		"lmsClientClass",
		"clientConfig",
		"clientConfigFields",
	],
	hostLmsSelect: ["hostLmsCode"],
	profile: [
		"fullName",
		"shortName",
		"abbreviatedName",
		"agencyCode",
		"address",
		"type",
		"latitude",
		"longitude",
		"authProfile",
		"reason",
	],
	contacts: ["contacts"],
	group: ["groupId"],
};

export default function NewLibrary({
	show,
	onClose,
	consortiumName,
	resumeLibrary,
	startAtStep,
	onCreateConsortium,
}: NewLibraryType) {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	/**
	 * Resuming is a mode the dialog can leave, not a fact about the props.
	 *
	 * "Add another library" resets the form, but the resumed library is still
	 * sitting in the props - so without this the next library would be built in
	 * resume mode, which skips the Host LMS step entirely and would send an
	 * empty `hostLmsCode`.
	 */
	const [isResuming, setIsResuming] = useState(!!resumeLibrary);

	const [wizardMode, setWizardMode] = useState<
		"unselected" | "existing" | "new"
	>(
		// Resuming means the library and its Host LMS already exist, so there is
		// nothing to choose and no Host LMS to create.
		isResuming ? "existing" : "unselected",
	);
	/**
	 * The step is tracked by id, not index.
	 *
	 * The list is dynamic - picking Sierra or Polaris inserts a numeric range
	 * mappings step - so an index quietly pointed at a different screen the
	 * moment the ILS changed. An id cannot drift.
	 */
	const [activeStepId, setActiveStepId] = useState<string | null>(null);
	const [alert, setAlert] = useState<{
		open: boolean;
		// "warning" is for the things that went wrong AFTER the library was
		// created - the wizard carries on, but the user has to know.
		severity: "success" | "error" | "warning";
		text: string;
	}>({ open: false, severity: "success", text: "" });
	const [hostLmsResult, setHostLmsResult] =
		useState<HostLmsVerificationResult | null>(null);
	/** What is happening right now, in words, while a mutation is in flight. */
	const [busyMessage, setBusyMessage] = useState<string | null>(null);
	const [showAbandonConfirmation, setShowAbandonConfirmation] = useState(false);
	/** Group memberships this run has already written - see the group step. */
	const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);

	const methods = useForm<NewLibraryFormValues>({
		mode: "onTouched",
		resolver: zodResolver(newLibrarySchema) as Resolver<NewLibraryFormValues>,
		defaultValues: resumeLibrary
			? formValuesFromLibrary(resumeLibrary)
			: EMPTY_LIBRARY_FORM,
	});

	const [watchedHostLmsCode, watchedAgencyCode, lmsClientClass] = useWatch({
		control: methods.control,
		name: ["hostLmsCode", "agencyCode", "lmsClientClass"],
	});
	const requiresNumericMappings =
		lmsClientClass?.toLowerCase().includes("sierra") ||
		lmsClientClass?.toLowerCase().includes("polaris");

	// A library belongs to a consortium; without one the wizard has nothing to
	// add it to, and dcb-service will not accept a consortium later either.
	const consortiumQuery = useQuery(consortiumBasicsQuery(gqlClient));
	const { hasConsortium, consortiumGroup } =
		readConsortiumPresence(consortiumQuery);

	// Dynamically calculate the wizard steps
	const steps = useMemo(() => {
		if (wizardMode === "unselected") return [];

		const base = [
			{ id: "profile", label: t("libraries.steps.profile") },
			{ id: "contacts", label: t("libraries.steps.contacts") },
			{ id: "group", label: t("libraries.steps.group") },
			{ id: "refMappings", label: t("nav.mappings.allReferenceValue") },
		];

		if (requiresNumericMappings) {
			base.push({
				id: "numMappings",
				label: t("libraries.config.data.mappings.all_num_range", {
					hostLms: "",
				}).trim(),
			});
		}

		base.push({ id: "locations", label: t("nav.locations") });
		base.push({ id: "done", label: t("libraries.new.step_done") });

		if (wizardMode === "new")
			return [
				{ id: "hostLms", label: t("hostlms.new") },
				{ id: "hostLmsResult", label: t("hostlms.verification.step") },
				...base,
			];

		// Resuming already has a Host LMS; adding a library to one that exists
		// does not, and had no step to pick it - so `hostLmsCode`, which
		// LibraryInput declares non-null, was sent as the empty string.
		return isResuming
			? base
			: [{ id: "hostLmsSelect", label: t("hostlms.hostlms_one") }, ...base];
	}, [wizardMode, requiresNumericMappings, isResuming, t]);

	const activeStepIndex = Math.max(
		0,
		steps.findIndex((step) => step.id === activeStepId),
	);
	const currentStep = steps[activeStepIndex];

	// Resuming drops the user at the first thing that is actually outstanding,
	// rather than making them click Next through the parts already done. Applied
	// once, when the dialog opens: after that the user owns the position.
	const [hasJumpedToStartStep, setHasJumpedToStartStep] = useState(false);
	if (show && startAtStep && !hasJumpedToStartStep && steps.length > 0) {
		setHasJumpedToStartStep(true);
		if (steps.some((step) => step.id === startAtStep))
			setActiveStepId(startAtStep);
	}

	// Mutations
	const { mutateAsync: createHostLms, isPending: isHostLmsPending } =
		useMutation({
			mutationFn: (variables: { input: any }) =>
				gqlClient.request<any, CreateHostLmsMutationVariables>(
					createHostLmsMutation,
					variables,
				),
			onSuccess: () =>
				queryClient.invalidateQueries({ queryKey: ["hostlmss"] }),
		});

	// One invalidation for both paths: whether the library was just created or
	// just completed, every list, detail page and setup-completeness count that
	// mentions it is now stale. The "library"/"libraries" prefixes are the same
	// ones the entity registry sweeps.
	const invalidateLibraryCaches = () => {
		queryClient.invalidateQueries({
			predicate: (query) => {
				const root = query.queryKey[0];
				return (
					typeof root === "string" &&
					["library", "libraries", "librariesList", "agencies", "agency"].some(
						(prefix) => root.startsWith(prefix),
					)
				);
			},
		});
	};

	const { mutateAsync: createLibrary, isPending: isLibraryPending } =
		useMutation({
			mutationFn: (variables: { input: any }) =>
				gqlClient.request<any, CreateLibraryMutationVariables>(
					createLibraryMutation,
					variables,
				),
			onSuccess: invalidateLibraryCaches,
		});

	// Resuming edits a library that already exists, so the profile step saves
	// with updateLibrary. Calling createLibrary again would either fail on the
	// duplicate agency code or create a second record.
	const { mutateAsync: updateLibrary, isPending: isLibraryUpdatePending } =
		useMutation({
			mutationFn: (variables: { input: any }) =>
				gqlClient.request<any>(updateLibraryMutation, variables),
			onSuccess: invalidateLibraryCaches,
		});

	// Participation, the loan cap and the coordinates live on the agency, which
	// updateLibrary does not own. Resuming has to save both halves of what one
	// profile step shows.
	const { mutateAsync: updateAgency, isPending: isAgencyUpdatePending } =
		useMutation({
			mutationFn: (variables: { input: any }) =>
				gqlClient.request<any>(updateAgencyQuery, variables),
			onSuccess: invalidateLibraryCaches,
		});

	// Resuming cannot send contacts through updateLibrary - UpdateLibraryInput
	// has no contacts field - so each new one is created against the existing
	// library instead.
	const { mutateAsync: createContact, isPending: isContactPending } =
		useMutation({
			mutationFn: (variables: { input: any }) =>
				gqlClient.request<any>(createLibraryContact, variables),
			onSuccess: invalidateLibraryCaches,
		});

	const isBusy =
		isHostLmsPending ||
		isLibraryPending ||
		isLibraryUpdatePending ||
		isAgencyUpdatePending ||
		isContactPending ||
		!!busyMessage;

	const goToStep = (index: number) => {
		const target = steps[index];
		if (target) setActiveStepId(target.id);
	};

	/**
	 * Puts the caret on the first thing that is wrong. Without it, failing
	 * validation on a sixteen-field step means scrolling to hunt for the red
	 * box, and a keyboard or screen-reader user gets no signal at all.
	 *
	 * Walks down to a leaf, because a field name like `contacts` or
	 * `clientConfigFields` names a subtree with no input of its own to focus.
	 */
	const focusFirstError = (fields: string[]) => {
		const leafOf = (node: any, trail: string[]): string | undefined => {
			if (!node || typeof node !== "object") return undefined;
			if ("message" in node || "ref" in node) return trail.join(".");
			for (const key of Object.keys(node)) {
				const found = leafOf(node[key], [...trail, key]);
				if (found) return found;
			}
			return undefined;
		};

		for (const name of fields) {
			const target = leafOf((methods.formState.errors as any)[name], [name]);
			if (target) {
				methods.setFocus(target as any);
				return;
			}
		}
	};

	const handleNext = async () => {
		const stepId = currentStep?.id ?? "";
		try {
			// Scoped to the CURRENT step's own fields
			const fieldsToValidate = STEP_SCHEMA_FIELDS[stepId] ?? [];
			const isStepValid =
				fieldsToValidate.length === 0 ||
				(await methods.trigger(fieldsToValidate));

			if (!isStepValid) {
				focusFirstError(fieldsToValidate as string[]);
				return;
			}

			const formData = methods.getValues();

			// Phase 1: If creating a Host LMS.
			//
			// Guarded on the result, not on the step - see shouldCreateHostLms.
			if (
				stepId === "hostLms" &&
				shouldCreateHostLms(formData.hostLmsCode, hostLmsResult)
			) {
				// Ping and ingest checks run server-side and are capped at 20
				// seconds, so this step can sit there for a while. Say what it is
				// doing rather than greying out a button.
				setBusyMessage(
					t("hostlms.busy_creating", { code: formData.hostLmsCode }),
				);
				const result = await createHostLms({
					input: {
						code: formData.hostLmsCode,
						name: formData.hostLmsName,
						lmsClientClass: formData.lmsClientClass,
						clientConfig: resolveClientConfig(formData),
						suppressionRulesetName: formData.suppressionRulesetName,
						itemSuppressionRulesetName: formData.itemSuppressionRulesetName,
					},
				});
				const hostLmsData = result?.createHostLms;

				// Just in case we get something weird from dcb-service.
				if (!hostLmsData || !hostLmsData.hostLms) {
					throw new Error(t("hostlms.error.no_data_returned"));
				}
				methods.setValue("hostLmsCode", hostLmsData.hostLms.code);
				setHostLmsResult(hostLmsData); // Surface ping/ingest/warnings on a dedicated verification step
			}

			// Phase 2a: resuming saves the profile straight away, because the
			// library already exists and the whole reason the user is here is that
			// something on it is missing. Waiting until the contacts step (as the
			// create flow does) would risk losing the correction.
			if (isResuming && stepId === "profile") {
				setBusyMessage(t("libraries.new.busy_saving_profile"));
				await updateLibrary({
					input: buildLibraryUpdateInput(
						formData,
						formData.libraryId || resumeLibrary?.id,
					),
				});
				// The agency half. Only attempted when there is an agency to address:
				// a library with no agency code has no agency record to update, and
				// updateLibrary cannot create one.
				if (formData.agencyCode) {
					await updateAgency({ input: buildAgencyUpdateInput(formData) });
				}
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.new.setup_profile_saved", {
						library: formData.fullName,
					}),
				});
			}

			// Phase 2b: creating the library, contacts included - the create
			// fetcher consumes them inline. Skipped when resuming: the library and
			// its contacts are already there.
			// Phase 2c: resuming has a library already, so its contacts step creates
			// the ones the user has just typed against it. Without this the step
			// rendered, accepted input, validated it and wrote nothing - and a
			// missing contact is one of the things that sends a library here.
			if (isResuming && stepId === "contacts") {
				const newContacts = newContactsOf(formData.contacts);
				const libraryId = formData.libraryId || resumeLibrary?.id;
				if (newContacts.length > 0 && libraryId) {
					setBusyMessage(t("libraries.new.busy_saving_contacts"));
					// Sequential rather than Promise.all: each one writes a data change
					// log entry, and a partial failure has to leave the successful ones
					// identifiable rather than an unordered pile.
					const saved: NewLibraryFormValues["contacts"] = [];
					for (const contact of formData.contacts) {
						if (contact.id) {
							saved.push(contact);
							continue;
						}
						const result = await createContact({
							input: buildContactInput(contact, formData, libraryId),
						});
						// Carrying the new id back is what stops Back-then-Next creating
						// a second copy of every contact on the step.
						saved.push({
							...contact,
							id: result?.createLibraryContact?.id ?? undefined,
						});
					}
					methods.setValue("contacts", saved);
					setAlert({
						open: true,
						severity: "success",
						text: t("libraries.new.setup_contacts_saved", {
							count: newContacts.length,
						}),
					});
				}
			}

			// Guarded on libraryId - see shouldCreateLibrary.
			if (
				!isResuming &&
				stepId === "contacts" &&
				shouldCreateLibrary(formData.libraryId)
			) {
				setBusyMessage(
					t("libraries.new.busy_creating", { library: formData.fullName }),
				);
				const result = await createLibrary({
					input: buildLibraryInput(formData),
				});
				const newLibraryId = result.createLibrary.id;
				methods.setValue("libraryId", newLibraryId);
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.new.success", {
						consortium: consortiumName || "",
					}),
				});

				// Membership of the consortium's own group is not a choice - every
				// member library is in it, and leaving it to the group step meant
				// a library could finish setup belonging to nothing. Done in its
				// own try: the library exists by this point, so failing here must
				// not strand the user on a step that would re-run createLibrary
				// and collide on the agency code.
				if (consortiumGroup?.id) {
					try {
						// Named by the consortium rather than by the group: only the
						// group's id is safe to read from the consortium query, and
						// asking for its name is what broke consortium detection
						// across the whole app.
						setBusyMessage(
							t("libraries.new.busy_adding_to_consortium", {
								consortium: consortiumName || "",
							}),
						);
						await gqlClient.request(addLibraryToGroup, {
							input: {
								libraryGroup: consortiumGroup.id,
								library: newLibraryId,
							},
						});
						queryClient.invalidateQueries({ queryKey: ["groups"] });
					} catch (groupError) {
						console.error(
							"Failed to add the new library to the consortium group:",
							groupError,
						);
						setAlert({
							open: true,
							severity: "warning",
							text: t("libraries.new.consortium_group_failed"),
						});
					}
				}
			}

			// Phase 3: Group Step. Remembering which groups have been joined keeps
			// Back-then-Next from adding the same membership twice.
			if (
				stepId === "group" &&
				shouldJoinGroup(formData.groupId, joinedGroupIds)
			) {
				setBusyMessage(t("libraries.new.busy_adding_to_group"));
				await gqlClient.request(addLibraryToGroup, {
					input: {
						libraryGroup: formData.groupId,
						library: formData.libraryId,
					},
				});
				setJoinedGroupIds((joined) => [...joined, formData.groupId as string]);
				queryClient.invalidateQueries({ queryKey: ["groups"] });
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.alert_text_success"),
				});
			}

			goToStep(activeStepIndex + 1);
		} catch (error: any) {
			console.error("Validation or mutation failed:", error);
			// `error.message` on a graphql-request ClientError is the whole
			// exchange serialised - the errors array, the status, the headers and
			// the request document. Showing it put a JSON dump in front of the
			// user and hid the one line dcb-service wrote for them ("Invalid role:
			// 'x'. The roles currently available are: ...").
			setAlert({
				open: true,
				severity: "error",
				text: describeGraphQLError(error, t("ui.error.general")),
			});
		} finally {
			setBusyMessage(null);
		}
	};

	const resetWizard = () => {
		methods.reset(EMPTY_LIBRARY_FORM);
		setWizardMode("unselected");
		setActiveStepId(null);
		setHostLmsResult(null);
		// "Add another library" starts a different library; the memberships and
		// the created Host LMS belong to the previous one.
		setJoinedGroupIds([]);
	};

	const closeWizard = () => {
		resetWizard();
		setShowAbandonConfirmation(false);
		onClose();
	};

	/**
	 * Anything typed after the last successful mutation is lost on close, and
	 * the whole point of this wizard is that it is long. Ask - unless there is
	 * genuinely nothing to lose.
	 */
	const requestClose = () => {
		if (isBusy) return;
		const nothingToLose =
			currentStep?.id === "done" ||
			(wizardMode === "unselected" && !methods.formState.isDirty);
		if (nothingToLose) {
			closeWizard();
			return;
		}
		setShowAbandonConfirmation(true);
	};

	/** "Add another" is the common case at initial setup - keep them in here. */
	const startAnotherLibrary = () => {
		resetWizard();
		// The next library is a new one, whatever brought the dialog up.
		setIsResuming(false);
		setShowAbandonConfirmation(false);
	};

	const renderStepContent = () => {
		if (wizardMode === "unselected")
			return (
				<ModeSelectionStep
					setMode={(mode) => {
						setWizardMode(mode);
						// The schema needs to know which branch this is before the
						// Host LMS step validates anything.
						methods.setValue("isCreatingHostLms", mode === "new");
						setActiveStepId(null);
					}}
					onCancel={requestClose}
					hasConsortium={hasConsortium}
					onCreateConsortium={onCreateConsortium}
				/>
			);

		switch (currentStep?.id) {
			case "hostLms":
				return <HostLmsStep busy={isBusy} />;
			case "hostLmsSelect":
				return <HostLmsSelectStep />;
			case "hostLmsResult":
				return (
					<HostLmsResultStep
						result={hostLmsResult}
						isVerifying={isHostLmsPending}
					/>
				);
			case "profile":
				return <ProfileStep />;
			case "contacts":
				return <ContactsStep />;
			case "group":
				return <GroupStep consortiumGroup={consortiumGroup} />;
			case "refMappings":
				return <RefValueMappingStep hostLmsCode={watchedHostLmsCode} />;
			case "numMappings":
				return <NumericMappingStep hostLmsCode={watchedHostLmsCode} />;
			case "locations":
				return (
					<LocationsStep
						hostLmsCode={watchedHostLmsCode}
						agencyCode={watchedAgencyCode ?? ""}
					/>
				);
			case "done":
				return (
					<CompletionStep
						libraryId={methods.getValues("libraryId")}
						libraryName={methods.getValues("fullName")}
						consortiumName={consortiumName}
						ingestTimedOut={isIngestTimeout(hostLmsResult?.ingestStatus)}
					/>
				);
			default:
				return null;
		}
	};

	const isFinalStep = currentStep?.id === "done";

	return (
		<>
			<Dialog
				open={show}
				// Backdrop and Escape are one careless movement away from discarding
				// a half-finished library, so closing goes through the same
				// confirmation as the buttons.
				onClose={(_event, reason) => {
					if (reason === "backdropClick") return;
					requestClose();
				}}
				aria-labelledby="new-library-title"
				fullWidth
				maxWidth="md"
			>
				<DialogTitle id="new-library-title" variant="modalTitle">
					{isResuming ? t("libraries.setup.finish") : t("libraries.new.title")}
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
				{/* Always occupies its row so the content below does not jump by 4px
				    every time a mutation starts and stops. */}
				<Box sx={{ height: 4 }}>{isBusy && <LinearProgress />}</Box>

				<DialogContent>
					{wizardMode !== "unselected" && (
						<Stepper
							activeStep={activeStepIndex}
							alternativeLabel
							sx={{ mb: 4, mt: 2 }}
						>
							{steps.map((step) => (
								<Step key={step.id}>
									<StepLabel>{step.label}</StepLabel>
								</Step>
							))}
						</Stepper>
					)}

					{busyMessage && (
						<Alert severity="info" role="status" sx={{ mb: 2 }}>
							<AlertTitle>{t("ui.info.wait")}</AlertTitle>
							{busyMessage}
						</Alert>
					)}

					<FormProvider {...methods}>
						<Box component="form" noValidate aria-busy={isBusy}>
							{renderStepContent()}

							{wizardMode !== "unselected" && (
								<Stack
									direction="row"
									spacing={2}
									sx={{ justifyContent: "space-between", mt: 4 }}
								>
									<Button
										variant="outlined"
										onClick={requestClose}
										disabled={isBusy}
									>
										{isFinalStep
											? t("ui.actions.close")
											: t("ui.actions.cancel")}
									</Button>

									<Stack direction="row" spacing={2}>
										{/*
										 * There was no way back. Mis-typing a Host LMS code on
										 * step one meant cancelling and starting the entire
										 * wizard again. Steps that have already written to the
										 * server are not re-run on the way forward.
										 */}
										{!isFinalStep && activeStepIndex > 0 && (
											<Button
												variant="outlined"
												onClick={() => goToStep(activeStepIndex - 1)}
												disabled={isBusy}
											>
												{t("ui.actions.back")}
											</Button>
										)}

										{isFinalStep ? (
											<>
												<Button
													variant="outlined"
													onClick={startAnotherLibrary}
												>
													{t("libraries.new.add_another")}
												</Button>
												<Button
													variant="contained"
													color="success"
													onClick={() => {
														const libraryId = methods.getValues("libraryId");
														closeWizard();
														if (libraryId)
															router.navigate({
																to: "/libraries/$libraryId",
																params: { libraryId },
															});
													}}
												>
													{t("libraries.new.go_to_library")}
												</Button>
											</>
										) : (
											<Button
												variant="contained"
												onClick={handleNext}
												disabled={isBusy}
											>
												{isBusy ? t("ui.info.wait") : t("ui.actions.next")}
											</Button>
										)}
									</Stack>
								</Stack>
							)}
						</Box>
					</FormProvider>
				</DialogContent>
			</Dialog>

			<Confirmation
				open={showAbandonConfirmation}
				onClose={() => setShowAbandonConfirmation(false)}
				onConfirm={closeWizard}
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
