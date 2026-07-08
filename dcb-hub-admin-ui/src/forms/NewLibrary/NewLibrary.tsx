import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider, useWatch } from "react-hook-form";
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
import { ProfileStep } from "./steps/ProfileStep";
import ContactsStep from "./steps/ContactsStep";
import GroupStep from "./steps/GroupStep";
import RefValueMappingStep from "./steps/RefValueMappingStep";
import NumericMappingStep from "./steps/NumericRangeMappingStep";
import LocationsStep from "./steps/LocationsStep";
import { addLibraryToGroup } from "@mutations/addLibraryToGroup";
import { newLibrarySchema } from "@/schemas/newLibrarySchema";
import type { z } from "zod";

type NewLibraryType = {
	show: boolean;
	onClose: () => void;
	consortiumName?: string;
};

// Maps each wizard step to the newLibrarySchema fields it's responsible
// for, so handleNext only validates the step actually being shown. Steps
// not listed here (profile, refMappings, numMappings, locations) aren't
// covered by newLibrarySchema yet - trigger() is skipped for them rather
// than invented field names.
const STEP_SCHEMA_FIELDS: Record<
	string,
	(keyof z.infer<typeof newLibrarySchema>)[]
> = {
	hostLms: ["hostLmsCode", "hostLmsName", "lmsClientClass", "clientConfig"],
	contacts: ["contacts"],
	group: ["groupId"],
};

export default function NewLibrary({
	show,
	onClose,
	consortiumName,
}: NewLibraryType) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [activeStepIndex, setActiveStepIndex] = useState(0);
	const [wizardMode, setWizardMode] = useState<
		"unselected" | "existing" | "new"
	>("unselected");
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
	});

	const methods = useForm({
		mode: "onChange",
		resolver: zodResolver(newLibrarySchema),
		defaultValues: {
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
			latitude: null,
			longitude: null,
			supportHours: "",
			patronWebsite: "",
			hostLmsConfiguration: "",
			discoverySystem: "",
			backupDowntimeSchedule: "",
			reason: "Adding a new library",
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
			{ id: "refMappings", label: t("mappings.categories.all") },
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
			return [{ id: "hostLms", label: t("hostlms.new") }, ...base];
		return base;
	}, [wizardMode, requiresNumericMappings, t]);

	const currentStep = steps[activeStepIndex];

	// Mutations
	const { mutateAsync: createHostLms, isPending: isHostLmsPending } =
		useMutation({
			mutationFn: (variables: { input: any }) =>
				gqlClient.request<any>(createHostLmsMutation, variables),
		});

	const { mutateAsync: createLibrary, isPending: isLibraryPending } =
		useMutation({
			mutationFn: (variables: { input: any }) =>
				gqlClient.request<any>(createLibraryMutation, variables),
			onSuccess: () =>
				queryClient.invalidateQueries({ queryKey: ["libraries"] }),
		});

	const handleNext = async () => {
		// Scoped to the CURRENT step's own fields, not the whole shared schema:
		// newLibrarySchema requires `contacts` (min 1) unconditionally, and a
		// bare methods.trigger() validates every field in the schema regardless
		// of which step is showing. Since contacts isn't filled in until a
		// later step, that made the wizard unable to ever advance past the
		// first step, no matter what was entered - and because the failing
		// field (contacts) isn't rendered on earlier steps, nothing ever
		// showed why "Next" appeared to do nothing.
		const fieldsToValidate = STEP_SCHEMA_FIELDS[currentStep?.id ?? ""] ?? [];
		const isStepValid =
			fieldsToValidate.length === 0 ||
			(await methods.trigger(fieldsToValidate));
		if (!isStepValid) return;

		const formData = methods.getValues();

		try {
			// Phase 1: If creating a Host LMS. zod catches bad json so no need for dupes
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
				// Check this matches up with GQL, but the principle is right - we should be using what comes back
				methods.setValue("hostLmsCode", result.createHostLms.hostLms.code);
				setAlert({
					open: true,
					severity: "success",
					text: t("hostlms.success_ping", {
						status: result.createHostLms.pingStatus,
					}),
				});
			}

			// Phase 2: If creating Library + Contacts
			if (currentStep?.id === "contacts") {
				const result = await createLibrary({
					input: {
						...formData,
					},
				});
				methods.setValue("libraryId", result.createLibrary.library.id);
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.new.success", {
						consortium: consortiumName || "",
					}),
				});
			}

			if (currentStep?.id === "group" && formData.groupId) {
				await gqlClient.request(addLibraryToGroup, {
					input: {
						libraryGroup: formData.groupId,
						library: formData.libraryId,
					},
				});
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.alert_text_success"),
				});
			}

			setActiveStepIndex((prev) => prev + 1);
		} catch (error: any) {
			setAlert({
				open: true,
				severity: "error",
				text: error.message || t("ui.error.general"),
			});
		}
	};

	const handleClose = () => {
		methods.reset();
		setWizardMode("unselected");
		setActiveStepIndex(0);
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
											disabled={isHostLmsPending || isLibraryPending}
										>
											{isHostLmsPending || isLibraryPending
												? t("ui.info.wait")
												: t("ui.actions.next")}
										</Button>
									) : (
										<Button
											variant="contained"
											onClick={handleClose}
											color="success"
										>
											{t("ui.actions.finish")}
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
