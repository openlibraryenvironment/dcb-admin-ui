import { useMutation, useQuery } from "@apollo/client";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import {
	Box,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Stepper,
	Step,
	StepLabel,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { createLibrary, getLibraries, getAgencies } from "src/queries/queries";
import * as Yup from "yup";
import { NewLibraryFormData } from "@models/NewLibraryFormData";
import { ProfileStep } from "./steps/ProfileStep";
import { LocationAndServiceStep } from "./steps/LocationAndServiceStep";
import ContactsStep from "./steps/ContactsStep";
import GroupStep from "./steps/GroupStep";

type NewLibraryType = {
	show: boolean;
	onClose: () => void;
	consortiumName: string;
};

export default function NewLibrary({
	show,
	onClose,
	consortiumName,
}: NewLibraryType) {
	const { t } = useTranslation();
	const [activeStep, setActiveStep] = useState(0);
	const steps = [
		t("libraries.steps.profile"),
		t("libraries.steps.service"),
		t("libraries.steps.contacts"),
		t("libraries.steps.group"),
	];

	const [libraryId, setLibraryId] = useState("");
	// Form validation schema based on steps
	const profileSchema = Yup.object().shape({
		fullName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.fullName"),
				}),
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		shortName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.shortName"),
				}),
			)
			.max(100, t("ui.validation.max_length", { length: 100 })),
		abbreviatedName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.abbreviatedName"),
				}),
			)
			.max(50, t("ui.validation.max_length", { length: 50 })),
		agencyCode: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.agencyCode"),
				}),
			)
			.max(50, t("ui.validation.max_length", { length: 50 })),
		supportHours: Yup.string()
			.trim()
			.max(255, t("ui.validation.max_length", { length: 255 })),
		type: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.type"),
				}),
			),
	});

	const locationAndServiceSchema = Yup.object().shape({
		address: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("libraries.primaryLocation.address"),
				}),
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		latitude: Yup.number()
			.transform((value, originalValue) =>
				originalValue === "" ? null : value,
			) // Stops a weird bug where Yup would attempt to convert an empty string to a number
			.required(t("ui.validation.locations.lat"))
			.typeError(t("ui.validation.locations.lat"))
			.min(-90, t("ui.validation.locations.lat"))
			.max(90, t("ui.validation.locations.lat")),
		longitude: Yup.number()
			.transform((value, originalValue) =>
				originalValue === "" ? null : value,
			) //
			.required(
				t("ui.validation.required", {
					field: t("details.long"),
				}),
			)
			.typeError(t("ui.validation.locations.long"))
			.min(-180, t("ui.validation.locations.long"))
			.max(180, t("ui.validation.locations.long")),
		patronWebsite: Yup.string().nullable().url(t("ui.data_grid.edit_url")),
		hostLmsConfiguration: Yup.string().nullable(),
		discoverySystem: Yup.string().nullable(),
		backupDowntimeSchedule: Yup.string().nullable(),
		reason: Yup.string().required(
			t("ui.validation.required", {
				field: t("data_change_log.reason"),
			}),
		),
		changeCategory: Yup.string().nullable(),
		changeReferenceUrl: Yup.string().nullable(),
	});

	const contactSchema = Yup.object().shape({
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
				t("ui.validation.required", {
					field: t("libraries.contacts.email"),
				}),
			)
			.email(t("ui.validation.invalid_email"))
			.max(255, t("ui.validation.max_length", { length: 255 })),
		role: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.contacts.role"),
				}),
			),
		isPrimaryContact: Yup.boolean(),
	});

	const finalSchema = Yup.object().shape({
		...profileSchema.fields,
		...locationAndServiceSchema.fields,
		contacts: Yup.array()
			.of(contactSchema)
			.min(1, t("libraries.contacts.minimum")),
	});

	// Use different validation schema based on the active step
	const getValidationSchema = (): Yup.ObjectSchema<any> => {
		// Or a more specific partial type
		switch (activeStep) {
			case 0:
				return profileSchema;
			case 1:
				return locationAndServiceSchema;
			case 2:
				return Yup.object().shape({
					contacts: Yup.array()
						.of(contactSchema)
						.min(1, t("library.validation.min_one_contact")),
				});
			case 3:
				return Yup.object().shape({
					reason: Yup.string().required(
						t("ui.validation.required", {
							field: t("data_change_log.reason"),
						}),
					),
				});
			default:
				return finalSchema;
		}
	};

	const {
		control,
		handleSubmit,
		reset,
		trigger,
		formState: { errors, isValid },
	} = useForm<NewLibraryFormData>({
		defaultValues: {
			fullName: "",
			shortName: "",
			abbreviatedName: "",
			agencyCode: "",
			supportHours: "",
			address: "",
			type: "",
			patronWebsite: "",
			hostLmsConfiguration: "",
			discoverySystem: "",
			backupDowntimeSchedule: "",
			contacts: [
				{
					firstName: "",
					lastName: "",
					email: "",
					role: "",
					isPrimaryContact: false,
				},
			],
			reason: "",
			changeCategory: "",
			changeReferenceUrl: "",
		},
		resolver: yupResolver(getValidationSchema()),
		mode: "onChange",
	});

	const [createNewLibrary, { loading }] = useMutation(createLibrary, {
		refetchQueries: [getLibraries],
		onCompleted: (data) => {
			setLibraryId(data?.createLibrary?.id);
		},
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

	const handleNext = async () => {
		const isStepValid = await trigger();
		if (isStepValid) {
			setActiveStep((prevStep) => prevStep + 1);
		}
	};

	const handleClose = () => {
		// Reset state
		reset();
		setActiveStep(0);
		onClose();
	};

	const onSubmit = async (data: NewLibraryFormData) => {
		try {
			const result = await createNewLibrary({
				variables: { input: { ...data } },
			});

			if (result.data) {
				setAlert({
					open: true,
					severity: "success",
					text: t("libraries.new.success", {
						consortium: consortiumName,
					}),
				});

				// Delay the modal closing and form reset to ensure the alert is visible
				setTimeout(() => {
					reset();
					setActiveStep(3);
					// onClose();
				}, 1000);
			}
		} catch (error) {
			console.error("Error creating new library:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("libraries.new.error"),
			});
		}
	};

	const { data: agencies, loading: agenciesLoading } = useQuery(getAgencies, {
		variables: {
			order: "code",
			orderBy: "ASC",
			pageno: 0,
			pagesize: 1000,
			query: "",
		},
	});

	const agencyOptions =
		agencies?.agencies?.content?.map(
			(item: { name: string; code: string }) => ({
				label: item.name,
				value: item.code,
			}),
		) || [];
	// const formValues = getValues();

	// Render the active step content
	const getStepContent = (step: number) => {
		switch (step) {
			case 0:
				return (
					<ProfileStep
						control={control}
						agencyOptions={agencyOptions}
						agenciesLoading={agenciesLoading}
						errors={errors}
						t={t}
						handleClose={handleClose}
						handleNext={handleNext}
						isValid={isValid}
					/>
				);
			case 1:
				return (
					<LocationAndServiceStep
						control={control}
						t={t}
						errors={errors}
						handleClose={handleClose}
						handleNext={handleNext}
						isValid={isValid}
					/>
				);
			case 2:
				return (
					// At this point, the library should be submitted.
					<ContactsStep
						control={control}
						t={t}
						errors={errors}
						handleClose={handleClose}
						handleSubmit={handleSubmit(onSubmit)}
						loading={loading}
						isValid={isValid}
					/>
				);
		}
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={handleClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-library-modal"
			>
				<DialogTitle variant="modalTitle">
					{t("libraries.new.title")}
				</DialogTitle>
				<Divider aria-hidden="true" />

				<DialogContent>
					<Stepper activeStep={activeStep} sx={{ py: 3 }}>
						{steps.map((label) => (
							<Step key={label}>
								<StepLabel>{label}</StepLabel>
							</Step>
						))}
					</Stepper>

					{activeStep < 3 ? (
						<Box component="form" onSubmit={handleSubmit(onSubmit)}>
							{getStepContent(activeStep)}
						</Box>
					) : (
						// Render GroupStep outside of form when it's the active step. Avoids nested forms which can cause issues
						<GroupStep handleClose={handleClose} t={t} libraryId={libraryId} />
					)}
				</DialogContent>
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
