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
	Divider,
	Grid,
	Stack,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import AddressLink from "@components/Address/AddressLink";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useUnsavedChangesWarning } from "@hooks/useUnsavedChangesWarning";
import { formatChangedFields } from "@helpers/formatChangedFields";
import {
	handleCancel,
	handleDeleteEntity,
	handleEdit,
	handleSaveConfirmation,
} from "@helpers/actions/editAndDeleteActions";
import { getILS } from "@helpers/getILS";
import { findConsortium } from "@helpers/findConsortium";

import { getLibrary } from "@queries/getLibrary";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import { GridRowModesModel } from "@mui/x-data-grid-premium";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { libraryParamsSchema } from "@schemas/routeParams/libraryParams";

export const Route = createFileRoute("/__authenticated/libraries/$libraryId/")({
	params: {
		parse: (raw) => libraryParamsSchema.parse(raw),
	},
	// Prefetches into the same query cache entry the component's useQuery
	// below reads (identical queryKey) - see docs/architecture.md.
	loader: ({ context: { queryClient, cfg, auth }, params: { libraryId } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global
		// network/401 error handler in main.tsx before __authenticated.tsx's
		// own component-level auth-gate redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: ["library", libraryId],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any>(getLibrary, {
					query: `id:${libraryId}`,
				}),
		});
	},
	component: LibraryProfile,
});

