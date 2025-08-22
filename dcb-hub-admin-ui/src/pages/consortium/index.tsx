import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import {
	Button,
	Grid,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { PutBlobResult } from "@vercel/blob";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import { getConsortia, updateConsortiumQuery } from "src/queries/queries";
import {
	handleSaveConfirmation,
	handleCancel,
	handleEdit,
} from "src/helpers/actions/editAndDeleteActions";
import { Consortium } from "@models/Consortium";
import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import { Cancel, CloudUpload, Edit, Save } from "@mui/icons-material";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import FileUploadButton from "@components/FileUploadButton/FileUploadButton";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { isEmpty } from "lodash";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { handleConsortiumTabChange } from "src/helpers/navigation/handleTabChange";

// If this ever needs to be extended to support multiple consortia
// Change current flat structure to [id] structure similar to libraries
// And have a consortium grid page
// or only show active consortia

interface ConsortiumFormFields {
	displayName: string;
	websiteUrl?: string;
	catalogueSearchUrl?: string;
	description?: string;
}
// check upload button for image upload
const ConsortiumPage: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(0);
	const { data: session } = useSession();
	const router = useRouter();
	const appHeaderFileRef = useRef<HTMLInputElement>(null);
	const aboutFileRef = useRef<HTMLInputElement>(null);

	const [headerIsUploading, setHeaderIsUploading] = useState(false);
	const [aboutIsUploading, setAboutIsUploading] = useState(false);

	const firstEditableFieldRef = useRef<HTMLInputElement>(null);

	const {
		setHeaderImageURL,
		setDisplayName,
		setAboutImageURL,
		setCatalogueSearchURL,
		setWebsiteURL,
		setDescription,
	} = useConsortiumInfoStore();
	const { data, loading, error } = useQuery(getConsortia, {
		variables: {
			order: "id",
			orderBy: "DESC",
			pageno: 0,
			pagesize: 10,
		},
		errorPolicy: "all",
		onCompleted: (data) => {
			const consortium: Consortium = data.consortia?.content[0];
			// Ensure our cache for unauthenticated display is up to date
			setDescription(consortium?.description);
			setWebsiteURL(consortium?.websiteUrl);
			setCatalogueSearchURL(consortium?.catalogueSearchUrl);
			setDisplayName(consortium?.displayName);
			setHeaderImageURL(consortium?.headerImageUrl);
			setAboutImageURL(consortium?.aboutImageUrl);
			reset({
				displayName: consortium?.displayName ?? "",
				description: consortium?.description ?? "",
				websiteUrl: consortium?.websiteUrl ?? "",
				catalogueSearchUrl: consortium?.catalogueSearchUrl,
			});
		},
	});
	// Make sure this only gets the first consortia
	const consortium: Consortium = data?.consortia.content[0];
	const client = useApolloClient();
	const saveButtonRef = useRef<HTMLButtonElement>(null);

	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const [editMode, setEditMode] = useState(false);
	const theme = useTheme();
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [changedFields, setChangedFields] = useState<Partial<Consortium>>({});
	const validationSchema = Yup.object().shape({
		displayName: Yup.string()
			.trim()
			.nonNullable(
				t("ui.data_grid.validation.no_empty", {
					field: t("consortium.display_name"),
				}),
			)
			.required(
				t("ui.validation.required", { field: t("consortium.display_name") }),
			)
			.max(200, t("ui.validation.max_length", { length: 200 })),
		description: Yup.string()
			.trim()
			.max(400, t("ui.validation.max_length", { length: 128 })),
		websiteUrl: Yup.string()
			.trim()
			.max(200, t("ui.validation.max_length", { length: 128 })),
		catalogueSearchUrl: Yup.string()
			.trim()
			.max(200, t("ui.validation.max_length", { length: 128 })),
	});

	const onSubmit = (data: Partial<Consortium>) => {
		const newChangedFields = Object.keys(data).reduce((acc, key) => {
			const field = key as keyof ConsortiumFormFields;
			const currentValue = data[field];
			const originalValue = consortium[field];

			if (currentValue !== originalValue && currentValue !== undefined) {
				(acc[field] as typeof currentValue) = currentValue;
			}
			return acc;
		}, {} as Partial<Consortium>);
		setChangedFields(newChangedFields);
		if (Object.keys(newChangedFields).length === 0) {
			setEditMode(false);
			return;
		}
		setConfirmationEdit(true);
	};

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<ConsortiumFormFields>({
		defaultValues: {
			displayName: consortium?.displayName,
			description: consortium?.description,
			websiteUrl: consortium?.websiteUrl,
			catalogueSearchUrl: consortium?.catalogueSearchUrl,
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

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

	const [updateConsortium] = useMutation(updateConsortiumQuery, {
		refetchQueries: ["LoadConsortium"],
	});
	const [appHeaderPreviewUrl, setAppHeaderPreviewUrl] = useState<string>("");
	const [aboutPreviewUrl, setAboutPreviewUrl] = useState<string>("");

	const validateImageSize = (
		file: File,
		width: number,
		height: number,
	): Promise<any> => {
		const allowedTypes = ["image/png", "image/jpeg"];
		if (!allowedTypes.includes(file.type)) {
			return Promise.resolve(false);
		}
		return new Promise((resolve, reject) => {
			// Create an image element with proper type
			const img = document.createElement("img");
			img.onload = () => {
				// Revoke object URL to prevent memory leaks
				URL.revokeObjectURL(img.src);

				const isValidSize = img.width <= width && img.height === height;
				resolve(isValidSize);
			};
			img.onerror = (error) => {
				// Revoke object URL in case of error
				URL.revokeObjectURL(img.src);
				console.log(error);
				reject(new Error("Failed to load image"));
			};
			// Create object URL for the file
			img.src = URL.createObjectURL(file);
		});
	};

	// Handlers for file selection
	const handleAppHeaderFileSelect = (event: ChangeEvent) => {
		const target = event.target as HTMLInputElement;
		const file = target?.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			setAppHeaderPreviewUrl(objectUrl);
		}
	};

	const handleAboutFileSelect = (event: ChangeEvent) => {
		const target = event.target as HTMLInputElement;
		const file = target?.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			setAboutPreviewUrl(objectUrl);
		}
	};

	const handleRemoveAbout = () => {
		setAboutPreviewUrl("");

		// Reset the file input
		if (aboutFileRef && "current" in aboutFileRef && aboutFileRef.current) {
			aboutFileRef.current.value = "";
		}
	};
	// Pass in image sizes for the preview

	const handleRemoveAppHeader = () => {
		setAppHeaderPreviewUrl("");

		// Reset the file input
		if (
			appHeaderFileRef &&
			"current" in appHeaderFileRef &&
			appHeaderFileRef.current
		) {
			appHeaderFileRef.current.value = "";
		}
	};

	const handleAppHeaderFileUpload = async (event: React.FormEvent) => {
		event.preventDefault();
		setHeaderIsUploading(true);
		try {
			if (!appHeaderFileRef.current?.files) {
				throw new Error("No file selected");
			}
			const file = appHeaderFileRef.current.files[0];
			// Validate image size now.
			const isValidSize = await validateImageSize(file, 36, 36);
			if (!isValidSize) {
				const allowedTypes = ["image/png", "image/jpeg"];
				const isWrongType = !allowedTypes.includes(file.type);
				setAlert({
					open: true,
					severity: "error",
					text: isWrongType
						? t("consortium.invalid_file_type", {
								allowedTypes: "PNG, JPG",
							})
						: t("consortium.image_size_error_header", {
								width: 36,
								height: 36,
							}),
					title: t("ui.data_grid.error"),
				});
				setHeaderIsUploading(false);
				return;
			}
			const newName = `consortium${consortium.displayName}user${username}.png`;
			const response = await fetch(
				`/api/persistentAssets/serverUpload?filename=${newName}`,
				{
					method: "POST",
					body: file,
				},
			);
			if (!response.ok) {
				throw new Error("Upload failed");
			}
			const newBlob = (await response.json()) as PutBlobResult;
			// Update state and perform mutation
			setHeaderImageURL(newBlob.url);
			await updateConsortium({
				variables: {
					input: {
						id: consortium.id,
						headerImageUrl: newBlob.url,
						headerImageUploader: username,
						headerImageUploaderEmail: email,
						reason: "Update of consortium header image",
						changeCategory: "Initial setup",
					},
				},
			});
			// Clear preview and file selection
			setAppHeaderPreviewUrl("");
			if (appHeaderFileRef.current) {
				appHeaderFileRef.current.value = "";
			}
			setAlert({
				open: true,
				severity: "success",
				text: t("consortium.logo_app_header_success"),
				title: t("ui.data_grid.updated"),
			});
		} catch (error) {
			console.error("Upload error:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("consortium.logo_app_header_error"),
				title: t("ui.data_grid.error"),
			});
		} finally {
			setHeaderIsUploading(false);
		}
	};

	const handleAboutFileUpload = async (event: React.FormEvent) => {
		event.preventDefault();
		setAboutIsUploading(true);

		try {
			if (!aboutFileRef.current?.files) {
				throw new Error("No file selected");
			}
			const file = aboutFileRef.current.files[0];

			const isValidSize = await validateImageSize(file, 180, 48);
			if (!isValidSize) {
				const allowedTypes = ["image/png", "image/jpeg"];
				const isWrongType = !allowedTypes.includes(file.type);
				setAlert({
					open: true,
					severity: "error",
					text: isWrongType
						? t("consortium.invalid_file_type", {
								allowedTypes: "PNG, JPG",
							})
						: t("consortium.image_size_error_about", {
								width: 160,
								height: 48,
							}),
					title: t("ui.data_grid.error"),
				});
				setAboutIsUploading(false);
				return;
			}
			const newName = `consortium${consortium.displayName}user${username}.png`;
			const response = await fetch(
				`/api/persistentAssets/serverUpload?filename=${newName}`,
				{
					method: "POST",
					body: file,
				},
			);
			if (!response.ok) {
				throw new Error("Upload failed");
			}
			const newBlob = (await response.json()) as PutBlobResult;
			// Update state and perform mutation
			setAboutImageURL(newBlob.url);
			await updateConsortium({
				variables: {
					input: {
						id: consortium.id,
						aboutImageUrl: newBlob.url,
						aboutImageUploader: username,
						aboutImageUploaderEmail: email,
						reason: "Update of consortium about image",
						changeCategory: "Initial setup",
					},
				},
			});
			// Clear preview and file selection
			setAboutPreviewUrl("");
			if (aboutFileRef.current) {
				aboutFileRef.current.value = "";
			}
			setAlert({
				open: true,
				severity: "success",
				text: t("consortium.logo_about_success"),
				title: t("ui.data_grid.updated"),
			});
		} catch (error) {
			console.error("Upload error:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("consortium.logo_about_error"),
				title: t("consortium.logo_about_error"),
			});
		} finally {
			setAboutIsUploading(false);
		}
	};

	useEffect(() => {
		return () => {
			if (appHeaderPreviewUrl) {
				URL.revokeObjectURL(appHeaderPreviewUrl);
			}
			if (aboutPreviewUrl) {
				URL.revokeObjectURL(aboutPreviewUrl);
			}
		};
	}, [appHeaderPreviewUrl, aboutPreviewUrl]);

	// ONLY ALLOW ADMIN OR CONSORTIUM_ADMIN to edit.
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
	const handleConfirmSave = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		handleSaveConfirmation(
			consortium.id,
			changedFields,
			updateConsortium,
			client,
			{
				setEditMode,
				setChangedFields,
				setAlert,
				setConfirmation: setConfirmationEdit,
			},
			{
				entityName: consortium?.displayName,
				entityType: t("nav.consortium.name"),
				mutationName: "updateConsortium",
				t,
			},
			{
				reason,
				changeCategory,
				changeReferenceUrl,
			},
			["LoadConsortium"],
			reset,
			["displayName", "catalogueSearchUrl", "websiteUrl", "description"],
			(updatedFields) => {
				// Update your store values here
				if (updatedFields.displayName)
					setDisplayName(updatedFields.displayName);
				if (updatedFields.catalogueSearchUrl)
					setCatalogueSearchURL(updatedFields.catalogueSearchUrl);
				if (updatedFields.websiteUrl) setWebsiteURL(updatedFields.websiteUrl);
				if (updatedFields.description)
					setDescription(updatedFields.description);
			},
		);
	};

	const username = session?.user?.name;
	const email = session?.user?.email ?? "No email provided";

	const viewModeActions = [
		{
			key: "edit",
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
					key: "edit",
					onClick: handleEdit(setEditMode, firstEditableFieldRef),
					disabled: true,
					label: t("ui.data_grid.edit"),
					startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
				},
			]}
		/>,
	];
	const pageActions = editMode ? editModeActions : viewModeActions;
	if (loading) {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.consortium.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || consortium == null || consortium == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<ErrorComponent
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/locations"
				/>
			) : (
				<ErrorComponent
					title={t("ui.error.consortium_not_found")}
					message={t("ui.error.consortium_not_present")}
					description={t("ui.error.consortium_advice")}
					action={t("ui.action.go_back")}
					goBack="/locations"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout
			title={t("nav.consortium.name")}
			pageActions={pageActions}
			mode={editMode ? "edit" : "view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
			>
				<Grid
					container
					spacing={{ xs: 2, md: 3 }}
					columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					sx={{ marginBottom: "5px" }}
					component={"form"}
					onSubmit={handleSubmit(onSubmit)}
				>
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<Tabs
							value={tabIndex}
							onChange={(event, value) => {
								handleConsortiumTabChange(event, value, router, setTabIndex);
							}}
							aria-label="Consortium Navigation"
						>
							<Tab label={t("nav.consortium.profile")} />
							<Tab label={t("nav.consortium.functionalSettings")} />
							<Tab label={t("nav.consortium.onboarding")} />
							<Tab label={t("nav.consortium.contacts")} />
						</Tabs>
					</Grid>
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("consortium.name")}
							</Typography>
							<RenderAttribute attribute={consortium?.name} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<Stack direction={"column"}>
							<Typography
								variant="attributeTitle"
								color={
									errors?.displayName && editMode
										? theme.palette.error.main
										: theme.palette.primary.attributeTitle
								}
							>
								{t("consortium.display_name")}
							</Typography>
							<Controller
								name="displayName"
								control={control}
								render={({ field }) =>
									editMode ? (
										<TextField
											{...field}
											inputRef={firstEditableFieldRef}
											fullWidth
											variant="outlined"
											error={!!errors.displayName}
											helperText={errors.displayName?.message}
										/>
									) : (
										<RenderAttribute attribute={consortium?.displayName} />
									)
								}
							/>
						</Stack>
					</Grid>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="attributeTitle">
						{t("consortium.logo_app_header")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					{!isEmpty(consortium?.headerImageUrl) ? (
						<Image
							src={consortium?.headerImageUrl}
							alt="Uploaded content"
							width={36}
							height={36}
							style={{
								maxWidth: "200px",
								maxHeight: "200px",
								objectFit: "contain",
								marginTop: "8px",
							}}
						/>
					) : (
						<Typography variant="attributeText">
							{t("consortium.no_file_uploaded")}
						</Typography>
					)}
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography>
						{t("consortium.logo_app_header_requirements")}
					</Typography>
				</Grid>
				<form
					onSubmit={async (event) => {
						handleAppHeaderFileUpload(event);
					}}
				>
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<FileUploadButton
							ref={appHeaderFileRef}
							icon={<CloudUpload />}
							buttonText={t("consortium.select_image")}
							href="#appHeaderUpload"
							isUploading={headerIsUploading}
							onFileSelect={handleAppHeaderFileSelect}
							previewUrl={appHeaderPreviewUrl}
							handleRemove={handleRemoveAppHeader}
						/>
						{appHeaderPreviewUrl ? (
							<Button
								variant="outlined"
								type="submit"
								disabled={headerIsUploading}
								sx={{ mt: 2 }}
							>
								{headerIsUploading ? t("common.uploading") : t("common.upload")}
							</Button>
						) : null}
					</Grid>
				</form>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2">
						{t("consortium.landing_page_title")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="body1">
						{t("consortium.landing_page_subheader")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.websiteUrl && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("consortium.url")}
						</Typography>
						<Controller
							name="websiteUrl"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										variant="outlined"
										error={!!errors.websiteUrl}
										helperText={errors.websiteUrl?.message}
									/>
								) : (
									<RenderAttribute attribute={consortium?.websiteUrl} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.catalogueSearchUrl && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("consortium.search_url")}
						</Typography>
						<Controller
							name="catalogueSearchUrl"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										variant="outlined"
										error={!!errors.catalogueSearchUrl}
										helperText={errors.catalogueSearchUrl?.message}
									/>
								) : (
									<RenderAttribute attribute={consortium?.catalogueSearchUrl} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.description && editMode
									? theme.palette.error.main
									: theme.palette.primary.attributeTitle
							}
						>
							{t("consortium.description_title")}
						</Typography>
						<Controller
							name="description"
							control={control}
							render={({ field }) =>
								editMode ? (
									<TextField
										{...field}
										fullWidth
										variant="outlined"
										error={!!errors.description}
										helperText={errors.description?.message}
									/>
								) : (
									<RenderAttribute attribute={consortium?.description} />
								)
							}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="attributeTitle">
						{t("consortium.logo_about")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					{!isEmpty(consortium?.aboutImageUrl) ? (
						<Image
							src={consortium?.aboutImageUrl}
							alt="Uploaded image for the about section"
							width={160}
							height={48}
							style={{
								maxWidth: "200px",
								maxHeight: "200px",
								objectFit: "contain",
								marginTop: "8px",
							}}
						/>
					) : (
						<Typography variant="attributeText">
							{t("consortium.no_file_uploaded")}
						</Typography>
					)}
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="attributeText">
						{t("consortium.logo_about_requirements")}
					</Typography>
				</Grid>
				<form
					onSubmit={async (event) => {
						handleAboutFileUpload(event);
					}}
				>
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<FileUploadButton
							ref={aboutFileRef}
							icon={<CloudUpload />}
							buttonText={t("consortium.select_image")}
							href="#aboutFileUpload"
							isUploading={aboutIsUploading}
							onFileSelect={handleAboutFileSelect}
							previewUrl={aboutPreviewUrl}
							handleRemove={handleRemoveAbout}
						/>
						{aboutPreviewUrl ? (
							<Button
								variant="contained"
								type="submit"
								disabled={aboutIsUploading}
								sx={{ mt: 2 }}
							>
								{aboutIsUploading ? t("common.uploading") : t("common.upload")}
							</Button>
						) : null}
					</Grid>
				</form>
			</Grid>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={handleConfirmSave}
				type="pageEdit"
				editInformation={formatChangedFields(changedFields, consortium)}
				entityName={consortium?.displayName}
				entity={t("nav.consortium.name")}
				entityId={consortium?.id}
				gridEdit={false}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				type="unsavedChanges"
				entityName={consortium?.displayName}
				entity={t("nav.consortium.name")}
				entityId={consortium?.id}
				gridEdit={false}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				entity={t("nav.consortium.name")}
				alertTitle={alert.title}
			/>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
};

export default ConsortiumPage;
