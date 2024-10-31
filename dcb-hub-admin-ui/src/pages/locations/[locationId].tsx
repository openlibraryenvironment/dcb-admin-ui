import { Button, Stack, Typography, useTheme } from "@mui/material";
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
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import EditableAttribute from "src/helpers/EditableAttribute/EditableAttribute";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";
import { adminOrConsortiumAdmin } from "src/constants/roles";

type LocationDetails = {
	locationId: string;
};
// Coming in, we know the ID. So we need to query our GraphQL server to get the associated data.

export default function LocationDetails({ locationId }: LocationDetails) {
	const { t } = useTranslation();
	const router = useRouter();
	const theme = useTheme();
	const firstEditableFieldRef = useRef<HTMLInputElement>(null);
	const [hasValidationError, setValidationError] = useState(false);
	const [isDirty, setDirty] = useState(false);
	const [errors, setErrors] = useState();

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
	const [editKey, setEditKey] = useState(0);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [showConfirmationPickup, setConfirmationPickup] = useState(false);
	const [editableFields, setEditableFields] = useState({
		latitude: location?.latitude,
		longitude: location?.longitude,
		name: location?.name,
	});
	const [changedFields, setChangedFields] = useState<Partial<Location>>({});

	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

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
		setEditableFields({
			latitude: location?.latitude,
			longitude: location?.longitude,
			name: location?.name,
		});
		setEditMode(true);
		setTimeout(() => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		}, 0);
	};

	const handleSave = () => {
		if (Object.keys(changedFields).length === 0) {
			setEditMode(false);
			return;
		}
		setConfirmationEdit(true);
	};

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning({
		isDirty,
		hasValidationError,
		onKeepEditing: () => {
			setTimeout(() => {
				if (saveButtonRef.current) {
					saveButtonRef.current.focus();
				}
			}, 0);
		},
		onLeaveWithoutSaving: () => {
			setDirty(false);
			setChangedFields({});
		},
	});

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

	const handleDeleteEntity = async (
		id: string,
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		try {
			const input = {
				id: id,
				reason: reason,
				changeCategory: changeCategory,
				changeReferenceUrl: changeReferenceUrl,
			};
			const { data } = await deleteLocation({
				variables: {
					input,
				},
			});
			if (data.deleteLocation.success == true) {
				setAlert({
					open: true,
					severity: "success",
					text: t("ui.data_grid.delete_success", {
						entity: t("locations.location_one").toLowerCase(),
						name: location?.name,
					}),
					title: t("ui.data_grid.deleted"),
				});
				console.log(data.deleteLocation);
				console.log("Entity deleted successfully");
				setTimeout(() => {
					router.push("/locations");
				}, 100);
			} else {
				console.log(data?.deleteLocation);
				console.log("Failed to delete entity");
				setAlert({
					open: true,
					severity: "error",
					text: t("ui.data_grid.delete_error", {
						entity: t("locations.location_one").toLowerCase(),
					}),
				});
			}
		} catch (error) {
			console.log(data?.deleteLocation);
			console.error("Error deleting entity:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.delete_error", {
					entity: t("locations.location_one").toLowerCase(),
				}),
			});
		}
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
				setEditMode(false);
				setChangedFields({});
				client.refetchQueries({
					include: ["LoadLocation"],
				});
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
		setEditableFields({
			name: location?.name,
			longitude: location?.longitude,
			latitude: location?.latitude,
		});
		setChangedFields({});
		setDirty(false);
		setValidationError(false);
		setEditKey((prevKey) => prevKey + 1);
	};

	const updateField = (
		field: keyof Location,
		value: string | number | null,
	) => {
		setEditableFields((prev) => ({
			...prev,
			[field]: value,
		}));

		if (value !== location[field]) {
			setChangedFields((prev) => ({
				...prev,
				[field]: value,
			}));
		} else {
			setChangedFields((prev) => {
				const newChangedFields = { ...prev };
				delete newChangedFields[field];
				return newChangedFields;
			});
		}
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
			onClick={handleSave}
			disabled={hasValidationError || !isDirty}
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
			<AdminLayout>
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
					title={t("ui.error.record_not_found")}
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
			>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["name"] && editMode
									? theme.palette.error.main
									: theme.palette.common.black
							}
						>
							{t("details.location_name")}
						</Typography>
						<EditableAttribute
							field="name"
							key={`name-${editKey}`}
							value={editableFields.name ?? location?.name}
							updateField={updateField}
							editMode={editMode}
							type="string"
							inputRef={firstEditableFieldRef}
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
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
							{t("details.location_uuid")}
						</Typography>
						<RenderAttribute attribute={location?.id} />
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
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["latitude"] && editMode
									? theme.palette.error.main
									: theme.palette.common.black
							}
						>
							{t("details.lat")}
						</Typography>
						<EditableAttribute
							field="latitude"
							key={`latitude-${editKey}`}
							value={editableFields.latitude ?? location?.latitude}
							updateField={updateField}
							editMode={editMode}
							type="latitude"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["longitude"] && editMode
									? theme.palette.error.main
									: theme.palette.common.black
							}
						>
							{t("details.long")}
						</Typography>
						<EditableAttribute
							field="longitude"
							key={`longitude-${editKey}`}
							value={editableFields.longitude ?? location?.longitude}
							updateField={updateField}
							editMode={editMode}
							type="longitude"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
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
							{t("details.location_pickup")}
						</Typography>
						{location?.isPickup
							? t("details.location_pickup_enabled")
							: location?.isPickup == false
								? t("details.location_pickup_disabled")
								: t("details.locaion_pickup_not_set")}
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
					);
					setConfirmationDeletion(false);
				}}
				type={"deletelocations"}
				library={location?.name}
				entityId={location?.id}
			/>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={handleConfirmSave}
				type="pageEdit"
				editInformation={formatChangedFields(changedFields, location)}
				library={location?.name}
				entity={t("locations.location_one")}
				entityId={location?.id}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				type="unsavedChanges"
				library={location?.name}
				entity={t("locations.location_one")}
				entityId={location?.id}
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
				library={location?.name}
				code={location?.code}
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
