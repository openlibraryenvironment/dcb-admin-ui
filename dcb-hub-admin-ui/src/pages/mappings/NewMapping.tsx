import { useMutation } from "@apollo/client";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	TextField,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { createReferenceValueMapping, getMappings } from "src/queries/queries";

interface NewMappingFormData {
	toValue: string;
	toCategory: string;
	toContext: string;
	fromValue: string;
	fromContext: string;
	fromCategory: string;
	reason?: string;
	changeCategory?: string;
	changeReferenceUrl?: string;
}

interface ServerError {
	message: string;
	field?: string;
}

type NewMappingFormType = {
	show: boolean;
	onClose: () => void;
	category: string;
	hostLmsCode: string;
	agencyCode: string;
	libraryName: string;

	// This will take a library name and probably a Host LMS and agency code too
};

const parseServerError = (error: any): ServerError => {
	const message = error.message || "An unknown error occurred";

	// Parse validation error messages to extract field information
	// This would be a lot easier if we could attach a 'field' to the response.
	const patronTypeMatch = message.match(
		/patronType.*values for this mapping are/,
	);
	const itemTypeMatch = message.match(/ItemType.*values for this mapping are/);
	const locationMatch = message.match(/Location mapping must have/);
	const duplicateMatch = message.match(/duplicate 'from' values/);
	const blankMatch = message.match(/blank values/);
	const toValueMatch = message.match(/to value/);
	const fromValueMatch = message.match(/from value/);

	if (patronTypeMatch && toValueMatch) {
		return { message, field: "toValue" };
	} else if (itemTypeMatch && toValueMatch) {
		return { message, field: "toValue" };
	} else if (patronTypeMatch && fromValueMatch) {
		return { message, field: "fromValue" };
	} else if (itemTypeMatch && fromValueMatch) {
		return { message, field: "fromValue" };
	} else if (locationMatch) {
		return { message, field: "toContext" };
	} else if (duplicateMatch) {
		return { message, field: "fromValue" };
	} else if (blankMatch) {
		return { message, field: "fromValue" };
	}

	return { message };
};

export default function NewMapping({
	show,
	onClose,
	category,
	hostLmsCode,
	agencyCode,
	libraryName,
}: NewMappingFormType) {
	const { t } = useTranslation();
	const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

	const validationSchema = Yup.object().shape({
		fromCategory: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("mappings.new.from_category"),
				}),
			)
			.max(64, t("ui.validation.max_length", { length: 64 })),
		fromContext: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("mappings.new.from_context"),
				}),
			)
			.max(64, t("ui.validation.max_length", { length: 64 })),
		fromValue: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("mappings.new.from_value"),
				}),
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		toCategory: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("mappings.new.to_category"),
				}),
			)
			.max(64, t("ui.validation.max_length", { length: 64 })),
		toContext: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("mappings.new.to_context"),
				}),
			)
			.max(64, t("ui.validation.max_length", { length: 64 })),
		toValue: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("mappings.new.to_value"),
				}),
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
	});

	const {
		control,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isValid, isDirty },
		register,
	} = useForm<NewMappingFormData>({
		defaultValues: {
			toValue: category == "Location" ? agencyCode : "", // pre-populate as agency code for location mapping
			toContext: category == "Location" ? "DCB" : "", // Pre-populate as DCB  for new location mapping
			toCategory: category,
			fromValue: "",
			fromCategory: category,
			fromContext: category == "Location" ? hostLmsCode : "", // Pre-populate as catalogue Host LMS code for new Location mapping
			reason: "",
			changeCategory: "",
			changeReferenceUrl: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	const [createMapping, { loading }] = useMutation(
		createReferenceValueMapping,
		{
			refetchQueries: [getMappings], // Probably needs specific library query, add parameters when we have them.
		},
	);

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
	});

	const onSubmit = async (data: NewMappingFormData) => {
		try {
			setServerErrors({});
			const result = await createMapping({
				variables: { input: { ...data } },
			});

			if (result.data) {
				setAlert({
					open: true,
					severity: "success",
					text: t("mappings.new.success"),
				});

				// Delay the modal closing and form reset to ensure the alert is visible
				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			}
		} catch (error) {
			const parsedError = parseServerError(error);
			console.error("Error creating new mapping:", error);
			if (parsedError.field) {
				setError(parsedError.field as keyof NewMappingFormData, {
					type: "server",
					message: parsedError.message,
				});
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: t("mappings.new.error.generic", { library: libraryName }),
				});
			}
		}
	};
	const getFieldError = (fieldName: keyof NewMappingFormData) => {
		return errors[fieldName]?.message || serverErrors[fieldName];
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-mapping-modal"
			>
				<DialogTitle variant="modalTitle">
					{t("mappings.new.title")}
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
							mt: 2,
						}}
					>
						<Controller
							name="fromContext"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("mappings.new.from_context")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.fromContext || !!serverErrors.fromContext}
									// helperText={errors.fromContext?.message}
									helperText={getFieldError("fromContext")}
								/>
							)}
						/>
						<Controller
							name="fromCategory"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("mappings.new.from_category")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.fromCategory || !!errors.fromCategory}
									// helperText={errors.fromCategory?.message}
									helperText={getFieldError("fromCategory")}
								/>
							)}
						/>
						<Controller
							name="fromValue"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("mappings.new.from_value")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.fromValue || !!errors.fromValue}
									// helperText={errors.fromValue?.message}
									helperText={getFieldError("fromValue")}
								/>
							)}
						/>
						<Controller
							name="toContext"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("mappings.new.to_context")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.toContext || !!serverErrors.toContext}
									// helperText={errors.toContext?.message}
									helperText={getFieldError("toContext")}
								/>
							)}
						/>
						<Controller
							name="toCategory"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("mappings.new.to_category")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.toCategory || !!serverErrors.toCategory}
									// helperText={errors.toCategory?.message}
									helperText={getFieldError("toCategory")}
								/>
							)}
						/>
						<Controller
							name="toValue"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("mappings.new.to_value")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.toValue || !!serverErrors.toValue}
									// helperText={errors.toValue?.message}
									helperText={getFieldError("toValue")}
								/>
							)}
						/>
						<Controller
							name="reason"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("data_change_log.reason_addition")}
									variant="outlined"
									fullWidth
									error={!!errors.reason}
									helperText={errors.reason?.message}
								/>
							)}
						/>

						<TextField
							{...register("changeReferenceUrl")}
							fullWidth
							variant="outlined"
							label={t("data_change_log.reference_url")}
							name={t("data_change_log.reference_url")}
							error={!!errors.changeReferenceUrl}
							helperText={errors.changeReferenceUrl?.message}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={onClose} variant="outlined" color="primary">
						{t("mappings.cancel")}
					</Button>
					<div style={{ flex: "1 0 0" }} />
					<Button
						type="submit"
						variant="contained"
						color="primary"
						disabled={!isValid || !isDirty || loading}
						onClick={handleSubmit(onSubmit)}
					>
						{loading ? t("ui.action.submitting") : t("mappings.new.title")}
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
