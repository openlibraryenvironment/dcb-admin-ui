import { Library } from "@models/Library";
import {
	Button,
	FormControl,
	Grid,
	MenuItem,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
	deleteLibraryQuery,
	getLibraryBasics,
	updateAgencyQuery,
} from "src/queries/queries";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AdminLayout } from "@layout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useRef, useState } from "react";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";
import {
	closeConfirmation,
	handleCancel,
	handleDeleteEntity,
	handleEdit,
	handleSaveConfirmation,
} from "src/helpers/actions/editAndDeleteActions";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { Agency } from "@models/Agency";
import * as Yup from "yup";
import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import { isEmpty } from "lodash";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";

type LibraryDetails = {
	libraryId: any;
};

interface AgencyFormFields {
	isSupplyingAgency?: boolean | null;
	isBorrowingAgency?: boolean | null;
	maxConsortialLoans?: number | null;
	longitude?: number;
	latitude?: number;
}

export default function Settings({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	const [tabIndex, setTabIndex] = useState(2);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const firstEditableFieldRef = useRef<HTMLInputElement>(null);
	// We will now need an "Edit" mode, and we need to use updateAgency
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const [changedFields, setChangedFields] = useState<Partial<Agency>>({});
	const saveButtonRef = useRef<HTMLButtonElement>(null);

	const [editMode, setEditMode] = useState(false);

	const { data, loading, error } = useQuery(getLibraryBasics, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000,
		errorPolicy: "all",
		onCompleted: (data) => {
			const library = data?.libraries?.content?.[0];
			// This is needed because default values don't always load in time.
			reset({
				isSupplyingAgency: library?.agency?.isSupplyingAgency,
				isBorrowingAgency: library?.agency?.isBorrowingAgency,
				maxConsortialLoans: library?.agency?.maxConsortialLoans,
				latitude: library?.latitude,
				longitude: library?.longitude,
			});
		},
	});
	const [deleteLibrary] = useMutation(deleteLibraryQuery);

	const theme = useTheme();
	const router = useRouter();
	const client = useApolloClient();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
	const [updateAgency] = useMutation(updateAgencyQuery);

	const library: Library = data?.libraries?.content?.[0];

	const validationSchema = Yup.object().shape({
		maxConsortialLoans: Yup.number()
			.nullable()
			.transform((value, originalValue) =>
				originalValue === "" ? null : value,
			)
			.typeError(t("ui.validation.numeric"))
			.min(0, t("ui.validation.min_value", { min: 0 })),
		isSupplyingAgency: Yup.boolean().nullable(),
		isBorrowingAgency: Yup.boolean().nullable(),
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
	} = useForm<AgencyFormFields>({
		defaultValues: {
			maxConsortialLoans: library?.agency?.maxConsortialLoans ?? null,
			isSupplyingAgency: library?.agency?.isSupplyingAgency ?? null,
			isBorrowingAgency: library?.agency?.isBorrowingAgency ?? null,
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
			library.agencyCode,
			changedFields,
			updateAgency,
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
				mutationName: "updateAgency",
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
				"isSupplyingAgency",
				"isBorrowingAgency",
				"maxConsortialLoans",
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
			setEditMode(false);
		},
	});
	const onSubmit: SubmitHandler<AgencyFormFields> = (data) => {
		const newChangedFields = Object.keys(data).reduce((acc, key) => {
			const field = key as keyof AgencyFormFields;
			const currentValue = data[field];
			const originalValue = library?.agency[field];

			if (currentValue !== originalValue && currentValue !== undefined) {
				(acc[field] as typeof currentValue) = currentValue;
			}
			return acc;
		}, {} as Partial<Agency>);
		setChangedFields(newChangedFields);
		if (Object.keys(newChangedFields).length === 0) {
			setEditMode(false);
			return;
		}
		setConfirmationEdit(true);
	};

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
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("nav.libraries.settings")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
					<Typography variant="accordionSummary">
						{t("libraries.circulation.title")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle" id="label-borrowing-status">
							{t("libraries.circulation.borrowing_status")}
						</Typography>
						<Controller
							name="isBorrowingAgency"
							control={control}
							render={({ field: { onChange, value } }) =>
								editMode ? (
									<FormControl fullWidth>
										<Select
											value={
												value === null || value === undefined
													? ""
													: value.toString()
											}
											onChange={(e) => {
												const val = e.target.value;
												if (val === "true") onChange(true);
												else if (val === "false") onChange(false);
											}}
											inputProps={{
												"aria-labelledby": "label-borrowing-status",
											}}
											SelectDisplayProps={{
												"aria-labelledby": "label-borrowing-status",
											}}
											displayEmpty
											renderValue={(selected) => {
												return selected === "true"
													? t("libraries.circulation.enabled_borrow")
													: t("libraries.circulation.disabled_borrow");
											}}
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
										{library?.agency?.isBorrowingAgency
											? t("libraries.circulation.enabled_borrow")
											: library?.agency?.isBorrowingAgency == false
												? t("libraries.circulation.disabled_borrow")
												: t("libraries.circulation.not_set")}
									</Typography>
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
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
											inputProps={{
												"aria-labelledby": "label-borrowing-status",
											}}
											SelectDisplayProps={{
												"aria-labelledby": "label-borrowing-status",
											}}
											label={t("consortium.settings.enabled_header")}
											value={field.value?.toString()}
											onChange={(e) => {
												field.onChange(e.target.value === "true");
											}}
											variant="outlined"
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
										{library?.agency?.isSupplyingAgency
											? t("libraries.circulation.enabled_supply")
											: library?.agency?.isSupplyingAgency == false
												? t("libraries.circulation.disabled_supply")
												: t("libraries.circulation.not_set")}
									</Typography>
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							id="max-consortial-loans-label"
						>
							{t("libraries.max_consortial_loans")}
						</Typography>
						<Controller
							name="maxConsortialLoans"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										aria-label="max-consortial-loans-input"
										slotProps={{
											htmlInput: {
												"aria-label": "max-consortial-loans-input",
											},
										}}
										type="number"
										fullWidth
										variant="outlined"
										error={!!errors.maxConsortialLoans}
										helperText={errors.maxConsortialLoans?.message}
										value={library?.agency?.maxConsortialLoans}
									/>
								) : (
									<RenderAttribute attribute={field.value} />
								)
							}
						/>
					</Stack>
				</Grid>
			</Grid>
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
				editInformation={formatChangedFields(changedFields, library?.agency)}
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
