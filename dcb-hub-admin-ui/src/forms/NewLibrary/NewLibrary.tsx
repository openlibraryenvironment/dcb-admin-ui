import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
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

import ModeSelectionStep from "./steps/ModeSelectionStep";
import HostLmsStep from "./steps/HostLmsStep";
import { ProfileStep } from "./steps/ProfileStep";
import ContactsStep from "./steps/ContactsStep";
import GroupStep from "./steps/GroupStep";
import RefValueMappingStep from "./steps/RefValueMappingStep";
import NumericMappingStep from "./steps/NumericRangeMappingStep";
import LocationsStep from "./steps/LocationsStep";
import { addLibraryToGroup } from "@mutations/addLibraryToGroup";

type NewLibraryType = {
	show: boolean;
	onClose: () => void;
	consortiumName?: string;
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
	const [createdHostLmsCode, setCreatedHostLmsCode] = useState<string | null>(
		null,
	);
	const [createdLibraryId, setCreatedLibraryId] = useState<string | null>(null);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
	});

	const methods = useForm({
		mode: "onChange",
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

	const lmsClientClass = methods.watch("lmsClientClass");
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
		const isStepValid = await methods.trigger();
		if (!isStepValid) return;

		const formData = methods.getValues();

		try {
			// Phase 1: If creating a Host LMS
			if (currentStep?.id === "hostLms") {
				let parsedConfig = {};
				try {
					parsedConfig = JSON.parse(formData.clientConfig || "{}");
				} catch (e) {
					throw new Error(
						t("hostlms.client_config_json_helper") ||
							"Invalid JSON in client config",
					);
				}

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
				setCreatedHostLmsCode(result.createHostLms.hostLms.code);
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
						hostLmsCode:
							wizardMode === "new" ? createdHostLmsCode : formData.hostLmsCode,
					},
				});
				setCreatedLibraryId(result.createLibrary.id);
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
					input: { libraryGroup: formData.groupId, library: createdLibraryId },
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
			return <ModeSelectionStep setMode={setWizardMode} />;

		switch (currentStep?.id) {
			case "hostLms":
				return <HostLmsStep />;
			case "profile":
				return <ProfileStep />;
			case "contacts":
				return <ContactsStep />;
			case "group":
				return <GroupStep libraryId={createdLibraryId!} />;
			case "refMappings":
				return (
					<RefValueMappingStep
						hostLmsCode={
							wizardMode === "new"
								? createdHostLmsCode!
								: methods.getValues("hostLmsCode")
						}
					/>
				);
			case "numMappings":
				return (
					<NumericMappingStep
						hostLmsCode={
							wizardMode === "new"
								? createdHostLmsCode!
								: methods.getValues("hostLmsCode")
						}
					/>
				);
			case "locations":
				return (
					<LocationsStep
						hostLmsCode={
							wizardMode === "new"
								? createdHostLmsCode!
								: methods.getValues("hostLmsCode")
						}
						agencyCode={methods.getValues("agencyCode")}
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
									justifyContent="space-between"
									sx={{ mt: 4 }}
								>
									<Button variant="outlined" onClick={handleClose}>
										{t("ui.action.cancel")}
									</Button>

									{activeStepIndex < steps.length - 1 ? (
										<Button
											variant="contained"
											onClick={handleNext}
											disabled={isHostLmsPending || isLibraryPending}
										>
											{isHostLmsPending || isLibraryPending
												? t("ui.info.wait")
												: t("ui.action.next")}
										</Button>
									) : (
										<Button
											variant="contained"
											onClick={handleClose}
											color="success"
										>
											{t("ui.action.finish")}
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
