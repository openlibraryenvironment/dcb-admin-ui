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
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { createLocation, getLocations } from "src/queries/queries";
import { getLocalId } from "src/helpers/getLocalId";

interface NewLocationFormData {
	code: string;
	name: string;
	isPickup: boolean;
	latitude: number;
	longitude: number;
	printLabel?: string;
	localId?: string;
	deliveryStops?: string;
	reason?: string;
	changeReferenceUrl?: string;
	changeCategory?: string;
}

type NewLocationFormType = {
	show: boolean;
	onClose: () => void;
	hostLmsCode: string;
	ils: string;
	agencyCode: string;
	libraryName: string;
	type: string;
};
interface ServerError {
	message: string;
	field?: string;
}

export default function NewLocation({
	show,
	onClose,
	hostLmsCode,
	agencyCode,
	libraryName,
	type,
	ils,
}: NewLocationFormType) {
	const { t } = useTranslation();
	const validationSchema = Yup.object().shape({
		code: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("details.location_code"),
				}),
			)
			.max(200, t("ui.validation.max_length", { length: 200 })),
		name: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("details.location_name"),
				}),
			)
			.max(255, t("ui.validation.max_length", { length: 255 })),
		localId: Yup.string()
			// Required when Polaris or FOLIO.
			.max(64, t("ui.validation.max_length", { length: 64 }))
			.when("$ils", {
				is: "FOLIO",
				then: (schema) =>
					schema
						.required(
							t("ui.validation.required", { field: t("details.local_id") }),
						)
						.matches(
							/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
							t("ui.validation.locations.local_id_folio"),
						),
			})
			.when("$ils", {
				is: "Polaris",
				then: (schema) =>
					schema
						.required(
							t("ui.validation.required", { field: t("details.local_id") }),
						)
						.matches(/^\d+$/, t("ui.validation.locations.local_id_polaris"))
						.test(
							"non-negative",
							t("ui.validation.locations.local_id_polaris"),
							(value) =>
								value === undefined || value === "" || parseInt(value) >= 0,
						),
			})
			.when("$ils", {
				is: "Sierra",
				then: (schema) =>
					schema
						.optional()
						.nullable()
						.test(
							"non-negative-if-provided",
							t("ui.validation.locations.local_id_sierra"),
							(value) =>
								value === undefined ||
								value === "" ||
								value === null ||
								(/^\d+$/.test(value) && parseInt(value) >= 0),
						),
			}),
		deliveryStops: Yup.string().max(
			128,
			t("ui.validation.max_length", { length: 128 }),
		),
		printLabel: Yup.string().max(
			128,
			t("ui.validation.max_length", { length: 128 }),
		),
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
		reason: Yup.string().max(
			100,
			t("ui.validation.max_length", { length: 100 }),
		),
		changeCategory: Yup.string().max(
			200,
			t("ui.validation.max_length", { length: 200 }),
		),
		changeReferenceUrl: Yup.string()
			.url(t("ui.data_grid.edit_url"))
			.typeError(t("ui.data_grid.edit_url"))
			.max(200, t("ui.validation.max_length", { length: 200 })),
		isPickup: Yup.boolean().required(
			t("ui.validation.required", {
				field: t("details.is_pickup"),
			}),
		),
	});

	const parseServerError = (error: any): ServerError => {
		// To handle server side errors and make them translation keys
		const message = error.message || "An unknown error occurred";
		const folioIDRequired = message.match(
			/localID is required for FOLIO systems/,
		);
		const folioMustBeId = message.match(
			/Location creation failed: localId must be a valid UUID for FOLIO systems/,
		);
		const polarisRequired = message.match(
			/localId is required for Polaris systems"/,
		);
		const sierraId = message.match(
			/must be a non-negative integer for Sierra systems/,
		);
		const polarisId = message.match(
			/localId must be a non-negative integer for Polaris systems/,
		);
		const invalidLat = message.match(/latitude must be between/);
		const invalidLong = message.match(/longitude must be between/);
		const alreadyExists = message.match(
			/Location with this localId already exists/,
		);
		const codeExists = message.match(/Location with this code already exists/);
		// could return keys instead
		if (folioIDRequired || folioMustBeId) {
			return {
				message: t("ui.validation.locations.local_id_folio"),
				field: "localId",
			};
		} else if (polarisRequired || polarisId) {
			return {
				message: t("ui.validation.locations.local_id_polaris"),
				field: "localId",
			};
		} else if (sierraId) {
			return {
				message: t("ui.validation.locations.local_id_sierra"),
				field: "localId",
			};
		} else if (alreadyExists) {
			return {
				message: t("locations.new.error.already_exists"),
				field: "localId",
			};
		} else if (invalidLat) {
			return { message: t("ui.validation.locations.lat"), field: "latitude" };
		} else if (invalidLong) {
			return { message: t("ui.validation.locations.long"), field: "longitude" };
		} else if (codeExists) {
			return { message: t("locations.new.error.code_exists"), field: "code" };
		}
		return { message };
	};

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty },
		setError,
		watch,
		setValue,
	} = useForm<NewLocationFormData>({
		defaultValues: {
			code: "",
			name: "",
			printLabel: "",
			deliveryStops: "",
			reason: "",
			changeCategory: "Location creation",
			changeReferenceUrl: "",
			isPickup: true,
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
		context: { ils: ils },
	});

	const [createNewLocation, { loading }] = useMutation(createLocation, {
		refetchQueries: [getLocations],
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

	const onSubmit = async (data: NewLocationFormData) => {
		try {
			const result = await createNewLocation({
				variables: { input: { ...data, agencyCode, hostLmsCode, type } },
			});

			if (result.data) {
				setAlert({
					open: true,
					severity: "success",
					text: t("locations.new.success", { name: libraryName }),
				});

				// Delay the modal closing and form reset to ensure the alert is visible
				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			}
		} catch (error) {
			// This will only get errors coming from the server. So anything caught by client-side should not reach here.
			const parsedError = parseServerError(error);
			console.error("Error creating new location:", error);
			if (parsedError.field) {
				setError(parsedError.field as keyof NewLocationFormData, {
					type: "server",
					message: parsedError.message,
				});
			} else {
				console.error("Error creating new location:", error);
				setAlert({
					open: true,
					severity: "error",
					text: t("locations.new.error.generic", { name: libraryName }),
				});
			}
		}
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-location-modal"
			>
				<DialogTitle variant="modalTitle">
					{t("locations.new.title", { name: libraryName })}
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
							name="name"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("details.location_name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.name}
									helperText={errors.name?.message}
									onBlur={(e) => {
										field.onBlur(); // Handle original blur
										const printLabel = watch("printLabel");
										// Only set printLabel if it's empty
										if (!printLabel) {
											setValue("printLabel", e.target.value);
										}
									}}
								/>
							)}
						/>
						<Controller
							name="code"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("details.location_code")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.code}
									helperText={errors.code?.message}
								/>
							)}
						/>
						{/* <Controller
							name="printLabel"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("details.location_printlabel")}
									variant="outlined"
									fullWidth
									error={!!errors.printLabel}
									helperText={errors.printLabel?.message}
								/>
							)}
						/> */}
						<Controller
							name="longitude"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("details.long")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.longitude}
									helperText={errors.longitude?.message}
								/>
							)}
						/>
						<Controller
							name="latitude"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("details.lat")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.latitude}
									helperText={errors.latitude?.message}
								/>
							)}
						/>
						<Controller
							name="localId"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t(getLocalId(ils))}
									variant="outlined"
									fullWidth
									required={ils == "Sierra" ? false : true}
									error={!!errors.localId}
									helperText={errors.localId?.message}
								/>
							)}
						/>
						<Controller
							name="isPickup"
							control={control}
							render={({ field }) => (
								<FormControl fullWidth error={!!errors.isPickup}>
									<InputLabel>{t("locations.new.pickup_status")}</InputLabel>
									<Select
										{...field}
										label={t("locations.new.pickup_status")}
										value={field.value?.toString() ?? "true"}
										onChange={(e) => {
											field.onChange(e.target.value === "true");
										}}
									>
										<MenuItem
											key={t("locations.new.pickup_enabled")}
											value="true"
										>
											{t("locations.new.pickup_enabled")}
										</MenuItem>
										<MenuItem
											key={t("locations.new.pickup_disabled")}
											value="false"
										>
											{t("locations.new.pickup_disabled")}
										</MenuItem>
									</Select>
									{errors.isPickup && (
										<FormHelperText>{errors.isPickup?.message}</FormHelperText>
									)}
								</FormControl>
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

						<Controller
							name="changeReferenceUrl"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									variant="outlined"
									label={t("data_change_log.reference_url")}
									error={!!errors.changeReferenceUrl}
									helperText={errors.changeReferenceUrl?.message}
								/>
							)}
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
						{loading ? t("ui.action.submitting") : t("locations.new.button")}
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
