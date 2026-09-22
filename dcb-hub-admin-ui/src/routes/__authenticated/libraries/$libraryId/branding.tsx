import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { isEmpty } from "lodash";
import {
	Alert,
	Button,
	Grid,
	MenuItem,
	Stack,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { Cancel, Edit, Save } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import Confirmation from "@components/Confirmation/Confirmation";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useUnsavedChangesWarning } from "@hooks/useUnsavedChangesWarning";
import { handleEdit } from "@helpers/actions/editAndDeleteActions";
import { formatChangedFields } from "@helpers/formatChangedFields";
import { isConsortiumBrandingEnabled } from "@helpers/featureFlags";
import { discoveryBrandFields } from "@schemas/discoveryBrandSchema";
import { themeOptions } from "@constants/discoveryBranding";
import { libraryQuery } from "@/queryOptions/library";

interface LibraryBrandFormFields {
	brandLogoUrl: string;
	brandLogoAlt: string;
	defaultThemeName: string;
}

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/branding",
)({
	// The tab is hidden while the flag is off, but the URL is still typeable - and
	// Library has not carried these columns since before 9.0.0, so both the read and
	// every save would be a validation error that fails the whole operation. Same guard,
	// same reason, as /consortium/branding.
	beforeLoad: () => {
		if (!isConsortiumBrandingEnabled()) {
			throw redirect({ to: "/libraries" });
		}
	},
	component: LibraryBranding,
});

function LibraryBranding() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const firstEditableFieldRef = useRef<HTMLInputElement>(null);
	const [editMode, setEditMode] = useState(false);
	const libraryMutation = useEntityMutation("library");

	const {
		data: library,
		isLoading,
		error,
	} = useQuery(libraryQuery(gqlClient, libraryId));

	const brandRules = discoveryBrandFields(t);
	const validationSchema = Yup.object().shape({
		brandLogoUrl: brandRules.brandLogoUrl,
		brandLogoAlt: brandRules.brandLogoAlt,
		defaultThemeName: brandRules.defaultThemeName,
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<LibraryBrandFormFields>({
		resolver: yupResolver(validationSchema) as any,
		mode: "onChange",
		values: {
			brandLogoUrl: library?.brandLogoUrl ?? "",
			brandLogoAlt: library?.brandLogoAlt ?? "",
			defaultThemeName: library?.defaultThemeName ?? "",
		},
	});

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning(isDirty);

	const onSubmit = (formData: LibraryBrandFormFields) => {
		const changedFields = (
			Object.keys(formData) as (keyof LibraryBrandFormFields)[]
		).reduce<Partial<LibraryBrandFormFields>>((changed, field) => {
			// An empty string is a real value here: dcb-service reads it as "clear this
			// column", which is how an administrator removes a mark they uploaded by
			// mistake. Comparing against `?? ""` is what keeps a cleared field a change
			// rather than a no-op.
			if (formData[field] !== (library[field] ?? "")) {
				changed[field] = formData[field];
			}
			return changed;
		}, {});

		if (Object.keys(changedFields).length === 0) {
			setEditMode(false);
			return;
		}

		libraryMutation.requestFormEdit({
			id: library.id,
			name: library.fullName,
			changedFields,
			changeSummary: formatChangedFields(changedFields, library),
			onSuccess: () => {
				setEditMode(false);
				reset(undefined, { keepValues: false });
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
	];

	const editModeActions = [
		<Button
			key="save"
			startIcon={<Save />}
			onClick={handleSubmit(onSubmit)}
			disabled={!isEmpty(errors) || !isDirty}
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
					<LibraryTabs libraryId={libraryId} value={11} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("nav.libraries.branding")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Alert severity="info">{t("libraries.brand.explanation")}</Alert>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography
							variant="attributeTitle"
							color={errors.brandLogoUrl ? "error" : "primary.attributeTitle"}
							id="label-brand-logo-url"
						>
							{t("libraries.brand.logo_url")}
						</Typography>
						<Controller
							name="brandLogoUrl"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										inputRef={firstEditableFieldRef}
										fullWidth
										error={!!errors.brandLogoUrl}
										slotProps={{
											htmlInput: {
												"aria-labelledby": "label-brand-logo-url",
											},
										}}
										helperText={
											errors.brandLogoUrl?.message ??
											t("libraries.brand.logo_url_help")
										}
									/>
								) : (
									<RenderAttribute
										attribute={library.brandLogoUrl}
										type="url"
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
							color={errors.brandLogoAlt ? "error" : "primary.attributeTitle"}
							id="label-brand-logo-alt"
						>
							{t("libraries.brand.logo_alt")}
						</Typography>
						<Controller
							name="brandLogoAlt"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										error={!!errors.brandLogoAlt}
										slotProps={{
											htmlInput: {
												"aria-labelledby": "label-brand-logo-alt",
											},
										}}
										helperText={
											errors.brandLogoAlt?.message ??
											t("libraries.brand.logo_alt_help")
										}
									/>
								) : (
									<RenderAttribute attribute={library.brandLogoAlt} />
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
								errors.defaultThemeName ? "error" : "primary.attributeTitle"
							}
							id="label-brand-theme"
						>
							{t("libraries.brand.theme")}
						</Typography>
						<Controller
							name="defaultThemeName"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										select
										fullWidth
										error={!!errors.defaultThemeName}
										// `labelId`, not a raw aria-labelledby: SelectInput puts
										// labelId on the combobox element itself, while a
										// hand-written attribute lands on the wrapper and leaves
										// the combobox with no accessible name.
										slotProps={{
											select: { labelId: "label-brand-theme" },
										}}
										helperText={
											errors.defaultThemeName?.message ??
											t("libraries.brand.theme_help")
										}
									>
										<MenuItem value="">
											{t("libraries.brand.theme_inherit")}
										</MenuItem>
										{themeOptions(library.defaultThemeName).map((name) => (
											<MenuItem key={name} value={name}>
												{name}
											</MenuItem>
										))}
									</TextField>
								) : (
									<RenderAttribute
										attribute={
											library.defaultThemeName ||
											t("libraries.brand.theme_inherit")
										}
									/>
								)
							}
						/>
					</Stack>
				</Grid>
			</Grid>

			<EntityMutationDialogs {...libraryMutation.dialogProps} />
			{/* Not an entity mutation: this one guards navigation, not data. */}
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				action="unsaved"
				entityName={library.fullName}
			/>
		</PageContainer>
	);
}
