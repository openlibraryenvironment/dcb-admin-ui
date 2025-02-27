import { Button, Stack, TextField, Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import {
	deleteLocationQuery,
	getLocationById,
	updateLocationQuery,
} from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Location } from "@models/Location";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import { handleDeleteEntity } from "src/helpers/actions/editAndDeleteActions";
import { getILS } from "src/helpers/getILS";
import { getLocalId } from "src/helpers/getLocalId";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as Yup from "yup";
import { isEmpty } from "lodash";

type LocationDetails = {
	locationId: string;
};
// Coming in, we know the ID. So we need to query our GraphQL server to get the associated data.
interface LocationFormFields {
	name: string;
	printLabel?: string;
	latitude?: number;
	longitude?: number;
	localId?: string;
}
// Needs a parser and the decimal logic extending to the data change log also.
export default function LocationDetails({ locationId }: LocationDetails) {
	const { t } = useTranslation();
	const router = useRouter();
	const theme = useTheme();
	const firstEditableFieldRef = useRef<HTMLInputElement>(null);

	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	// Poll interval in ms
	const { loading, data, error } = useQuery(getLocationById, {
		variables: {
			query: "id:" + locationId,
		},
		pollInterval: 120000,
		onCompleted: (data) => {
			const location = data?.locations?.content?.[0];
			// This is needed because default values don't always load in time.
			reset({
				name: location?.name ?? "",
				printLabel: location?.printLabel ?? "",
				latitude: Number(Number(location?.latitude).toFixed(5)),
				longitude: Number(Number(location?.longitude).toFixed(5)),
				localId: location?.localId ?? "",
			});
		},
	});

	const location: Location = data?.locations?.content?.[0];
	const client = useApolloClient();
	const saveButtonRef = useRef<HTMLButtonElement>(null);

	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const [editMode, setEditMode] = useState(false);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [showConfirmationPickup, setConfirmationPickup] = useState(false);

	const [changedFields, setChangedFields] = useState<Partial<Location>>({});
	const ils = getILS(location?.hostSystem?.lmsClientClass);

	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	const validationSchema = Yup.object().shape({
		name: Yup.string()
			.trim()
			.nonNullable(t("ui.validation.locations.name"))
			.required(t("ui.validation.locations.name"))
			.max(255, t("ui.validation.max_length", { length: 255 })),
		printLabel: Yup.string()
			.trim()
			.max(128, t("ui.validation.max_length", { length: 128 })),
		latitude: Yup.number()
			.test(
				"sixDecimalPlaceLimit",
				t("ui.validation.locations.lat"),
				(latitude) => /^-?\d+(\.\d{1,5})?$/.test(String(latitude)),
				// ideally this would be clever enough to take the sign into account
			)
			.transform((value, originalValue) =>
				originalValue === "" ? null : value,
			)
			.nonNullable(t("ui.validation.locations.lat"))
			.typeError(t("ui.validation.locations.lat"))
			.min(-90, t("ui.validation.locations.lat"))
			.max(90, t("ui.validation.locations.lat")),
		// Needs validation now to prevent more than 6dp
		// As DB can't handle it
		longitude: Yup.number()
			.test(
				"sixDecimalPlaceLimit",
				t("ui.validation.locations.long"),
				(longitude) => /^-?\d+(\.\d{1,5})?$/.test(String(longitude)),
			)
			.transform((value, originalValue) =>
				originalValue === "" ? null : value,
			)
			.nonNullable(t("ui.validation.locations.long"))
			.typeError(t("ui.validation.locations.long"))
			.min(-180, t("ui.validation.locations.long"))
			.max(180, t("ui.validation.locations.long")),
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
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<LocationFormFields>({
		defaultValues: {
			name: location?.name,
			printLabel: location?.printLabel,
			latitude: Number(Number(location?.latitude).toFixed(5)),
			longitude: Number(Number(location?.longitude).toFixed(5)),
			localId: location?.localId,
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
		context: { ils: ils },
	});

	const [updateLocation] = useMutation(updateLocationQuery, {
		refetchQueries: ["LoadLocation", "LoadLocations"],
	});
	const [deleteLocation] = useMutation(deleteLocationQuery, {
		refetchQueries: ["LoadLocations"],
	});

	const closeConfirmation = () => {
		setConfirmationPickup(false);
		// This refetches the LoadLibrary query to ensure we're up-to-date after confirmation.
		client.refetchQueries({
			include: ["LoadLocation"],
		});
	};

	const handleEdit = () => {
		setEditMode(true);
		setTimeout(() => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		}, 0);
	};

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning({
		isDirty,
		onKeepEditing: () => {
			setTimeout(() => {
				if (saveButtonRef.current) {
					saveButtonRef.current.focus();
				}
			}, 0);
		},
		onLeaveWithoutSaving: () => {
			setChangedFields({});
			reset();
		},
	});

	const onSubmit = (data: Partial<Location>) => {
		const newChangedFields = Object.keys(data).reduce((acc, key) => {
			const field = key as keyof LocationFormFields;
			const currentValue = data[field];
			const originalValue = location[field];

			if (currentValue !== originalValue && currentValue !== undefined) {
				if (
					Number(Number(originalValue).toFixed(5)) == currentValue &&
					(field == "latitude" || field == "longitude")
				) {
					return acc;
				}
				(acc[field] as typeof currentValue) = currentValue;
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

	const handlePickupConfirmation = (
		pickup: string,
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		const input = {
			id: location?.id,
			isPickup: pickup === "enablePickup" ? true : false,
			reason: reason,
			changeCategory: changeCategory,
			changeReferenceUrl: changeReferenceUrl,
		};
		updateLocation({
			variables: {
				input,
			},
		}).then((response) => {
			if (response.data) {
				setAlert({
					open: true,
					severity: "success",
					text:
						pickup == "disablePickup"
							? t("details.location_pickup_disable_success", {
									location: location?.name,
								})
							: t("details.location_pickup_enable_success", {
									location: location?.name,
								}),
					title: t("ui.data_grid.updated"),
				});
				closeConfirmation();
			} else {
				setAlert({
					open: true,
					severity: "error",
					text:
						pickup == "disablePickup"
							? t("details.location_pickup_error_disable", {
									location: location?.name,
								})
							: t("details.location_pickup_error_enable", {
									location: location?.name,
								}),
					title: t("ui.data_grid.error"),
				});
				closeConfirmation();
			}
		});
	};

	const handleConfirmSave = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		try {
			const { data } = await updateLocation({
				variables: {
					input: {
						id: location.id,
						...changedFields,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
			});
			if (data.updateLocation) {
				setChangedFields({});
				setEditMode(false);
				await client.refetchQueries({
					include: ["LoadLocation"],
				});
				// Reset the form with the latest data
				// Otherwise react-hook-form may believe it's still dirty
				// And unsaved changes warning will pop up
				const location = data.updateLocation;
				reset(
					{
						name: location?.name ?? "",
						printLabel: location?.printLabel ?? "",
						latitude: Number(Number(location?.latitude).toFixed(5)),
						longitude: Number(Number(location?.longitude).toFixed(5)),
						localId: location?.localId,
					},
					{ keepValues: false },
				);
				setAlert({
					open: true,
					severity: "success",
					text: t("ui.data_grid.edit_success", {
						entity: t("locations.location_one"),
						name: location?.name,
					}),
					title: t("ui.data_grid.updated"),
				});
			}
		} catch (error) {
			console.error("Error updating location:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.edit_error", {
					entity: t("locations.location_one"),
					name: location?.name,
				}),
				title: t("ui.data_grid.updated"),
			});
		} finally {
			setConfirmationEdit(false);
		}
	};

	const handleCancel = () => {
		setEditMode(false);
		setChangedFields({});
		reset();
	};

	const viewModeActions = [
		{
			key: "edit",
			onClick: handleEdit,
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
		<Button key="cancel" startIcon={<Cancel />} onClick={handleCancel}>
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
				{
					key: "edit",
					onClick: handleEdit,
					disabled: true,
					label: t("ui.data_grid.edit"),
					startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
				},
			]}
		/>,
	];

	const pageActions = editMode ? editModeActions : viewModeActions;

	// If GraphQL is loading or session fetching is loading
	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("locations.location_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}
	return error || location == null || location == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/locations"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/locations"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout
			title={location?.name}
			pageActions={pageActions}
			mode={editMode ? "edit" : "view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
				component={"form"}
				onSubmit={handleSubmit(onSubmit)}
			>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={
								errors.name
									? theme.palette.error.main
									: theme.palette.common.black
							}
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
										variant="outlined"
										error={!!errors.name}
										helperText={errors.name?.message}
									/>
								) : (
									<RenderAttribute attribute={location?.name} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={
								errors.printLabel
									? theme.palette.error.main
									: theme.palette.common.black
							}
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
										variant="outlined"
										error={!!errors.printLabel}
										helperText={errors.printLabel?.message}
									/>
								) : (
									<RenderAttribute attribute={location?.printLabel} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_code")}
						</Typography>
						<RenderAttribute attribute={location?.code} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_type")}
						</Typography>
						<RenderAttribute attribute={location?.type} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={
								errors.latitude
									? theme.palette.error.main
									: theme.palette.common.black
							}
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
										variant="outlined"
										error={!!errors.latitude}
										helperText={errors.latitude?.message}
									/>
								) : (
									<RenderAttribute
										attribute={location?.latitude}
										type="number"
									/>
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={
								errors.longitude
									? theme.palette.error.main
									: theme.palette.common.black
							}
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
										variant="outlined"
										error={!!errors.longitude}
										helperText={errors.longitude?.message}
									/>
								) : (
									<RenderAttribute
										attribute={location?.longitude}
										type="number"
									/>
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("locations.new.pickup_status")}
						</Typography>
						{location?.isPickup
							? t("locations.new.pickup_enabled")
							: location?.isPickup == false
								? t("locations.new.pickup_disabled")
								: t("details.location_pickup_not_set")}
					</Stack>
					{isAnAdmin ? (
						<Button
							onClick={() => setConfirmationPickup(true)}
							color="primary"
							variant="outlined"
							sx={{ marginTop: 1 }}
							type="submit"
						>
							{location?.isPickup
								? t("details.location_pickup_disable")
								: t("details.location_pickup_enable")}
						</Button>
					) : null}
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={
								errors.localId
									? theme.palette.error.main
									: theme.palette.common.black
							}
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
										variant="outlined"
										fullWidth
										required={ils == "Sierra" ? false : true}
										error={!!errors.localId}
										helperText={errors.localId?.message}
									/>
								) : (
									<RenderAttribute attribute={location?.localId} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_agency")}
						</Typography>
						<RenderAttribute attribute={location?.agency?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_uuid")}
						</Typography>
						<RenderAttribute attribute={location?.id} />
					</Stack>
				</Grid>
			</Grid>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					handleDeleteEntity(
						location.id,
						reason,
						changeCategory,
						changeReferenceUrl,
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
				type={"deletelocations"}
				entityName={location?.name}
				entityId={location?.id}
				entity={t("locations.location_one")}
				gridEdit={false}
			/>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={handleConfirmSave}
				type="pageEdit"
				editInformation={formatChangedFields(changedFields, location)}
				entityName={location?.name}
				entity={t("locations.location_one")}
				entityId={location?.id}
				gridEdit={false}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				type="unsavedChanges"
				entityName={location?.name}
				entity={t("locations.location_one")}
				entityId={location?.id}
				gridEdit={false}
			/>
			<Confirmation
				open={showConfirmationPickup}
				onClose={() => closeConfirmation()}
				onConfirm={(reason, changeCategory, changeReferenceUrl) =>
					handlePickupConfirmation(
						location?.isPickup ? "disablePickup" : "enablePickup",
						reason,
						changeCategory,
						changeReferenceUrl,
					)
				}
				type="pickup"
				participation={location?.isPickup ? "disablePickup" : "enablePickup"}
				entityName={location?.name}
				entity={t("locations.location_one")}
				code={location?.code}
				gridEdit={false}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				entity={t("locations.location_one")}
				alertTitle={alert.title}
			/>
		</AdminLayout>
	);
}

export async function getServerSideProps(ctx: any) {
	const { locale } = ctx;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	const locationId = ctx.params.locationId;
	return {
		props: {
			locationId,
			...translations,
		},
	};
}
