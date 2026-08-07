import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	useForm,
	FormProvider,
	useWatch,
	type DefaultValues,
	type Resolver,
} from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Stepper,
	Step,
	StepLabel,
	Box,
	Button,
	Stack,
	IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import TimedAlert from "@components/TimedAlert/TimedAlert";
import { useGraphQLClient } from "@hooks/useGraphQLClient";

import { createHostLmsMutation } from "@mutations/createHostLms";
import { createLibraryMutation } from "@mutations/createLibrary";
import { zodResolver } from "@hookform/resolvers/zod";
import ModeSelectionStep from "./steps/ModeSelectionStep";
import HostLmsStep from "./steps/HostLmsStep";
import HostLmsResultStep, {
	type HostLmsVerificationResult,
} from "./steps/HostLmsResultStep";
import { ProfileStep } from "./steps/ProfileStep";
import ContactsStep from "./steps/ContactsStep";
import GroupStep from "./steps/GroupStep";
import RefValueMappingStep from "./steps/RefValueMappingStep";
import NumericMappingStep from "./steps/NumericRangeMappingStep";
import LocationsStep from "./steps/LocationsStep";
import { addLibraryToGroup } from "@mutations/addLibraryToGroup";
import { newLibrarySchema } from "@/schemas/newLibrarySchema";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import type { LibrarySetupStepId } from "@helpers/librarySetup";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import type { z } from "zod";
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
};

// Maps each wizard step to the newLibrarySchema fields it's responsible for, so
// handleNext only validates the step actually being shown.
//
// `profile` was missing from this map, and because handleNext treats an empty
// field list as "valid", the profile step advanced unconditionally - every
// `required` marker on it was decoration. The mapping steps genuinely have no
// schema fields (they are import UI), so they stay absent.
const STEP_SCHEMA_FIELDS: Record<
	string,
	(keyof z.infer<typeof newLibrarySchema>)[]
