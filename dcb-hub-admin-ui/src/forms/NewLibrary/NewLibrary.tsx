import { useMutation, useQuery } from "@apollo/client";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
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
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { TechnicalDetailsStep } from "./steps/TechnicalDetailsStep";
import ContactsStep from "./steps/ContactsStep";
import ReviewStep from "./steps/ReviewStep";

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
		t("library.steps.basic_info"),
		t("library.steps.technical_details"),
		t("library.steps.contacts"),
		t("library.steps.review"),
	];

	// Form validation schema based on steps
	const basicInfoSchema = Yup.object().shape({
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
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.supportHours"),
				}),
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		address: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.address"),
				}),
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		type: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("libraries.details.type"),
				}),
			),
	});

	const technicalDetailsSchema = Yup.object().shape({
		latitude: Yup.number()
			.notRequired()
			.typeError(t("ui.validation.must_be_number")),
		longitude: Yup.number()
			.notRequired()
			.typeError(t("ui.validation.must_be_number")),
		patronWebsite: Yup.string().nullable().url(t("ui.data_grid.edit_url")),
		hostLmsConfiguration: Yup.string().nullable(),
		discoverySystem: Yup.string().nullable(),
		backupDowntimeSchedule: Yup.string().nullable(),
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
		...basicInfoSchema.fields,
		...technicalDetailsSchema.fields,
		contacts: Yup.array()
			.of(contactSchema)
			.min(1, t("library.validation.min_one_contact")),
		reason: Yup.string().required(
			t("ui.validation.required", {
				field: t("data_change_log.reason"),
			}),
		),
		changeCategory: Yup.string().nullable(),
		changeReferenceUrl: Yup.string().nullable(),
	});

	// Use different validation schema based on the active step
	const getValidationSchema = () => {
		switch (activeStep) {
			case 0:
				return basicInfoSchema;
			case 1:
				return technicalDetailsSchema;
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
		getValues,
		formState: { errors, isValid },
		register,
	} = useForm<NewLibraryFormData>({
		defaultValues: {
			fullName: "",
			shortName: "",
			abbreviatedName: "",
			agencyCode: "",
			supportHours: "",
			address: "",
			type: "",
			latitude: undefined,
			longitude: undefined,
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

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
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
					text: t("consortium.new_library.success", {
						consortium: consortiumName,
					}),
				});

				// Delay the modal closing and form reset to ensure the alert is visible
				setTimeout(() => {
					reset();
					setActiveStep(0);
					onClose();
				}, 1000);
			}
		} catch (error) {
			console.error("Error creating new library:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("consortium.new_library.error", {
					consortium: consortiumName,
				}),
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
	const formValues = getValues();

	// Render the active step content
	const getStepContent = (step: number) => {
		switch (step) {
			case 0:
				return (
					<BasicInfoStep
						control={control}
						agencyOptions={agencyOptions}
						agenciesLoading={agenciesLoading}
						errors={errors}
						t={t}
						handleClose={handleClose}
						handleNext={handleNext}
					/>
				);
			case 1:
				return (
					<TechnicalDetailsStep
						control={control}
						t={t}
						errors={errors}
						handleClose={handleClose}
						handleNext={handleNext}
					/>
				);
			case 2:
				return (
					<ContactsStep
						control={control}
						t={t}
						errors={errors}
						handleClose={handleClose}
						handleNext={handleNext}
					/>
				);
			case 3:
				return (
					<ReviewStep
						control={control}
						t={t}
						errors={errors}
						formValues={formValues}
						register={register}
						handleSubmit={handleSubmit(onSubmit)}
						loading={loading}
						isValid={isValid}
					/>
				);
			default:
				return "Unknown step";
		}
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={handleClose}
				fullWidth
				maxWidth="md"
				aria-labelledby="new-library-modal"
			>
				<DialogTitle variant="modalTitle">
					{t("consortium.new_library.title")}
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

					<Box component="form" onSubmit={handleSubmit(onSubmit)}>
						{getStepContent(activeStep)}
					</Box>
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
