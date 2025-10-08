import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
	Button,
	Divider,
	Grid,
	Stack,
	Tab,
	Tabs,
	TextField,
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
import * as Yup from "yup";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import {
	closeConfirmation,
	handleCancel,
	handleDeleteEntity,
	handleEdit,
	handleSaveConfirmation,
} from "src/helpers/actions/editAndDeleteActions";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { isEmpty } from "lodash";
import { getILS } from "src/helpers/getILS";

type LibraryDetails = {
	libraryId: any;
};

interface LibraryFormFields {
	fullName: string;
	shortName: string;
	abbreviatedName: string;
	backupDowntimeSchedule?: string;
	supportHours?: string;
	latitude?: number;
	longitude?: number;
}

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
		errorPolicy: "all",
		onCompleted: (data) => {
			const library = data?.libraries?.content?.[0];
			// This is needed because default values don't always load in time.
			reset({
				fullName: library?.fullName ?? "",
				shortName: library?.shortName ?? "",
				abbreviatedName: library?.abbreviatedName ?? "",
				backupDowntimeSchedule: library?.backupDowntimeSchedule ?? "",
				supportHours: library?.supportHours ?? "",
				latitude: library?.latitude,
				longitude: library?.longitude,
			});
		},
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
	const saveButtonRef = useRef<HTMLButtonElement>(null);

	const [editMode, setEditMode] = useState(false);

	const validationSchema = Yup.object().shape({
		fullName: Yup.string()
			.trim()
			.nonNullable(
				t("ui.data_grid.validation.no_empty", {
					field: t("libraries.full_name"),
				}),
			)
			.required(
				t("ui.validation.required", { field: t("libraries.full_name") }),
			)
			.max(200, t("ui.validation.max_length", { length: 200 })),
		shortName: Yup.string()
			.trim()
			.nonNullable(
				t("ui.data_grid.validation.no_empty", {
					field: t("libraries.short_name"),
				}),
			)
			.required(
				t("ui.validation.required", { field: t("libraries.short_name") }),
			)
			.max(100, t("ui.validation.max_length", { length: 100 })),
		abbreviatedName: Yup.string()
			.trim()
			.nonNullable(
				t("ui.data_grid.validation.no_empty", {
					field: t("libraries.abbreviated_name"),
				}),
			)
			.required(
				t("ui.validation.required", { field: t("libraries.abbreviated_name") }),
			)
			.max(32, t("ui.validation.max_length", { length: 32 })),
		backupDowntimeSchedule: Yup.string()
			.trim()
			.max(200, t("ui.validation.max_length", { length: 200 })),
		supportHours: Yup.string()
			.trim()
			.max(200, t("ui.validation.max_length", { length: 200 })),
		latitude: Yup.number()
			.typeError(t("ui.validation.locations.lat"))
			.min(-90, t("ui.validation.locations.lat"))
			.max(90, t("ui.validation.locations.lat")),
		longitude: Yup.number()
			.typeError(t("ui.validation.locations.long"))
			.min(-180, t("ui.validation.locations.long"))
			.max(180, t("ui.validation.locations.long")),
	});
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<LibraryFormFields>({
		defaultValues: {
			fullName: library?.fullName,
			shortName: library?.shortName,
			abbreviatedName: library?.abbreviatedName,
			backupDowntimeSchedule: library?.backupDowntimeSchedule,
			supportHours: library?.supportHours,
			latitude: library?.latitude,
			longitude: library?.longitude,
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	const handleConfirmSave = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		handleSaveConfirmation(
			library.id,
			changedFields,
			updateLibrary,
			client,
			{
				setEditMode,
				setChangedFields,
				setAlert,
				setConfirmation: setConfirmationEdit,
			},
			{
				entityName: library?.fullName,
				entityType: t("libraries.library"),
				mutationName: "updateLibrary",
				t,
			},
			{
				reason,
				changeCategory,
				changeReferenceUrl,
			},
			["LoadLibrary"],
			reset,
			[
				"fullName",
				"shortName",
				"abbreviatedName",
				"backupDowntimeSchedule",
				"supportHours",
				"latitude",
				"longitude",
			],
		);
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

	const onSubmit = (data: Partial<Library>) => {
		const newChangedFields = Object.keys(data).reduce((acc, key) => {
			const field = key as keyof LibraryFormFields;
			const currentValue = data[field];
			const originalValue = library[field];

			if (currentValue !== originalValue && currentValue !== undefined) {
				(acc[field] as typeof currentValue) = currentValue;
			}
			return acc;
		}, {} as Partial<Library>);
		setChangedFields(newChangedFields);
		if (Object.keys(newChangedFields).length === 0) {
			setEditMode(false);
			return;
		}
		setConfirmationEdit(true);
	};
	// Actions for the menu - in both view and edit mode.
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
				entity: t("libraries.library").toLowerCase(),
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
			onClick={() =>
				handleCancel(
					{
						setEditMode,
						setChangedFields,
					},
					reset,
				)
			}
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
						entity: t("libraries.library").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
				{
					key: "edit",
					onClick: () => handleEdit(setEditMode, firstEditableFieldRef),
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
				component={"form"}
				onSubmit={handleSubmit(onSubmit)}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
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
						<Tab label={t("nav.bibs")} />
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" fontWeight={"bold"}>
						{t("nav.libraries.profile")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="accordionSummary">
						{t("libraries.library")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.fullName
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.name")}
						</Typography>
						<Controller
							name="fullName"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										inputRef={firstEditableFieldRef}
										fullWidth
										variant="outlined"
										error={!!errors.fullName}
										helperText={errors.fullName?.message}
									/>
								) : (
									<RenderAttribute attribute={library?.fullName} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.shortName
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.short_name")}
						</Typography>
						<Controller
							name="shortName"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										variant="outlined"
										error={!!errors.shortName}
										helperText={errors.shortName?.message}
									/>
								) : (
									<RenderAttribute attribute={library?.shortName} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.abbreviatedName
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.abbreviated_name")}
						</Typography>
						<Controller
							name="abbreviatedName"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										variant="outlined"
										error={!!errors.abbreviatedName}
										helperText={errors.abbreviatedName?.message}
									/>
								) : (
									<RenderAttribute attribute={library?.abbreviatedName} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.type")}
						</Typography>
						<RenderAttribute attribute={library?.type} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_code")}
						</Typography>
						<RenderAttribute attribute={library?.agencyCode} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.library_management_system")}
						</Typography>
						<RenderAttribute
							attribute={
								library?.agency?.hostLms?.lmsClientClass
									? getILS(library?.agency?.hostLms?.lmsClientClass)
									: library?.agency?.hostLms?.lmsClientClass
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.supportHours
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.support_hours")}
						</Typography>
						<Controller
							name="supportHours"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										variant="outlined"
										error={!!errors.supportHours}
										helperText={errors.supportHours?.message}
									/>
								) : (
									<RenderAttribute attribute={library?.supportHours} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.backupDowntimeSchedule
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.service.environments.backup_schedule")}
						</Typography>
						<Controller
							name="backupDowntimeSchedule"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										variant="outlined"
										error={!!errors.backupDowntimeSchedule}
										helperText={errors.backupDowntimeSchedule?.message}
									/>
								) : (
									<RenderAttribute
										attribute={library?.backupDowntimeSchedule}
									/>
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
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
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.library_id")}
						</Typography>
						<RenderAttribute attribute={library?.id} />
					</Stack>
				</Grid>
				{/* /* 'Primary location' title goes here/* */}
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.primaryLocation.title")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.primaryLocation.address")}
						</Typography>
						{/* This will need address-specific handling, and possibly its own component - leave as placeholder until we're ready + open maps in new tab*/}
						<AddressLink address={library?.address} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.latitude
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.primaryLocation.latitude")}
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
									<RenderAttribute attribute={library?.latitude} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.longitude
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("libraries.primaryLocation.longitude")}
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
									<RenderAttribute attribute={library?.longitude} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
					<Divider aria-hidden="true"></Divider>
				</Grid>
				{isConsortiumGroupMember ? (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<Typography variant="h3" fontWeight={"bold"}>
							{t("consortium.title")}
						</Typography>
					</Grid>
				) : null}
				{isConsortiumGroupMember ? (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
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
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
					<Divider aria-hidden="true"></Divider>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.groups")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
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
