import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import {
	Box,
	Button,
	Stack,
	Tab,
	Tabs,
	Typography,
	useTheme,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { PutBlobResult } from "@vercel/blob";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import EditableAttribute from "src/helpers/EditableAttribute/EditableAttribute";
import { getConsortia, updateConsortiumQuery } from "src/queries/queries";
import {
	handleSaveConfirmation,
	handleCancellation,
	updateField,
	handleSave,
	handleEdit,
} from "src/helpers/actions/editAndDeleteActions";
import { Consortium } from "@models/Consortium";
// import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import { Cancel, CloudUpload, Edit, Save } from "@mui/icons-material";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import FileUploadButton from "@components/FileUploadButton/FileUploadButton";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";

// If this ever needs to be extended to support multiple consortia
// Change current flat structure to [id] structure similar to libraries
// And have a consortium grid page
// or only show active consortia

// check upload button for image upload
const ConsortiumPage: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(0);
	const { data: session } = useSession();
	const router = useRouter();
	const appHeaderFileRef = useRef<HTMLInputElement>(null);
	const aboutFileRef = useRef<HTMLInputElement>(null);

	const [appHeaderBlob, setAppHeaderBlob] = useState<PutBlobResult | null>(
		null,
	);
	const [aboutFileBlob, setAboutFileBlob] = useState<PutBlobResult | null>(
		null,
	);
	const [isUploading, setIsUploading] = useState(false);

	const firstEditableFieldRef = useRef<HTMLInputElement>(null);
	const [hasValidationError, setValidationError] = useState(false);
	const [isDirty, setDirty] = useState(false);
	const [errors, setErrors] = useState();
	const { data, loading, error } = useQuery(getConsortia, {
		variables: {
			order: "id",
			orderBy: "DESC",
			pageno: 0,
			pagesize: 10,
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
	const [editKey, setEditKey] = useState(0);
	const theme = useTheme();
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [editableFields, setEditableFields] = useState({
		displayName: consortium?.displayName,
		websiteUrl: consortium?.websiteUrl,
		catalogueSearchUrl: consortium?.catalogueSearchUrl,
		description: consortium?.description,
	});
	const [changedFields, setChangedFields] = useState<Partial<Consortium>>({});

	const [updateConsortium] = useMutation(updateConsortiumQuery, {
		refetchQueries: ["LoadConsortium"],
	});
	// const [selectedFileName, setSelectedFileName] = useState<string>("");

	const {
		setHeaderImageURL,
		setDisplayName,
		setAboutImageURL,
		setCatalogueSearchURL,
		setWebsiteURL,
		setDescription,
	} = useConsortiumInfoStore();

	const [appHeaderFileName, setAppHeaderFileName] = useState<string>("");
	const [appHeaderPreviewUrl, setAppHeaderPreviewUrl] = useState<string>("");
	const [aboutFileName, setAboutFileName] = useState<string>("");
	const [aboutPreviewUrl, setAboutPreviewUrl] = useState<string>("");

	// Handlers for file selection
	const handleAppHeaderFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setAppHeaderFileName(file.name);
			const objectUrl = URL.createObjectURL(file);
			setAppHeaderPreviewUrl(objectUrl);
		}
	};

	const handleAboutFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setAboutFileName(file.name);
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
		setAboutFileName("");
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
		setAppHeaderFileName("");
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
		if (changedFields.displayName) {
			setDisplayName(changedFields.displayName);
		}
		if (changedFields.catalogueSearchUrl) {
			setCatalogueSearchURL(changedFields.catalogueSearchUrl);
		}
		if (changedFields.websiteUrl) {
			setWebsiteURL(changedFields.websiteUrl);
		}
		if (changedFields.description) {
			setDescription(changedFields.description);
		}
		await handleSaveConfirmation(
			consortium,
			changedFields,
			updateConsortium,
			client,
			setEditMode,
			setChangedFields,
			setAlert,
			setConfirmationEdit,
			t,
			reason,
			changeCategory,
			changeReferenceUrl,
			"updateConsortium",
			t("nav.consortium.name").toLowerCase(),
		);
	};

	const handleCancel = () => {
		handleCancellation(
			setEditMode,
			setEditableFields,
			consortium,
			setChangedFields,
			setDirty,
			setValidationError,
			setEditKey,
		);
	};

	const updateFieldInApp = (field: string, value: any) => {
		updateField(field, value, setEditableFields, setChangedFields, consortium);
	};

	const username = session?.user?.name;
	const email = session?.user?.email ?? "No email provided";

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
		switch (newValue) {
			case 0:
				router.push("/consortium");
				break;
			case 1:
				router.push("/consortium/functionalSettings");
				break;
			case 2:
				router.push("/consortium/onboarding");
				break;
			case 3:
				router.push("/consortium/contacts");
				break;
		}
	};
	const viewModeActions = [
		{
			key: "edit",
			onClick: () => {
				handleEdit(
					consortium,
					setEditMode,
					setEditableFields,
					firstEditableFieldRef,
				);
			},
			disabled: !isAnAdmin,
			label: t("ui.data_grid.edit"),
			startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
		},
	];

	const editModeActions = [
		<Button
			key="save"
			startIcon={<Save />}
			onClick={() => {
				handleSave(changedFields, setEditMode, setConfirmationEdit);
			}}
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
					key: "edit",
					onClick: () => {
						handleEdit(
							consortium,
							setEditMode,
							setEditableFields,
							firstEditableFieldRef,
						);
					},
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
			<AdminLayout>
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
				<Grid xs={4} sm={8} md={12}>
					<Tabs
						value={tabIndex}
						onChange={handleTabChange}
						aria-label="Consortium Navigation"
					>
						<Tab label={t("nav.consortium.profile")} />
						<Tab label={t("nav.consortium.functionalSettings")} />
						<Tab label={t("nav.consortium.onboarding")} />
						<Tab label={t("nav.consortium.contacts")} />
					</Tabs>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("consortium.name")}
						</Typography>
						<RenderAttribute attribute={consortium?.name} />
					</Stack>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["name"] && editMode
									? theme.palette.error.main
									: theme.palette.common.black
							}
						>
							{t("consortium.display_name")}
						</Typography>
						<EditableAttribute
							field="displayName"
							key={`displayName-${editKey}`}
							value={editableFields?.displayName ?? consortium?.displayName}
							updateField={updateFieldInApp}
							editMode={editMode}
							type="string"
							inputRef={firstEditableFieldRef}
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
						/>
					</Stack>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="attributeTitle">
						{t("consortium.logo_app_header")}
					</Typography>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography>
						{/* Fix so file name is persisted even after it's removed from preview. Should be auto removed from preview on successful upload */}
						{(appHeaderFileName ?? appHeaderBlob?.pathname) ||
							t("mappings.no_file_selected")}
					</Typography>
					{appHeaderBlob && (
						<Box sx={{ mt: 3 }}>
							<Image
								src={appHeaderBlob.url}
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
						</Box>
					)}
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography>
						{t("consortium.logo_app_header_requirements")}
					</Typography>
				</Grid>
				<form
					onSubmit={async (event) => {
						setIsUploading(true);
						event.preventDefault();
						if (!appHeaderFileRef.current?.files) {
							throw new Error("No file selected");
						}
						const file = appHeaderFileRef.current.files[0];
						const newName =
							file.name +
							`consortium${consortium.displayName}user${username}.png`;
						const response = await fetch(
							`/api/persistentAssets/serverUpload?filename=${newName}`,
							{
								method: "POST",
								body: file,
							},
						);
						const newBlob = (await response.json()) as PutBlobResult;
						setAppHeaderBlob(newBlob);
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
						setIsUploading(false);
					}}
				>
					<Grid xs={4} sm={8} md={12}>
						<FileUploadButton
							ref={appHeaderFileRef}
							icon={<CloudUpload />}
							buttonText={t("consortium.select_image")}
							href="#appHeaderUpload"
							isUploading={isUploading}
							onFileSelect={handleAppHeaderFileSelect}
							previewUrl={appHeaderPreviewUrl}
							handleRemove={handleRemoveAppHeader}
						/>
						{appHeaderFileName ? (
							<Button
								variant="outlined"
								type="submit"
								disabled={isUploading}
								sx={{ mt: 2 }}
							>
								{isUploading ? "Uploading..." : "Upload"}
							</Button>
						) : null}
					</Grid>
				</form>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="h2">
						{t("consortium.landing_page_title")}
					</Typography>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="body1">
						{t("consortium.landing_page_subheader")}
					</Typography>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["name"] && editMode
									? theme.palette.error.main
									: theme.palette.common.black
							}
						>
							{t("consortium.url")}
						</Typography>
						<EditableAttribute
							field="websiteUrl"
							key={`websiteUrl-${editKey}`}
							value={editableFields.websiteUrl ?? consortium?.websiteUrl}
							updateField={updateFieldInApp}
							editMode={editMode}
							type="string"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
						/>
					</Stack>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["name"] && editMode
									? theme.palette.error.main
									: theme.palette.common.black
							}
						>
							{t("consortium.search_url")}
						</Typography>
						<EditableAttribute
							field="catalogueSearchUrl"
							key={`catalogueSearchUrl-${editKey}`}
							value={
								editableFields.catalogueSearchUrl ??
								consortium?.catalogueSearchUrl
							}
							updateField={updateFieldInApp}
							editMode={editMode}
							type="string"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
						/>
					</Stack>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors?.["name"] && editMode
									? theme.palette.error.main
									: theme.palette.common.black
							}
						>
							{t("consortium.description_title")}
						</Typography>
						<EditableAttribute
							field="description"
							key={`description-${editKey}`}
							value={editableFields.description ?? consortium?.description}
							updateField={updateFieldInApp}
							editMode={editMode}
							type="markdown"
							setValidationError={setValidationError}
							setDirty={setDirty}
							setErrors={setErrors}
						/>
					</Stack>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="attributeTitle">
						{t("consortium.logo_about")}
					</Typography>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography>
						{aboutFileName || t("mappings.no_file_selected")}
					</Typography>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="attributeText">
						{t("consortium.logo_about_requirements")}
					</Typography>
				</Grid>
				<form
					onSubmit={async (event) => {
						setIsUploading(true);
						event.preventDefault();
						if (!aboutFileRef.current?.files) {
							throw new Error("Could not update user");
						}
						const file = aboutFileRef.current.files[0];
						const newName =
							file.name +
							`consortium${consortium.displayName}user${username}.png`;
						const response = await fetch(
							`/api/persistentAssets/serverUpload?filename=${newName}`,
							{
								method: "POST",
								body: file,
							},
						);
						const newBlob = (await response.json()) as PutBlobResult;
						setAboutFileBlob(newBlob);
						setAboutFileName(newBlob.url);
						setAboutImageURL(newBlob.url);
						await updateConsortium({
							variables: {
								input: {
									id: consortium.id,
									aboutImageUrl: newBlob.url,
									aboutImageUploader: username,
									aboutImageUploaderEmail: email,
									reason: "Update of consortium header image",
									changeCategory: "Initial setup",
								},
							},
						});
						setIsUploading(false);
					}}
				>
					<Grid xs={4} sm={8} md={12}>
						<FileUploadButton
							ref={aboutFileRef}
							icon={<CloudUpload />}
							buttonText={t("consortium.select_image")}
							href="#aboutFileUpload"
							isUploading={isUploading}
							onFileSelect={handleAboutFileSelect}
							previewUrl={aboutPreviewUrl}
							handleRemove={handleRemoveAbout}
						/>
						<Button
							variant="contained"
							type="submit"
							disabled={isUploading}
							sx={{ mt: 2 }}
						>
							{isUploading ? "Uploading..." : "Upload"}
						</Button>
					</Grid>

					<Grid xs={4} sm={8} md={12}>
						{aboutFileBlob && (
							<Box sx={{ mt: 3 }}>
								<Typography variant="subtitle1">Uploaded Image:</Typography>
								<Image
									src={aboutFileBlob.url}
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
							</Box>
						)}
					</Grid>
				</form>
			</Grid>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={handleConfirmSave}
				type="pageEdit"
				editInformation={formatChangedFields(changedFields, consortium)}
				library={consortium?.displayName}
				entity={t("nav.consortium.name")}
				entityId={consortium?.id}
			/>
			{/* <Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				type="unsavedChanges"
				library={consortium?.displayName}
				entity={t("nav.consortium.name")}
				entityId={consortium?.id}
			/> */}
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

{
	/* <form
				onSubmit={async (event) => {
					setIsUploading(true);
					event.preventDefault();

					if (!inputFileRef.current?.files) {
						throw new Error("No file selected");
					}

					const file = inputFileRef.current.files[0];

					const newBlob = await upload(file.name, file, {
						access: "public",
						handleUploadUrl: "/api/persistentAssets/imageUpload",
						clientPayload: JSON.stringify({
							userId: userId,
							username: username,
							email: email,
						}),
					});

					setBlob(newBlob);
					setIsUploading(false);
				}}
			>
				<input name="file" ref={inputFileRef} type="file" required />
				<Button
					variant="contained"
					type="submit"
					disabled={isUploading || !isAnAdmin}
					sx={{ mt: 2 }}
				>
					{isUploading ? "Uploading..." : "Upload"}
				</Button>
			</form> */
}
{
	/* <Grid xs={4} sm={8} md={12}>
						<input name="file" ref={appHeaderFileRef} type="file" required />
					</Grid>
					<Grid xs={4} sm={8} md={12}>
						<button type="submit">Upload</button>
					</Grid> */
}
