import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Autocomplete,
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
import { getILS } from "@helpers/getILS";
import { getLocalId } from "@helpers/getLocalId";
import { defaultCreationReason } from "@helpers/auditDefaults";
import { createLocation } from "@mutations/createLocation";
import { entityOwnsQueryKey } from "@constants/entityRegistry";
import {
	locationLibraryOptionsQuery,
	type LocationLibraryOption,
} from "@/queryOptions/libraries";
import type { CreateLocationMutationVariables } from "@generated/graphql";

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
	/** Required, and prefilled - see defaultCreationReason. */
	reason: string;
	changeReferenceUrl?: string;
	changeCategory?: string;
}

/**
 * Where a new location goes: the agency and Host LMS that own it, and the ILS whose
 * rules its localId must satisfy.
 *
 * A library's own Locations tab knows all three and passes them. The consortium-wide
 * locations page knows none of them, so it asks here - it cannot simply leave them
 * empty, because `agencyCode: ""` satisfies `String!` and is then an agency code the
 * server cannot resolve, which fails the create with no indication of why.
 */
interface LocationScope {
	agencyCode: string;
	hostLmsCode: string;
	ils: string;
}

type NewLocationFormType = {
	show: boolean;
	onClose: () => void;
	/** Omit (or pass empty) to have the dialog ask for a library. */
	hostLmsCode?: string;
	ils?: string;
	agencyCode?: string;
	libraryName?: string;
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
	hostLmsCode = "",
	agencyCode = "",
	libraryName = "",
	type,
	ils = "",
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

	// Both codes, not either: the mutation needs both, and a caller that has one
	// without the other has not scoped this dialog.
	const scopedByCaller = !!agencyCode && !!hostLmsCode;

	const [library, setLibrary] = useState<LocationLibraryOption | null>(null);
	const [chosenHostLmsCode, setChosenHostLmsCode] = useState("");

	const { data: libraryOptions = [], isLoading: librariesLoading } = useQuery({
		...locationLibraryOptionsQuery(gqlClient),
		enabled: show && !scopedByCaller,
	});

	const hostLmsChoices = library?.hostLms ?? [];
	const hostLms =
		hostLmsChoices.length === 1
			? hostLmsChoices[0]
			: hostLmsChoices.find((option) => option.code === chosenHostLmsCode);

	const scope: LocationScope = scopedByCaller
		? { agencyCode, hostLmsCode, ils }
		: {
				agencyCode: library?.agencyCode ?? "",
				hostLmsCode: hostLms?.code ?? "",
				ils: hostLms ? getILS(hostLms.lmsClientClass) : "",
			};

	/** The library this location will belong to, however the dialog came to know it. */
	const scopeName = libraryName || library?.label || "";

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
		reason: Yup.string()
			.trim()
			.max(100)
			.required(t("data_change_log.reason_required")),
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
		clearErrors,
	} = useForm<NewLocationFormData>({
		defaultValues: {
			code: "",
			name: "",
			printLabel: "",
			deliveryStops: "",
			reason: defaultCreationReason("locations.location_one"),
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
		context: { ils: scope.ils },
	});

	/**
	 * A localId identifies this location within ONE Host LMS, so one typed for the
	 * previous system is not a value for this one.
	 *
	 * Cleared, not re-validated: react-hook-form reads `context` from `_options`, which
	 * in a change handler still holds the ILS of the render that called it, so
	 * `trigger` would check the new value against the old system's rules.
	 */
	const clearLocalIdForNewHostLms = () => {
		setValue("localId", "", { shouldDirty: false });
		clearErrors("localId");
	};

	const { mutateAsync: createNewLocation, isPending } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any, CreateLocationMutationVariables>(
				createLocation,
				variables,
			),
		// The registry decides which cached queries a location appears in, exactly as it
		// does for an edit or a delete. A literal ["locations"] key missed the library
		// tab's grid entirely - it keys on `libraryLocations-${libraryId}`, and TanStack
		// matches an array PREFIX - so a location created there never appeared.
		onSuccess: () =>
			queryClient.invalidateQueries({
				predicate: (query) => entityOwnsQueryKey("location", query.queryKey),
			}),
	});

	const onSubmit = async (data: NewLocationFormData) => {
		try {
			await createNewLocation({
				input: {
					...data,
					agencyCode: scope.agencyCode,
					hostLmsCode: scope.hostLmsCode,
					type,
				},
			});
			setAlert({
				open: true,
				severity: "success",
				text: t("locations.new.success", { name: scopeName }),
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
					text: t("locations.new.error.generic", { name: scopeName }),
				});
			}
		}
	};

	return (
		<>
			<Dialog open={show} onClose={onClose} fullWidth maxWidth="sm">
				<DialogTitle variant="modalTitle">
					{/* Opened from the consortium-wide locations page there is no library,
					    and the interpolated title degraded to "Add new location for". */}
					{scopeName
						? t("locations.new.title", { name: scopeName })
						: t("locations.new.title_no_library")}
				</DialogTitle>
				<Divider aria-hidden="true" />
				<DialogContent>
					<Box
						component="form"
						onSubmit={handleSubmit(onSubmit)}
						sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
					>
						{/* Only when the caller could not say. A library's own Locations tab
						    already knows its agency and Host LMS, and asking again there
						    would let an administrator file a location under a library whose
						    page they are not on. */}
						{!scopedByCaller && (
							<Autocomplete
								options={libraryOptions}
								loading={librariesLoading}
								value={library}
								onChange={(_event, selected) => {
									setLibrary(selected);
									// A code from the previous library is not a choice about
									// this one.
									setChosenHostLmsCode("");
									clearLocalIdForNewHostLms();
								}}
								getOptionLabel={(option) => option.label}
								isOptionEqualToValue={(option, current) =>
									option.id === current.id
								}
								renderInput={(inputParams) => (
									<TextField
										{...inputParams}
										label={t("locations.new.library")}
										required
										helperText={t("locations.new.library_helper")}
									/>
								)}
							/>
						)}

						{/* One Host LMS needs no question; two do, and which one holds the
						    location decides whether its localId is required and in what
						    shape. */}
						{!scopedByCaller && hostLmsChoices.length > 1 && (
							<FormControl fullWidth required>
								<InputLabel id="new-location-host-lms-label">
									{t("locations.new.host_lms")}
								</InputLabel>
								<Select
									labelId="new-location-host-lms-label"
									label={t("locations.new.host_lms")}
									value={chosenHostLmsCode}
									onChange={(event) => {
										setChosenHostLmsCode(event.target.value);
										clearLocalIdForNewHostLms();
									}}
								>
									{hostLmsChoices.map((option) => (
										<MenuItem key={option.code} value={option.code}>
											{option.code} ({getILS(option.lmsClientClass)})
										</MenuItem>
									))}
								</Select>
								<FormHelperText>
									{t("locations.new.host_lms_helper")}
								</FormHelperText>
							</FormControl>
						)}

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
									label={t(getLocalId(scope.ils))}
									// The two ILSs whose localId the schema above actually
									// requires. `!== "Sierra"` marked it required for Alma,
									// Koha and an unrecognised client class as well, where
									// nothing enforces it - an asterisk promising a rule that
									// does not exist.
									required={scope.ils === "FOLIO" || scope.ils === "Polaris"}
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
						disabled={
							!isValid ||
							!isDirty ||
							isPending ||
							!scope.agencyCode ||
							!scope.hostLmsCode
						}
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
