import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import LibrarySetupBanner from "@components/LibrarySetupBanner/LibrarySetupBanner";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useUnsavedChangesWarning } from "@hooks/useUnsavedChangesWarning";
import { formatChangedFields } from "@helpers/formatChangedFields";
import { handleEdit } from "@helpers/actions/editAndDeleteActions";
import { getILS } from "@helpers/getILS";
import { findConsortium } from "@helpers/findConsortium";

import {
	fetchLibrary,
	libraryQuery,
	libraryQueryKey,
} from "@/queryOptions/library";
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
			queryKey: libraryQueryKey(libraryId),
			queryFn: () => fetchLibrary(createGraphQLClient(cfg, auth), libraryId),
		});
	},
	component: LibraryProfile,
});

function LibraryProfile() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const firstEditableFieldRef = useRef<HTMLInputElement | null>(null);
	const saveButtonRef = useRef<HTMLButtonElement | null>(null);

	const [editMode, setEditMode] = useState(false);
	const libraryMutation = useEntityMutation("library");

	const {
		data: library,
		isLoading,
		error,
	} = useQuery({
		...libraryQuery(gqlClient, libraryId),
		refetchInterval: 120000,
	});

	const isConsortiumGroupMember = findConsortium(library?.membership) != null;
	const libraryGroups =
		library?.membership?.map((member: any) => member.libraryGroup) ?? [];

	const validationSchema = Yup.object().shape({
		fullName: Yup.string()
			.trim()
			.required(t("ui.validation.required", { field: t("libraries.name") }))
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
		// The column widths dcb-service's Library declares. Refused here rather than by
		// Postgres, which answers a 200-character overrun with a 500.
		address: Yup.string().trim().max(200),
		type: Yup.string().trim().max(200),
		targetLoanToBorrowRatio: Yup.string().trim().max(200),
		principalLabel: Yup.string().trim().max(200),
		secretLabel: Yup.string().trim().max(200),
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
			address: library?.address ?? "",
			type: library?.type ?? "",
			targetLoanToBorrowRatio: library?.targetLoanToBorrowRatio ?? "",
			principalLabel: library?.principalLabel ?? "",
			secretLabel: library?.secretLabel ?? "",
			latitude: library?.latitude ?? null,
			longitude: library?.longitude ?? null,
		},
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
			reset();
		},
	);

	const onSubmit = (formData: any) => {
		const newChangedFields = Object.keys(formData).reduce((acc: any, key) => {
			// `?? ""` on BOTH sides. Every text field is seeded with "" when the column
			// is null, so comparing "" against null reported an untouched field as
			// changed: it appeared in the confirmation summary as "-" to "-" and was
			// sent on every save. Coordinates stay null-vs-null, which also compares
			// equal.
			const next = formData[key] ?? "";
			const current = library?.[key] ?? "";
			if (next !== current && formData[key] !== undefined)
				acc[key] = formData[key];
			return acc;
		}, {});

		if (Object.keys(newChangedFields).length === 0) return setEditMode(false);
		libraryMutation.requestFormEdit({
			id: library.id,
			name: library.fullName,
			changedFields: newChangedFields,
			changeSummary: formatChangedFields(newChangedFields, library),
			onSuccess: () => {
				setEditMode(false);
				reset();
			},
		});
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
				message={t("ui.error.invalid_UUID")}
			/>
		);

	const deleteAction = libraryMutation.buildDeleteAction({
		id: library.id,
		name: library.fullName,
		redirect: "/libraries",
		disabled: !isAnAdmin,
		icon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
	});

	const viewModeActions = [
		{
			key: "edit",
			// eslint-disable-next-line react-hooks/refs -- handleEdit only reads the ref inside the returned click handler (via requestAnimationFrame), never during render
			onClick: handleEdit(setEditMode, firstEditableFieldRef),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.edit"),
			startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
		},
		deleteAction,
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
			onClick={() => {
				setEditMode(false);
				reset();
			}}
		>
			{t("ui.data_grid.cancel")}
		</Button>,
		<MoreActionsMenu key="more" actions={[deleteAction]} />,
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
					<LibrarySetupBanner library={library} canEdit={isAnAdmin} />
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
							id="label-full-name"
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
										slotProps={{
											htmlInput: { "aria-labelledby": "label-full-name" },
										}}
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
							id="label-short-name"
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
										slotProps={{
											htmlInput: { "aria-labelledby": "label-short-name" },
										}}
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
							id="label-abbreviated-name"
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
										slotProps={{
											htmlInput: {
												"aria-labelledby": "label-abbreviated-name",
											},
										}}
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
						<Typography
							variant="attributeTitle"
							color={errors.type ? "error" : "primary.attributeTitle"}
							id="label-library-type"
						>
							{t("libraries.type")}
						</Typography>
						<Controller
							name="type"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.type}
										slotProps={{
											htmlInput: { "aria-labelledby": "label-library-type" },
										}}
										helperText={errors.type?.message as string}
									/>
								) : (
									<RenderAttribute attribute={library.type} />
								)
							}
						/>
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
							id="label-support-hours"
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
										slotProps={{
											htmlInput: { "aria-labelledby": "label-support-hours" },
										}}
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
							id="label-backup-schedule"
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
										slotProps={{
											htmlInput: { "aria-labelledby": "label-backup-schedule" },
										}}
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
						<Typography
							variant="attributeTitle"
							color={
								errors.targetLoanToBorrowRatio
									? "error"
									: "primary.attributeTitle"
							}
							id="label-target-ratio"
						>
							{t("libraries.target_loan_to_borrow_ratio")}
						</Typography>
						<Controller
							name="targetLoanToBorrowRatio"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.targetLoanToBorrowRatio}
										slotProps={{
											htmlInput: { "aria-labelledby": "label-target-ratio" },
										}}
										helperText={
											(errors.targetLoanToBorrowRatio?.message as string) ??
											t("libraries.target_loan_to_borrow_ratio_help")
										}
									/>
								) : (
									<RenderAttribute
										attribute={library.targetLoanToBorrowRatio}
									/>
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
				{/* This library's own words for its credentials on the patron sign-in
				    screen - "Borrower number" rather than "Library card number". Blank
				    means discovery uses its own default wording, never a blank label. */}
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.principalLabel ? "error" : "primary.attributeTitle"}
							id="label-principal-label"
						>
							{t("libraries.principal_label")}
						</Typography>
						<Controller
							name="principalLabel"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.principalLabel}
										slotProps={{
											htmlInput: {
												"aria-labelledby": "label-principal-label",
											},
										}}
										helperText={
											(errors.principalLabel?.message as string) ??
											t("libraries.principal_label_help")
										}
									/>
								) : (
									<RenderAttribute attribute={library.principalLabel} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.secretLabel ? "error" : "primary.attributeTitle"}
							id="label-secret-label"
						>
							{t("libraries.secret_label")}
						</Typography>
						<Controller
							name="secretLabel"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.secretLabel}
										slotProps={{
											htmlInput: { "aria-labelledby": "label-secret-label" },
										}}
										helperText={
											(errors.secretLabel?.message as string) ??
											t("libraries.secret_label_help")
										}
									/>
								) : (
									<RenderAttribute attribute={library.secretLabel} />
								)
							}
						/>
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
						<Typography
							variant="attributeTitle"
							color={errors.address ? "error" : "primary.attributeTitle"}
							id="label-library-address"
						>
							{t("libraries.primaryLocation.address")}
						</Typography>
						<Controller
							name="address"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										multiline
										error={!!errors.address}
										slotProps={{
											htmlInput: {
												"aria-labelledby": "label-library-address",
											},
										}}
										helperText={errors.address?.message as string}
									/>
								) : (
									// AddressLink, not RenderAttribute: it builds the map link.
									<AddressLink address={library.address} />
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
							id="label-latitude"
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
										slotProps={{
											htmlInput: { "aria-labelledby": "label-latitude" },
										}}
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
							id="label-longitude"
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
										slotProps={{
											htmlInput: { "aria-labelledby": "label-longitude" },
										}}
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
			<EntityMutationDialogs {...libraryMutation.dialogProps} />
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				action="unsaved"
			/>
		</PageContainer>
	);
}