> = {
	hostLms: ["hostLmsCode", "hostLmsName", "lmsClientClass", "clientConfig"],
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

type LibraryFormValues = z.infer<typeof newLibrarySchema>;

// The GraphQL LibraryInput type only accepts a fixed set of fields. Spreading
// the whole form object (which also carries Host LMS/group/wizard-only state)
// makes the server reject the mutation with "field not defined in LibraryInput".
// Build an explicit, typed payload instead - contacts are consumed inline by
// CreateLibraryDataFetcher, so no separate createLibraryContact call is needed.
const buildLibraryProfile = (formData: LibraryFormValues) => ({
	agencyCode: formData.agencyCode,
	fullName: formData.fullName,
	shortName: formData.shortName,
	abbreviatedName: formData.abbreviatedName,
	address: formData.address,
	type: formData.type,
	latitude: formData.latitude,
	longitude: formData.longitude,
	supportHours: formData.supportHours,
	patronWebsite: formData.patronWebsite,
	discoverySystem: formData.discoverySystem,
	hostLmsConfiguration: formData.hostLmsConfiguration,
	backupDowntimeSchedule: formData.backupDowntimeSchedule,
	reason: formData.reason,
	// Was rendered but never sent, so the audit trail lost its reference URL.
	changeReferenceUrl: formData.changeReferenceUrl,
	authProfile: formData.authProfile,
});

const buildLibraryInput = (formData: LibraryFormValues) => ({
	...buildLibraryProfile(formData),
	hostLmsCode: formData.hostLmsCode,
	contacts: formData.contacts.map((contact) => ({
		firstName: contact.firstName.trim(),
		lastName: contact.lastName.trim(),
		email: contact.email.trim(),
		role: contact.role,
		isPrimaryContact: contact.isPrimaryContact,
	})),
});

/**
 * RHF's DefaultValues is a deep-partial, which is what lets the coordinates
 * start out unset even though the schema requires them - the profile step then
 * reports them as missing, which is the whole point.
 */
type LibraryFormDefaults = DefaultValues<LibraryFormValues>;

const EMPTY_LIBRARY_FORM: LibraryFormDefaults = {
	// Host LMS Fields
	hostLmsCode: "",
	hostLmsName: "",
	lmsClientClass: "",
	clientConfig: "",
	suppressionRulesetName: "",
	itemSuppressionRulesetName: "",
	// Library Fields
	agencyCode: "",
	fullName: "",
	shortName: "",
	abbreviatedName: "",
	address: "",
	type: "",
	latitude: undefined,
	longitude: undefined,
	supportHours: "",
	patronWebsite: "",
	hostLmsConfiguration: "",
	discoverySystem: "",
	backupDowntimeSchedule: "",
	authProfile: "",
	reason: "Adding a new library",
	changeReferenceUrl: "",
	contacts: [
		{
			firstName: "",
			lastName: "",
			email: "",
			role: "",
			isPrimaryContact: false,
		},
	],
	groupId: "",
};

/**
 * Prefills the wizard from a library that already exists. Absent values become
 * "" / undefined rather than null so react-hook-form treats the inputs as
 * controlled and the newly-required fields show as empty and invalid, which is
 * the point: those are the ones the user has come back to fill in.
 */
const formValuesFromLibrary = (library: any): LibraryFormDefaults => ({
	...EMPTY_LIBRARY_FORM,
	hostLmsCode: library?.agency?.hostLms?.code ?? "",
	hostLmsName: library?.agency?.hostLms?.name ?? "",
	lmsClientClass: library?.agency?.hostLms?.lmsClientClass ?? "",
	clientConfig: "",
	suppressionRulesetName: "",
	itemSuppressionRulesetName: "",
	agencyCode: library?.agencyCode ?? "",
	fullName: library?.fullName ?? "",
	shortName: library?.shortName ?? "",
	abbreviatedName: library?.abbreviatedName ?? "",
	address: library?.address ?? "",
	type: library?.type ?? "",
	latitude: library?.latitude ?? undefined,
	longitude: library?.longitude ?? undefined,
	supportHours: library?.supportHours ?? "",
	patronWebsite: library?.patronWebsite ?? "",
	hostLmsConfiguration: library?.hostLmsConfiguration ?? "",
	discoverySystem: library?.discoverySystem ?? "",
	backupDowntimeSchedule: library?.backupDowntimeSchedule ?? "",
	authProfile: library?.agency?.authProfile ?? "",
	reason: "",
	changeReferenceUrl: "",
	libraryId: library?.id ?? "",
	// Contacts already exist on any created library (LibraryInput requires at
	// least one), so the step is satisfied and only shown for reference.
	contacts: (library?.contacts ?? []).map((contact: any) => ({
		firstName: contact.firstName ?? "",
		lastName: contact.lastName ?? "",
		email: contact.email ?? "",
		role: contact.role?.name ?? contact.role ?? "",
		isPrimaryContact: contact.isPrimaryContact ?? false,
	})),
	groupId: "",
});

export default function NewLibrary({
	show,
	onClose,
	consortiumName,
	resumeLibrary,
	startAtStep,
}: NewLibraryType) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const isResuming = !!resumeLibrary;

	const [activeStepIndex, setActiveStepIndex] = useState(0);
	const [wizardMode, setWizardMode] = useState<
		"unselected" | "existing" | "new"
	>(
		// Resuming means the library and its Host LMS already exist, so there is
		// nothing to choose and no Host LMS to create.
		isResuming ? "existing" : "unselected",
	);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
	});
	const [hostLmsResult, setHostLmsResult] =
		useState<HostLmsVerificationResult | null>(null);

	// Pin the field type rather than letting it be inferred from defaultValues:
	// the coordinates start unset, and inference would widen every field to
	// optional and stop the resolver's own type from lining up.
	const methods = useForm<LibraryFormValues>({
		mode: "onTouched",
		resolver: zodResolver(newLibrarySchema) as Resolver<LibraryFormValues>,
		defaultValues: resumeLibrary
			? formValuesFromLibrary(resumeLibrary)
			: {
					// Host LMS Fields
					hostLmsCode: "",
					hostLmsName: "",
					lmsClientClass: "",
					clientConfig: "",
					suppressionRulesetName: "",
					itemSuppressionRulesetName: "",
					// Library Fields
					agencyCode: "",
					fullName: "",
					shortName: "",
					abbreviatedName: "",
					address: "",
					type: "",
					latitude: undefined,
					longitude: undefined,
					supportHours: "",
					patronWebsite: "",
					hostLmsConfiguration: "",
					discoverySystem: "",
					backupDowntimeSchedule: "",
					authProfile: "",
					reason: "Adding a new library",
					changeReferenceUrl: "",
					contacts: [
						{
							firstName: "",
							lastName: "",
							email: "",
							role: "",
							isPrimaryContact: false,
						},
					],
					groupId: "",
				},
	});

	const [watchedHostLmsCode, watchedAgencyCode, lmsClientClass] = useWatch({
		control: methods.control,
		name: ["hostLmsCode", "agencyCode", "lmsClientClass"],
	});
	const requiresNumericMappings =
		lmsClientClass?.toLowerCase().includes("sierra") ||
		lmsClientClass?.toLowerCase().includes("polaris");

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

		if (wizardMode === "new")
			return [
				{ id: "hostLms", label: t("hostlms.new") },
				{ id: "hostLmsResult", label: t("hostlms.verification.step") },
				...base,
			];
		return base;
	}, [wizardMode, requiresNumericMappings, t]);

	const currentStep = steps[activeStepIndex];

	// Resuming drops the user at the first thing that is actually outstanding,
	// rather than making them click Next through the parts already done. Applied
	// once, when the dialog opens: after that the user owns the position.
	const [hasJumpedToStartStep, setHasJumpedToStartStep] = useState(false);
	if (show && startAtStep && !hasJumpedToStartStep && steps.length > 0) {
		const index = steps.findIndex((step) => step.id === startAtStep);
		setHasJumpedToStartStep(true);
		if (index > 0) setActiveStepIndex(index);
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

	const handleNext = async () => {
		try {
			// Scoped to the CURRENT step's own fields
			const fieldsToValidate = STEP_SCHEMA_FIELDS[currentStep?.id ?? ""] ?? [];
			const isStepValid =
				fieldsToValidate.length === 0 ||
				(await methods.trigger(fieldsToValidate));

			if (!isStepValid) return;

			const formData = methods.getValues();

			// Phase 1: If creating a Host LMS
			if (currentStep?.id === "hostLms") {
				const parsedConfig = formData.clientConfig
					? JSON.parse(formData.clientConfig)
					: {};

				const result = await createHostLms({
					input: {
						code: formData.hostLmsCode,
						name: formData.hostLmsName,
						lmsClientClass: formData.lmsClientClass,
						clientConfig: parsedConfig,
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
			if (isResuming && currentStep?.id === "profile") {
				await updateLibrary({
					input: {
						id: formData.libraryId || resumeLibrary?.id,
						...buildLibraryProfile(formData),
					},
				});
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
			if (!isResuming && currentStep?.id === "contacts") {
				const result = await createLibrary({
					input: buildLibraryInput(formData),
				});
				methods.setValue("libraryId", result.createLibrary.id);
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.new.success", {
						consortium: consortiumName || "",
					}),
				});
			}

			// Phase 3: Group Step
			if (currentStep?.id === "group" && formData.groupId) {
				await gqlClient.request(addLibraryToGroup, {
					input: {
						libraryGroup: formData.groupId,
						library: formData.libraryId,
					},
				});
				queryClient.invalidateQueries({ queryKey: ["groups"] });
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.alert_text_success"),
				});
			}

			setActiveStepIndex((prev) => prev + 1);
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
		}
	};

	const handleClose = () => {
		methods.reset();
		setWizardMode("unselected");
		setActiveStepIndex(0);
		setHostLmsResult(null);
		onClose();
	};

	const renderStepContent = () => {
		if (wizardMode === "unselected")
			return (
				<ModeSelectionStep setMode={setWizardMode} onCancel={handleClose} />
			);

		switch (currentStep?.id) {
			case "hostLms":
				return <HostLmsStep />;
			case "hostLmsResult":
				return <HostLmsResultStep result={hostLmsResult} />;
			case "profile":
				return <ProfileStep />;
			case "contacts":
				return <ContactsStep />;
			case "group":
				return <GroupStep />;
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
			default:
				return null;
		}
	};

	return (
		<>
			<Dialog open={show} onClose={handleClose} fullWidth maxWidth="md">
				<DialogTitle variant="modalTitle">
					{t("libraries.new.title")}
				</DialogTitle>
				<IconButton
					onClick={handleClose}
					sx={{ position: "absolute", right: 8, top: 8 }}
				>
					<Close />
				</IconButton>
				<Divider aria-hidden="true" />

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

					<FormProvider {...methods}>
						<Box component="form" noValidate>
							{renderStepContent()}

							{wizardMode !== "unselected" && (
								<Stack
									direction="row"
									sx={{
										justifyContent: "space-between",
										mt: 4,
									}}
								>
									<Button variant="outlined" onClick={handleClose}>
										{t("ui.actions.cancel")}
									</Button>

									{activeStepIndex < steps.length - 1 ? (
										<Button
											variant="contained"
											onClick={handleNext}
											disabled={
												isHostLmsPending ||
												isLibraryPending ||
												isLibraryUpdatePending
											}
										>
											{isHostLmsPending ||
											isLibraryPending ||
											isLibraryUpdatePending
												? t("ui.info.wait")
												: t("ui.actions.next")}
										</Button>
									) : (
										<Button
											variant="contained"
											onClick={handleClose}
											color="success"
										>
											{t("ui.actions.submit")}
										</Button>
									)}
								</Stack>
							)}
						</Box>
					</FormProvider>
				</DialogContent>
			</Dialog>
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
