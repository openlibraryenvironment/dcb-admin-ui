import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

import TimedAlert from "@components/TimedAlert/TimedAlert";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getLocalId } from "@helpers/getLocalId";
import { createLocation } from "@mutations/createLocation";

interface NewLocationFormData {
	code: string;
	name: string;
	isPickup: boolean;
	latitude: number | null;
	longitude: number | null;
	isEnabledForPickupAnywhere: boolean;
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
	onCreated?: () => void;
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
	onCreated,
}: NewLocationFormType) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
	});

	const validationSchema = Yup.object().shape({
		code: Yup.string()
			.required(t("ui.validation.required", { field: t("locations.code") }))
			.max(200),
		name: Yup.string()
			.required(t("ui.validation.required", { field: t("locations.name") }))
			.max(255),
		localId: Yup.string()
			.max(64)
			.when("$ils", {
				is: "FOLIO",
				then: (schema) =>
					schema
						.required(
							t("ui.validation.required", { field: t("locations.local_id") }),
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
							t("ui.validation.required", { field: t("locations.local_id") }),
						)
						.matches(/^\d+$/, t("ui.validation.locations.local_id_polaris"))
						.test(
							"non-negative",
							t("ui.validation.locations.local_id_polaris"),
							(val) => !val || parseInt(val) >= 0,
						),
			})
			.when("$ils", {
				is: "Sierra",
				then: (schema) =>
					schema
						.nullable()
						.optional()
						.test(
							"non-negative-if-provided",
							t("ui.validation.locations.local_id_sierra"),
							(val) => !val || (/^\d+$/.test(val) && parseInt(val) >= 0),
						),
			}),
		deliveryStops: Yup.string().max(128),
		printLabel: Yup.string().max(128),
		latitude: Yup.number()
			.nullable()
			.transform((v, o) => (o === "" ? null : v))
			.required(t("ui.validation.locations.lat"))
			.min(-90)
			.max(90),
		longitude: Yup.number()
			.nullable()
			.transform((v, o) => (o === "" ? null : v))
			.required(
				t("ui.validation.required", { field: t("locations.longitude") }),
			)
			.min(-180)
			.max(180),
		reason: Yup.string().max(100),
		changeCategory: Yup.string().max(200),
		changeReferenceUrl: Yup.string().url(t("ui.data_grid.edit_url")).max(200),
		isPickup: Yup.boolean().required(),
		isEnabledForPickupAnywhere: Yup.boolean().required(),
	});

	const parseServerError = (error: any): ServerError => {
		const message = error.message || "An unknown error occurred";
		if (
			message.match(/localID is required for FOLIO systems/) ||
			message.match(/localId must be a valid UUID for FOLIO systems/)
		)
			return {
				message: t("ui.validation.locations.local_id_folio"),
				field: "localId",
			};
		if (
			message.match(/localId is required for Polaris systems/) ||
			message.match(
				/localId must be a non-negative integer for Polaris systems/,
			)
		)
			return {
				message: t("ui.validation.locations.local_id_polaris"),
				field: "localId",
			};
		if (message.match(/must be a non-negative integer for Sierra systems/))
			return {
				message: t("ui.validation.locations.local_id_sierra"),
				field: "localId",
			};
		if (message.match(/Location with this localId already exists/))
			return {
				message: t("locations.new.error.already_exists"),
				field: "localId",
			};
		if (message.match(/latitude must be between/))
			return { message: t("ui.validation.locations.lat"), field: "latitude" };
		if (message.match(/longitude must be between/))
			return { message: t("ui.validation.locations.long"), field: "longitude" };
		if (message.match(/Location with this code already exists/))
			return { message: t("locations.new.error.code_exists"), field: "code" };
		return { message };
	};

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty },
		setError,
		getValues,
		setValue,
	} = useForm<NewLocationFormData>({
		defaultValues: {
			code: "",
			name: "",
			printLabel: "",
			deliveryStops: "",
			reason: "",
			localId: "",
			changeCategory: "Location creation",
			changeReferenceUrl: "",
			isPickup: true,
			isEnabledForPickupAnywhere: true,
			latitude: null,
			longitude: null,
		},
		resolver: yupResolver(validationSchema) as any,
		mode: "onChange",
		context: { ils },
	});

	const { mutateAsync: createNewLocation, isPending } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(createLocation, variables),
		onSuccess: () => queryClient.invalidateQueries(), // Broad refresh to update any active grid
	});

	const onSubmit = async (data: NewLocationFormData) => {
		try {
			await createNewLocation({
				input: { ...data, agencyCode, hostLmsCode, type },
			});
			setAlert({
				open: true,
				severity: "success",
				text: t("locations.new.success", { name: libraryName }),
			});
			onCreated?.();
			setTimeout(() => {
				reset();
				onClose();
			}, 1000);
		} catch (error) {
			const parsedError = parseServerError(error);
			if (parsedError.field) {
				setError(parsedError.field as keyof NewLocationFormData, {
					type: "server",
					message: parsedError.message,
				});
			} else {
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
			<Dialog open={show} onClose={onClose} fullWidth maxWidth="sm">
				<DialogTitle variant="modalTitle">
					{t("locations.new.title", { name: libraryName })}
				</DialogTitle>
				<Divider aria-hidden="true" />
				<DialogContent>
					<Box
						component="form"
						onSubmit={handleSubmit(onSubmit)}
						sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
					>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("locations.name")}
									required
									error={!!errors.name}
									helperText={errors.name?.message}
									onBlur={(e) => {
										field.onBlur();
										if (!getValues("printLabel"))
											setValue("printLabel", e.target.value);
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
									label={t("locations.code")}
									required
									error={!!errors.code}
									helperText={errors.code?.message}
								/>
							)}
						/>
						<Controller
							name="longitude"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									type="number"
									label={t("locations.longitude")}
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
									type="number"
									label={t("locations.latitude")}
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
									required={ils !== "Sierra"}
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
										value={field.value?.toString()}
										onChange={(e) => field.onChange(e.target.value === "true")}
									>
										<MenuItem value="true">
											{t("locations.new.pickup_enabled")}
										</MenuItem>
										<MenuItem value="false">
											{t("locations.new.pickup_disabled")}
										</MenuItem>
									</Select>
									{errors.isPickup && (
										<FormHelperText>{errors.isPickup.message}</FormHelperText>
									)}
								</FormControl>
							)}
						/>

						<Controller
							name="isEnabledForPickupAnywhere"
							control={control}
							render={({ field }) => (
								<FormControl
									fullWidth
									error={!!errors.isEnabledForPickupAnywhere}
								>
									<InputLabel>
										{t("locations.new.pickup_anywhere_status")}
									</InputLabel>
									<Select
										{...field}
										label={t("locations.new.pickup_anywhere_status")}
										value={field.value?.toString()}
										onChange={(e) => field.onChange(e.target.value === "true")}
									>
										<MenuItem value="true">
											{t("locations.new.pickup_anywhere_enabled")}
										</MenuItem>
										<MenuItem value="false">
											{t("locations.new.pickup_anywhere_disabled")}
										</MenuItem>
									</Select>
									{errors.isEnabledForPickupAnywhere && (
										<FormHelperText>
											{errors.isEnabledForPickupAnywhere.message}
										</FormHelperText>
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
									label={t("data_change_log.reference_url")}
									error={!!errors.changeReferenceUrl}
									helperText={errors.changeReferenceUrl?.message}
								/>
							)}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={onClose} variant="outlined">
						{t("mappings.cancel")}
					</Button>
					<Box sx={{ flex: 1 }} />
					<Button
						variant="contained"
						disabled={!isValid || !isDirty || isPending}
						onClick={handleSubmit(onSubmit)}
					>
						{isPending ? t("ui.actions.submitting") : t("locations.new.button")}
					</Button>
				</DialogActions>
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
