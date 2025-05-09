import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Grid from "@mui/material/Unstable_Grid2";
import {
	Button,
	Divider,
	Stack,
	Tab,
	Tabs,
	Typography,
	useTheme,
} from "@mui/material";
import { AdminLayout } from "@layout";
import { useState, useRef } from "react";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { ClientDataGrid } from "@components/ClientDataGrid";
import AddressLink from "@components/Address/AddressLink";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
	deleteLibraryQuery,
	getLibraryById,
	updateLibraryQuery,
} from "src/queries/queries";
import { Library } from "@models/Library";
import { findConsortium } from "src/helpers/findConsortium";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";

import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import EditableAttribute from "@components/EditableAttribute/EditableAttribute";

import { formatChangedFields } from "src/helpers/formatChangedFields";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";

type LibraryDetails = {
	libraryId: any;
};

export default function LibraryDetails({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();
	const firstEditableFieldRef = useRef<HTMLInputElement>(null);
	const theme = useTheme();
	const router = useRouter();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const client = useApolloClient();
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	const { data, loading, error } = useQuery(getLibraryById, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000, // pollInterval is in ms - set to 2 mins
	});
	const library: Library = data?.libraries?.content?.[0];
	const isConsortiumGroupMember: boolean =
		findConsortium(library?.membership) != null ? true : false;

	const libraryGroups = library?.membership.map(
		(member: { libraryGroup: any }) => member.libraryGroup,
	);

	const [deleteLibrary] = useMutation(deleteLibraryQuery);
	const [updateLibrary] = useMutation(updateLibraryQuery, {
		refetchQueries: ["LoadLibrary", "LoadLibraries"],
	});

	const [tabIndex, setTabIndex] = useState(0);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const [changedFields, setChangedFields] = useState<Partial<Library>>({});
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [hasValidationError, setValidationError] = useState(false);
	const [isDirty, setDirty] = useState(false);
	const [errors, setErrors] = useState();
	const [editMode, setEditMode] = useState(false);
	const [editKey, setEditKey] = useState(0);
	const [editableFields, setEditableFields] = useState({
		backupDowntimeSchedule: library?.backupDowntimeSchedule,
		supportHours: library?.supportHours,
		latitude: library?.latitude,
		longitude: library?.longitude,
		fullName: library?.fullName,
		shortName: library?.shortName,
		abbreviatedName: library?.abbreviatedName,
	});

	const handleSave = () => {
		if (Object.keys(changedFields).length === 0) {
			setEditMode(false);
			return;
		}
		setConfirmationEdit(true);
	};
	const handleCancel = () => {
		setEditMode(false);
		setEditableFields({
			backupDowntimeSchedule: library?.backupDowntimeSchedule,
			supportHours: library?.supportHours,
			latitude: library?.latitude,
			longitude: library?.longitude,
			fullName: library?.fullName,
			shortName: library?.shortName,
			abbreviatedName: library?.abbreviatedName,
		});
		setChangedFields({});
		setDirty(false);
		setValidationError(false);
		setEditKey((prevKey) => prevKey + 1); // This will change the keys of all EditableAttributes
		// Thus re-setting their states on cancel.
	};

	const handleConfirmSave = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		try {
			const { data } = await updateLibrary({
				variables: {
					input: {
						id: library.id,
						...changedFields,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
			});

			if (data.updateLibrary) {
				setEditMode(false);
				setChangedFields({});
				setDirty(false);
				client.refetchQueries({
					include: ["LoadLibrary"],
				});
				setAlert({
					open: true,
					severity: "success",
					text: t("ui.data_grid.edit_success", {
						entity: t("libraries.library").toLowerCase(),
						name: library?.fullName,
					}),
					title: t("ui.data_grid.updated"),
				});
			}
		} catch (error) {
			console.error("Error updating library:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.edit_error", {
					entity: t("libraries.library").toLowerCase(),
					name: library?.fullName,
				}),
				title: t("ui.data_grid.updated"),
			});
		} finally {
			setConfirmationEdit(false);
		}
	};

	const handleEdit = () => {
		setEditableFields({
			backupDowntimeSchedule: library?.backupDowntimeSchedule,
			supportHours: library?.supportHours,
			latitude: library?.latitude,
			longitude: library?.longitude,
			fullName: library?.fullName,
			abbreviatedName: library?.abbreviatedName,
			shortName: library?.shortName,
		});
		setEditMode(true);
		setTimeout(() => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		}, 0);
	};
	const updateField = (field: keyof Library, value: string | number | null) => {
		setEditableFields((prev) => ({
			...prev,
			[field]: value,
		}));
		if (value !== library[field]) {
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

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning({
		isDirty,
		hasValidationError,
		onKeepEditing: () => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		},
		onLeaveWithoutSaving: () => {
			setDirty(false);
			setChangedFields({});
		},
	});

	// Actions for the menu - in both view and edit mode.
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
				entity: t("libraries.library").toLowerCase(),
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
						entity: t("libraries.library").toLowerCase(),
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

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("libraries.library").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || library == null || library == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout
			title={library?.fullName}
			pageActions={pageActions}
			mode={editMode ? "edit" : "view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid xs={4} sm={8} md={12}>
					<Tabs
						value={tabIndex}
						onChange={(event, value) => {
							handleTabChange(event, value, router, setTabIndex, libraryId);
						}}
						aria-label="Library navigation"
					>
						<Tab label={t("nav.libraries.profile")} />
						<Tab label={t("nav.libraries.service")} />
						<Tab label={t("nav.libraries.settings")} />
						<Tab label={t("nav.mappings.name")} />
						<Tab label={t("nav.libraries.patronRequests.name")} />
						<Tab label={t("nav.libraries.supplierRequests.name")} />
						<Tab label={t("nav.libraries.contacts")} />
						<Tab label={t("nav.locations")} />
					</Tabs>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="accordionSummary">
						{t("libraries.library")}
					</Typography>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["fullName"] && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.name")}
						</Typography>
						<EditableAttribute
							field="fullName"
							value={library?.fullName}
							updateField={updateField}
							editMode={editMode}
							type="nonBlankString"
							inputRef={firstEditableFieldRef}
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
							key={`fullName-${editKey}`}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["shortName"] && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.short_name")}
						</Typography>
						<EditableAttribute
							field="shortName"
							value={library?.shortName}
							updateField={updateField}
							editMode={editMode}
							type="nonBlankString"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
							key={`shortName-${editKey}`}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["abbreviatedName"] && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.abbreviated_name")}
						</Typography>
						<EditableAttribute
							field="abbreviatedName"
							value={library?.abbreviatedName}
							updateField={updateField}
							editMode={editMode}
							type="nonBlankString"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
							key={`abbreviatedName-${editKey}`}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.type")}
						</Typography>
						<RenderAttribute attribute={library?.type} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_code")}
						</Typography>
						<RenderAttribute attribute={library?.agencyCode} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["supportHours"] && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.support_hours")}
						</Typography>
						<EditableAttribute
							field="supportHours"
							value={editableFields.supportHours ?? library?.supportHours}
							updateField={updateField}
							editMode={editMode}
							type="string"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
							key={`supportHours-${editKey}`}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["backupDowntimeSchedule"] && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.service.environments.backup_schedule")}
						</Typography>
						<EditableAttribute
							field="backupDowntimeSchedule"
							value={
								editableFields.backupDowntimeSchedule ??
								library?.backupDowntimeSchedule
							}
							updateField={updateField}
							editMode={editMode}
							type="string"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
							key={`backupDowntimeSchedule-${editKey}`}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.site_designation")}
						</Typography>
						{/* This may need special handling when we have real data and know what format it's coming in */}
						<RenderAttribute
							attribute={
								library?.agency?.hostLms?.clientConfig?.contextHierarchy[0]
							}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.library_id")}
						</Typography>
						<RenderAttribute attribute={library?.id} />
					</Stack>
				</Grid>
				{/* /* 'Primary location' title goes here/* */}
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.primaryLocation.title")}
					</Typography>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.primaryLocation.address")}
						</Typography>
						{/* This will need address-specific handling, and possibly its own component - leave as placeholder until we're ready + open maps in new tab*/}
						<AddressLink address={library?.address} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["latitude"] && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.primaryLocation.latitude")}
						</Typography>
						<EditableAttribute
							field="latitude"
							value={editableFields.latitude ?? library?.latitude}
							updateField={updateField}
							editMode={editMode}
							type="latitude"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
							key={`latitude-${editKey}`}
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
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.primaryLocation.longitude")}
						</Typography>
						<EditableAttribute
							field="longitude"
							value={editableFields.longitude ?? library?.longitude}
							updateField={updateField}
							editMode={editMode}
							type="longitude"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
							key={`longitude-${editKey}`}
						/>
					</Stack>
				</Grid>
				<Grid xs={4} sm={8} md={12} lg={16}>
					<Divider aria-hidden="true"></Divider>
				</Grid>
				{isConsortiumGroupMember ? (
					<Grid xs={4} sm={8} md={12}>
						<Typography variant="h3" fontWeight={"bold"}>
							{t("consortium.title")}
						</Typography>
					</Grid>
				) : null}
				{isConsortiumGroupMember ? (
					<Grid xs={4} sm={8} md={12}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("consortium.name")}
							</Typography>
							<RenderAttribute
								attribute={findConsortium(library?.membership)?.name}
							/>
						</Stack>
					</Grid>
				) : null}
				<Grid xs={4} sm={8} md={12} lg={16}>
					<Divider aria-hidden="true"></Divider>
				</Grid>
				<Grid xs={4} sm={8} md={12} lg={16}>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.groups")}
					</Typography>
				</Grid>
				<Grid xs={4} sm={8} md={12} lg={16}>
					<ClientDataGrid
						columns={[
							{
								field: "name",
								headerName: t("groups.name"),
								minWidth: 100,
								flex: 1,
							},
							{
								field: "code",
								headerName: t("groups.code"),
								minWidth: 50,
								flex: 0.5,
							},
							{
								field: "type",
								headerName: t("groups.type"),
								minWidth: 50,
								flex: 0.5,
							},
						]}
						data={libraryGroups}
						type="groupsOfLibrary"
						coreType="LibraryGroup"
						selectable={false}
						noDataTitle={t("groups.none_for_library")}
						toolbarVisible="not-visible"
						sortModel={[{ field: "name", sort: "asc" }]}
						operationDataType="Group"
						disableAggregation={true}
						disableRowGrouping={true}
					/>
				</Grid>
			</Grid>

			{/* // One alert for all things */}
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title}
			/>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() =>
					closeConfirmation(setConfirmationDeletion, client, "LoadLibrary")
				}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					handleDeleteEntity(
						library.id,
						reason,
						changeCategory,
						changeReferenceUrl,
						setAlert,
						deleteLibrary,
						t,
						router,
						library?.fullName ?? "",
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				type={"deletelibraries"}
				entityName={library?.fullName}
				entity={t("libraries.library")}
				gridEdit={false}
			/>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() =>
					closeConfirmation(setConfirmationEdit, client, "LoadLibrary")
				}
				onConfirm={handleConfirmSave}
				type="pageEdit"
				editInformation={formatChangedFields(changedFields, library)}
				entityName={library?.fullName}
				entity={t("libraries.library")}
				gridEdit={false}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				type="unsavedChanges"
				entityName={library?.fullName}
				entity={t("libraries.library")}
				entityId={library?.id}
				gridEdit={false}
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
	const libraryId = ctx.params.libraryId;
	return {
		props: {
			libraryId,
			...translations,
		},
	};
}
