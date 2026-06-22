import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { isEmpty } from "lodash";

import {
	Button,
	Grid,
	Stack,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useUnsavedChangesWarning } from "@hooks/useUnsavedChangesWarning";
import { getLocation } from "@queries/getLocation";
import { deleteLocationQuery } from "@mutations/deleteLocation";
import { getILS } from "@helpers/getILS";
import { getLocalId } from "@helpers/getLocalId";
import { formatChangedFields } from "@helpers/formatChangedFields";
import {
	handleCancel,
	handleDeleteEntity,
	handleEdit,
	handleSaveConfirmation,
} from "@helpers/actions/editAndDeleteActions";
import { Location } from "@models/Location";
import { updateLocationQuery } from "@mutations/updateLocation";

interface LocationFormFields {
	name: string;
	printLabel?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	localId?: string | null;
}

export const Route = createFileRoute("/__authenticated/locations/$locationId")({
	component: LocationDetails,
});

function LocationDetails() {
	const { t } = useTranslation();
	const router = useRouter();
	const { locationId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const firstEditableFieldRef = useRef<HTMLInputElement>(null);
	const saveButtonRef = useRef<HTMLButtonElement>(null);

	const [editMode, setEditMode] = useState(false);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [showConfirmationPickup, setConfirmationPickup] = useState(false);
	const [showConfirmationPickupAnywhere, setConfirmationPickupAnywhere] =
		useState(false);
	const [changedFields, setChangedFields] = useState<
		Partial<LocationFormFields>
	>({});
	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error" | "warning";
		text: string | null;
		title: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const { data, isLoading, error } = useQuery({
		queryKey: ["location", locationId],
		queryFn: () =>
			gqlClient.request<any>(getLocation, { query: `id:${locationId}` }),
		enabled: !!locationId,
		refetchInterval: 120000,
	});

	const location: Location = data?.locations?.content?.[0];
	const ils = getILS(location?.hostSystem?.lmsClientClass);

	const validationSchema = Yup.object().shape({
		name: Yup.string()
			.trim()
			.nonNullable(t("ui.validation.locations.name"))
			.required(t("ui.validation.locations.name"))
			.max(255, t("ui.validation.max_length", { length: 255 })),
		printLabel: Yup.string()
			.nullable()
			.trim()
			.max(128, t("ui.validation.max_length", { length: 128 })),
		latitude: Yup.number()
			.nullable()
			.transform((value, originalValue) =>
				originalValue === "" ? null : value,
			)
			.test(
				"sixDecimalPlaceLimit",
				t("ui.validation.locations.lat"),
				(val) => val == null || /^-?\d+(\.\d{1,5})?$/.test(String(val)),
			)
			.min(-90, t("ui.validation.locations.lat"))
			.max(90, t("ui.validation.locations.lat")),
		longitude: Yup.number()
			.nullable()
			.transform((value, originalValue) =>
				originalValue === "" ? null : value,
			)
			.test(
				"sixDecimalPlaceLimit",
				t("ui.validation.locations.long"),
				(val) => val == null || /^-?\d+(\.\d{1,5})?$/.test(String(val)),
			)
			.min(-180, t("ui.validation.locations.long"))
			.max(180, t("ui.validation.locations.long")),
		localId: Yup.string()
			.nullable()
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
						.matches(/^\d+$/, t("ui.validation.locations.local_id_polaris")),
			}),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<LocationFormFields>({
		resolver: yupResolver(validationSchema),
		mode: "onChange",
		context: { ils },
		values: {
			name: location?.name ?? "",
			printLabel: location?.printLabel ?? "",
			latitude: location?.latitude
				? Number(Number(location.latitude).toFixed(5))
				: null,
			longitude: location?.longitude
				? Number(Number(location.longitude).toFixed(5))
				: null,
			localId: location?.localId ?? "",
		},
	});

	const { mutateAsync: updateLocation } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(updateLocationQuery, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["location", locationId] }),
	});

	const { mutateAsync: deleteLocation } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLocationQuery, variables),
	});

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning(isDirty);

	const onSubmit = (formData: LocationFormFields) => {
		const newChangedFields = Object.keys(formData).reduce((acc, key) => {
			const field = key as keyof LocationFormFields;
			if (
				formData[field] !== location[field] &&
				formData[field] !== undefined
			) {
				(acc[field] as any) = formData[field];
			}
			return acc;
		}, {} as Partial<LocationFormFields>);

		setChangedFields(newChangedFields);
		if (Object.keys(newChangedFields).length === 0) {
			setEditMode(false);
			return;
		}
		setConfirmationEdit(true);
	};

	const handleStatusToggle = async (
		field: "isPickup" | "isEnabledForPickupAnywhere",
		action: "enable" | "disable",
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		const isEnabled = action === "enable";
		try {
			await updateLocation({
				input: {
					id: location.id,
					[field]: isEnabled,
					reason,
					changeCategory,
					changeReferenceUrl,
				},
			});
			setAlert({
				open: true,
				severity: "success",
				text: t(
					`details.location_${field === "isPickup" ? "pickup" : "pickup_anywhere"}_${isEnabled ? "enable" : "disable"}_success`,
					{ location: location.name },
				),
				title: t("ui.data_grid.updated"),
			});
		} catch {
			setAlert({
				open: true,
				severity: "error",
				text: t(
					`details.location_${field === "isPickup" ? "pickup" : "pickup_anywhere"}_error_${isEnabled ? "enable" : "disable"}`,
					{ location: location.name },
				),
				title: t("ui.data_grid.error"),
			});
		} finally {
			field === "isPickup"
				? setConfirmationPickup(false)
				: setConfirmationPickupAnywhere(false);
		}
	};

	if (isLoading)
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("locations.location_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	if (error || !location)
		return (
			<PageContainer hideBreadcrumbs>
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					action={t("ui.action.go_back")}
					goBack="/locations"
					message="locations.error" //** TODO */
				/>
			</PageContainer>
		);

	const viewModeActions = [
		{
			key: "edit",
			onClick: handleEdit(setEditMode, firstEditableFieldRef),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.edit"),
			startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
		},
		{
			key: "delete",
			onClick: () => setConfirmationDeletion(true),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.delete_entity", {
				entity: t("locations.location_one").toLowerCase(),
			}),
			startIcon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
		},
	];

	const editModeActions = [
		<Button
			key="save"
			startIcon={<Save />}
			onClick={handleSubmit(onSubmit)}
			disabled={!isEmpty(errors) || !isDirty}
			ref={saveButtonRef}
		>
			{t("ui.data_grid.save")}
		</Button>,
		<Button
			key="cancel"
			startIcon={<Cancel />}
			onClick={() => handleCancel({ setEditMode, setChangedFields }, reset)}
		>
			{t("ui.data_grid.cancel")}
		</Button>,
		<MoreActionsMenu
			key="more"
			actions={[
				{
					key: "delete",
					onClick: () => setConfirmationDeletion(true),
					disabled: !isAnAdmin,
					label: t("ui.data_grid.delete_entity", {
						entity: t("locations.location_one").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
			]}
		/>,
	];

	return (
		<PageContainer
			title={location.name}
			pageActions={editMode ? editModeActions : viewModeActions}
			mode={editMode ? "edit" : "view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.name ? "error" : "primary.attributeTitle"}
						>
							{t("details.location_name")}
						</Typography>
						<Controller
							name="name"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										inputRef={firstEditableFieldRef}
										fullWidth
										error={!!errors.name}
										helperText={errors.name?.message}
									/>
								) : (
									<RenderAttribute attribute={location.name} />
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.printLabel ? "error" : "primary.attributeTitle"}
						>
							{t("details.location_printlabel")}
						</Typography>
						<Controller
							name="printLabel"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.printLabel}
										helperText={errors.printLabel?.message}
									/>
								) : (
									<RenderAttribute attribute={location.printLabel} />
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.localId ? "error" : "primary.attributeTitle"}
						>
							{t(getLocalId(ils))}
						</Typography>
						<Controller
							name="localId"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.localId}
										helperText={errors.localId?.message}
									/>
								) : (
									<RenderAttribute attribute={location.localId} />
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.latitude ? "error" : "primary.attributeTitle"}
						>
							{t("details.lat")}
						</Typography>
						<Controller
							name="latitude"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.latitude}
										helperText={errors.latitude?.message}
									/>
								) : (
									<RenderAttribute
										attribute={location.latitude}
										type="number"
									/>
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.longitude ? "error" : "primary.attributeTitle"}
						>
							{t("details.long")}
						</Typography>
						<Controller
							name="longitude"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.longitude}
										helperText={errors.longitude?.message}
									/>
								) : (
									<RenderAttribute
										attribute={location.longitude}
										type="number"
									/>
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("locations.new.pickup_status")}
						</Typography>
						<Typography>
							{location.isPickup
								? t("locations.new.pickup_enabled")
								: t("locations.new.pickup_disabled")}
						</Typography>
					</Stack>
					{isAnAdmin && (
						<Button
							onClick={() => setConfirmationPickup(true)}
							variant="outlined"
							sx={{ mt: 1 }}
						>
							{location.isPickup
								? t("details.location_pickup_disable")
								: t("details.location_pickup_enable")}
						</Button>
					)}
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("locations.new.pickup_anywhere_status")}
						</Typography>
						<Typography>
							{location.isEnabledForPickupAnywhere
								? t("locations.new.pickup_anywhere_enabled")
								: t("locations.new.pickup_anywhere_disabled")}
						</Typography>
					</Stack>
					{isAnAdmin && (
						<Button
							onClick={() => setConfirmationPickupAnywhere(true)}
							variant="outlined"
							sx={{ mt: 1 }}
						>
							{location.isEnabledForPickupAnywhere
								? t("details.location_pickup_anywhere_disable")
								: t("details.location_pickup_anywhere_enable")}
						</Button>
					)}
				</Grid>
			</Grid>

			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(r, c, u) => {
					handleDeleteEntity(
						location.id,
						r,
						c,
						u,
						setAlert,
						deleteLocation,
						t,
						router,
						location.name,
						"deleteLocation",
						"/locations",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={location.name}
			/>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={(r, c, u) =>
					handleSaveConfirmation(
						location.id,
						changedFields,
						updateLocation,
						queryClient as any,
						{
							setEditMode,
							setChangedFields,
							setAlert,
							setConfirmation: setConfirmationEdit,
						},
						{
							entityName: location.name,
							entityType: t("locations.location_one"),
							mutationName: "updateLocation",
							t,
						},
						{ reason: r, changeCategory: c, changeReferenceUrl: u },
						["location", locationId],
						reset,
						["name", "printLabel", "latitude", "longitude", "localId"],
					)
				}
				action="gridEdit"
				editInformation={formatChangedFields(changedFields, location)}
				entityName={location.name}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				action="unsaved"
				entityName={location.name}
			/>
			<Confirmation
				open={showConfirmationPickup}
				onClose={() => setConfirmationPickup(false)}
				onConfirm={(r, c, u) =>
					handleStatusToggle(
						"isPickup",
						location.isPickup ? "disable" : "enable",
						r,
						c,
						u,
					)
				}
				action="gridEdit"
				entityName={location.name}
			/>
			<Confirmation
				open={showConfirmationPickupAnywhere}
				onClose={() => setConfirmationPickupAnywhere(false)}
				onConfirm={(r, c, u) =>
					handleStatusToggle(
						"isEnabledForPickupAnywhere",
						location.isEnabledForPickupAnywhere ? "disable" : "enable",
						r,
						c,
						u,
					)
				}
				action="gridEdit"
				entityName={location.name}
			/>

			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</PageContainer>
	);
}
