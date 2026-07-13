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
	FormControl,
	Grid,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
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

import { getLibraryBasics } from "@queries/getLibraryBasics";
import { updateAgencyQuery } from "@mutations/updateAgency";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import type { LoadLibraryBasicsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/settings",
)({
	component: Settings,
});

function Settings() {
	const { t } = useTranslation();
	const router = useRouter();
	const { libraryId } = Route.useParams();
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
	const [changedFields, setChangedFields] = useState<Record<string, any>>({});
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const { data, isLoading, error } = useQuery({
		queryKey: ["library", "settings", libraryId],
		queryFn: () =>
			gqlClient.request<any, LoadLibraryBasicsQueryVariables>(
				getLibraryBasics,
				{ query: `id:${libraryId}` },
			),
		enabled: !!libraryId,
	});

	const library = data?.libraries?.content?.[0];

	const validationSchema = Yup.object().shape({
		maxConsortialLoans: Yup.number()
			.transform((v, o) => (o === "" ? null : v))
			.typeError(
				t("ui.validation.number", {
					field: t("libraries.max_consortial_loans"),
				}),
			)
			.min(0, t("ui.validation.min_value", { min: 0 }))
			.nullable(),
		isSupplyingAgency: Yup.boolean().nullable(),
		isBorrowingAgency: Yup.boolean().nullable(),
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
			maxConsortialLoans: library?.agency?.maxConsortialLoans ?? null,
			isSupplyingAgency: library?.agency?.isSupplyingAgency ?? null,
			isBorrowingAgency: library?.agency?.isBorrowingAgency ?? null,
		},
	});

	const { mutateAsync: updateAgency } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(updateAgencyQuery, variables),
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
			setEditMode(false);
		},
	);

	const onSubmit = (formData: any) => {
		const newChangedFields = Object.keys(formData).reduce((acc: any, key) => {
			if (
				formData[key] !== library?.agency?.[key] &&
				formData[key] !== undefined
			)
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
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("ui.error.invalid_UUID")}
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
					<LibraryTabs libraryId={libraryId} value={2} />
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("nav.libraries.settings")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="accordionSummary">
						{t("libraries.circulation.title")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle" id="label-borrowing-status">
							{t("libraries.circulation.borrowing_status")}
						</Typography>
						<Controller
							name="isBorrowingAgency"
							control={control}
							render={({ field }) =>
								editMode ? (
									<FormControl fullWidth>
										<Select
											{...field}
											value={field.value?.toString() ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value === "true")
											}
											displayEmpty
										>
											<MenuItem value="true">
												{t("libraries.circulation.enabled_borrow")}
											</MenuItem>
											<MenuItem value="false">
												{t("libraries.circulation.disabled_borrow")}
											</MenuItem>
										</Select>
									</FormControl>
								) : (
									<Typography>
										{library.agency?.isBorrowingAgency
											? t("libraries.circulation.enabled_borrow")
											: library.agency?.isBorrowingAgency === false
												? t("libraries.circulation.disabled_borrow")
												: t("libraries.circulation.not_set")}
									</Typography>
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle" id="label-supplying-status">
							{t("libraries.circulation.supplying_status")}
						</Typography>
						<Controller
							name="isSupplyingAgency"
							control={control}
							render={({ field }) =>
								editMode ? (
									<FormControl fullWidth>
										<Select
											{...field}
											value={field.value?.toString() ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value === "true")
											}
											displayEmpty
										>
											<MenuItem value="true">
												{t("libraries.circulation.enabled_supply")}
											</MenuItem>
											<MenuItem value="false">
												{t("libraries.circulation.disabled_supply")}
											</MenuItem>
										</Select>
									</FormControl>
								) : (
									<Typography>
										{library.agency?.isSupplyingAgency
											? t("libraries.circulation.enabled_supply")
											: library.agency?.isSupplyingAgency === false
												? t("libraries.circulation.disabled_supply")
												: t("libraries.circulation.not_set")}
									</Typography>
								)
							}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.max_consortial_loans")}
						</Typography>
						<Controller
							name="maxConsortialLoans"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										inputRef={firstEditableFieldRef}
										type="number"
										fullWidth
										error={!!errors.maxConsortialLoans}
										helperText={errors.maxConsortialLoans?.message as string}
									/>
								) : (
									<RenderAttribute
										attribute={library.agency?.maxConsortialLoans}
									/>
								)
							}
						/>
					</Stack>
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
						library.agencyCode,
						changedFields,
						updateAgency,
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
							mutationName: "updateAgency",
							t,
						},
						{ reason: r, changeCategory: c, changeReferenceUrl: u },
						[["library", "settings", libraryId]],
						reset,
					)
				}
				action="gridEdit"
				editInformation={formatChangedFields(changedFields, library.agency)}
				entityName={library.fullName}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				action="unsaved"
				entityName={library.fullName}
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