function LibraryProfile() {
	const { t } = useTranslation();
	const router = useRouter();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const firstEditableFieldRef = useRef<HTMLInputElement | null>(null);
	const saveButtonRef = useRef<HTMLButtonElement | null>(null);

	const [editMode, setEditMode] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [changedFields, setChangedFields] = useState<Record<string, any>>({});
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const { data, isLoading, error } = useQuery({
		queryKey: ["library", libraryId],
		queryFn: () =>
			gqlClient.request<any>(getLibrary, { query: `id:${libraryId}` }),
		enabled: !!libraryId,
		refetchInterval: 120000,
	});

	const library = data?.libraries?.content?.[0];
	const isConsortiumGroupMember = findConsortium(library?.membership) != null;
	const libraryGroups =
		library?.membership?.map((member: any) => member.libraryGroup) ?? [];

	const validationSchema = Yup.object().shape({
		fullName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", { field: t("libraries.full_name") }),
			)
			.max(200),
		shortName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", { field: t("libraries.short_name") }),
			)
			.max(100),
		abbreviatedName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", { field: t("libraries.abbreviated_name") }),
			)
			.max(32),
		backupDowntimeSchedule: Yup.string().trim().max(200),
		supportHours: Yup.string().trim().max(200),
		latitude: Yup.number()
			.nullable()
			.transform((v, o) => (o === "" ? null : v))
			.min(-90)
			.max(90),
		longitude: Yup.number()
			.nullable()
			.transform((v, o) => (o === "" ? null : v))
			.min(-180)
			.max(180),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm({
		resolver: yupResolver(validationSchema),
		mode: "onChange",
		values: {
			fullName: library?.fullName ?? "",
			shortName: library?.shortName ?? "",
			abbreviatedName: library?.abbreviatedName ?? "",
			backupDowntimeSchedule: library?.backupDowntimeSchedule ?? "",
			supportHours: library?.supportHours ?? "",
			latitude: library?.latitude ?? null,
			longitude: library?.longitude ?? null,
		},
	});

	const { mutateAsync: updateLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(updateLibraryMutation, variables),
	});

	const { mutateAsync: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryMutation, variables),
	});

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning(
		isDirty,
		() => {
			setTimeout(() => saveButtonRef.current?.focus(), 0);
		},
		() => {
			setChangedFields({});
			reset();
		},
	);

	const onSubmit = (formData: any) => {
		const newChangedFields = Object.keys(formData).reduce((acc: any, key) => {
			if (formData[key] !== library?.[key] && formData[key] !== undefined)
				acc[key] = formData[key];
			return acc;
		}, {});

		setChangedFields(newChangedFields);
		if (Object.keys(newChangedFields).length === 0) return setEditMode(false);
		setConfirmationEdit(true);
	};

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("libraries.library"),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (error || !library)
		return (
			<Error
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("error.invalid_UUID")}
			/>
		);

	const viewModeActions = [
		{
			key: "edit",
			// eslint-disable-next-line react-hooks/refs -- handleEdit only reads the ref inside the returned click handler (via requestAnimationFrame), never during render
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
						entity: t("libraries.library").toLowerCase(),
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
			title={library.fullName}
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
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={0} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("nav.libraries.profile")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="accordionSummary">
						{t("libraries.library")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.fullName ? "error" : "primary.attributeTitle"}
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
										error={!!errors.fullName}
										helperText={errors.fullName?.message as string}
									/>
								) : (
									<RenderAttribute attribute={library.fullName} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.shortName ? "error" : "primary.attributeTitle"}
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
										error={!!errors.shortName}
										helperText={errors.shortName?.message as string}
									/>
								) : (
									<RenderAttribute attribute={library.shortName} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={
								errors.abbreviatedName ? "error" : "primary.attributeTitle"
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
										error={!!errors.abbreviatedName}
										helperText={errors.abbreviatedName?.message as string}
									/>
								) : (
									<RenderAttribute attribute={library.abbreviatedName} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.type")}
						</Typography>
						<RenderAttribute attribute={library.type} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.code")}
						</Typography>
						<RenderAttribute attribute={library.agencyCode} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.library_management_system")}
						</Typography>
						<RenderAttribute
							attribute={
								getILS(library?.agency?.hostLms?.lmsClientClass) ||
								library?.agency?.hostLms?.lmsClientClass
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.supportHours ? "error" : "primary.attributeTitle"}
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
										error={!!errors.supportHours}
										helperText={errors.supportHours?.message as string}
									/>
								) : (
									<RenderAttribute attribute={library.supportHours} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={
								errors.backupDowntimeSchedule
									? "error"
									: "primary.attributeTitle"
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
										error={!!errors.backupDowntimeSchedule}
										helperText={
											errors.backupDowntimeSchedule?.message as string
										}
									/>
								) : (
									<RenderAttribute attribute={library.backupDowntimeSchedule} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.site_designation")}
						</Typography>
						<RenderAttribute
							attribute={
								library?.agency?.hostLms?.clientConfig?.contextHierarchy?.[0]
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.library_id")}
						</Typography>
						<RenderAttribute attribute={library.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.secret_label")}
						</Typography>
						<RenderAttribute attribute={library.secretLabel} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.principal_label")}
						</Typography>
						<RenderAttribute attribute={library.principalLabel} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("libraries.primaryLocation.title")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.primaryLocation.address")}
						</Typography>
						<AddressLink address={library.address} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.latitude ? "error" : "primary.attributeTitle"}
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
										error={!!errors.latitude}
										helperText={errors.latitude?.message as string}
									/>
								) : (
									<RenderAttribute attribute={library.latitude} type="number" />
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
										error={!!errors.longitude}
										helperText={errors.longitude?.message as string}
									/>
								) : (
									<RenderAttribute
										attribute={library.longitude}
										type="number"
									/>
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Divider aria-hidden="true" />
				</Grid>

				{isConsortiumGroupMember && (
					<>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Typography
								variant="h3"
								sx={{
									fontWeight: "bold",
								}}
							>
								{t("consortium.title")}
							</Typography>
						</Grid>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("consortium.name")}
								</Typography>
								<RenderAttribute
									attribute={findConsortium(library.membership)?.name}
								/>
							</Stack>
						</Grid>
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Divider aria-hidden="true" />
						</Grid>
					</>
				)}

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("libraries.groups")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<DataGrid
						identifier="libraryGroups"
						pagination
						paginationModel={{ page: 0, pageSize: 20 }}
						rowModesModel={rowModesModel}
						onRowModesModelChange={setRowModesModel}
						type="groups"
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
						rows={libraryGroups}
						loading={isLoading}
						paginationMode="client"
						sortingMode="client"
						filterMode="client"
						checkboxSelection={false}
						disableAggregation
						disableRowGrouping
						toolbarVisible={false}
						scrollbarVisible={false}
						noResultsText={t("groups.none_for_library")}
						searchText=""
						disableHoverInteractions
						disablePivoting
						pivotingEnabled={false}
						listViewEnabled={false}
					/>
				</Grid>
			</Grid>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(r, c, u) => {
					handleDeleteEntity(
						library.id,
						r,
						c,
						u,
						setAlert,
						deleteLibrary,
						t,
						router,
						library.fullName,
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={library.fullName}
			/>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={(r, c, u) =>
					handleSaveConfirmation(
						library.id,
						changedFields,
						updateLibrary,
						queryClient,
						{
							setEditMode,
							setChangedFields,
							setAlert,
							setConfirmation: setConfirmationEdit,
						},
						{
							entityName: library.fullName,
							entityType: t("libraries.library"),
							mutationName: "updateLibrary",
							t,
						},
						{ reason: r, changeCategory: c, changeReferenceUrl: u },
						[["library", libraryId]],
						reset,
					)
				}
				action="gridEdit"
				editInformation={formatChangedFields(changedFields, library)}
				entityName={library.fullName}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				action="unsaved"
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
