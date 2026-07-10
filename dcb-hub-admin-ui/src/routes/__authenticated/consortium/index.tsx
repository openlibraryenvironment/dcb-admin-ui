import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { isEmpty } from "lodash";

import {
	Button,
	Grid,
	Tab,
	Tabs,
	TextField,
	Typography,
	useTheme,
	Box,
	Stack,
} from "@mui/material";
import { Cancel, CloudUpload, Edit, Save } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";
import FileUploadButton from "@components/FileUploadButton/FileUploadButton";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useUnsavedChangesWarning } from "@hooks/useUnsavedChangesWarning";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { getConsortia } from "@queries/getConsortia";
import { updateConsortiumQuery } from "@mutations/updateConsortium";
import { formatChangedFields } from "@helpers/formatChangedFields";
import { Consortium } from "@models/Consortium";
import Error from "@components/Error/Error";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import MarkdownInput from "@components/MarkdownInput/MarkdownInput";

const DEFAULT_PAGINATION_MODEL = { page: 0, pageSize: 10 };
const DEFAULT_SORT_MODEL = [{ field: "name", sort: "asc" }];
const DEFAULT_FILTER_MODEL = { items: [] };

export const Route = createFileRoute("/__authenticated/consortium/")({
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global
		// network/401 error handler in main.tsx before __authenticated.tsx's
		// own component-level auth-gate redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: [
				"groups",
				DEFAULT_PAGINATION_MODEL,
				DEFAULT_SORT_MODEL,
				DEFAULT_FILTER_MODEL,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any>(getConsortia, {
					query: "",
					pageno: DEFAULT_PAGINATION_MODEL.page,
					pagesize: DEFAULT_PAGINATION_MODEL.pageSize,
					order: DEFAULT_SORT_MODEL[0].field,
					orderBy: "ASC",
				}),
		});
	},
	component: ConsortiumPage,
});

interface ConsortiumFormFields {
	displayName: string;
	websiteUrl?: string;
	catalogueSearchUrl?: string;
	description?: string;
}

function ConsortiumPage() {
	const { t } = useTranslation();
	const auth = useAuth();
	const router = useRouter();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const appHeaderFileRef = useRef<HTMLInputElement>(null);
	const aboutFileRef = useRef<HTMLInputElement>(null);
	const firstEditableFieldRef = useRef<HTMLInputElement>(null);

	const [headerIsUploading, setHeaderIsUploading] = useState(false);
	const [aboutIsUploading, setAboutIsUploading] = useState(false);
	const [appHeaderPreviewUrl, setAppHeaderPreviewUrl] = useState("");
	const [aboutPreviewUrl, setAboutPreviewUrl] = useState("");

	const [editMode, setEditMode] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [changedFields, setChangedFields] = useState<Partial<Consortium>>({});
	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
		title: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});

	const {
		setHeaderImageURL,
		setDisplayName,
		setAboutImageURL,
		setCatalogueSearchURL,
		setWebsiteURL,
		setDescription,
	} = useConsortiumInfoStore();

	const {
		data: gridData,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["LoadConsortium"],
		queryFn: () =>
			gqlClient.request<any>(getConsortia, {
				order: "id",
				orderBy: "DESC",
				pageno: 0,
				pagesize: 1,
			}),
	});

	const consortium: Consortium = gridData?.consortia?.content?.[0];

	const validationSchema = Yup.object().shape({
		displayName: Yup.string()
			.trim()
			.required(t("validation.required"))
			.max(200),
		description: Yup.string().trim().max(400),
		websiteUrl: Yup.string().trim().max(200),
		catalogueSearchUrl: Yup.string().trim().max(200),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<ConsortiumFormFields>({
		// @hookform/resolvers@5 tightened the Resolver generics: yup infers
		// unset fields as `string | undefined` (required key), which no longer
		// unifies with the optional properties on ConsortiumFormFields. The
		// shapes are equivalent at runtime, so pin the resolver to the form type.
		resolver: yupResolver(
			validationSchema,
		) as unknown as Resolver<ConsortiumFormFields>,
		mode: "onChange",
	});

	useEffect(() => {
		if (consortium) {
			setDescription(consortium.description);
			setWebsiteURL(consortium.websiteUrl);
			setCatalogueSearchURL(consortium.catalogueSearchUrl);
			setDisplayName(consortium.displayName);
			setHeaderImageURL(consortium.headerImageUrl);
			setAboutImageURL(consortium.aboutImageUrl);
			reset({
				displayName: consortium.displayName ?? "",
				description: consortium.description ?? "",
				websiteUrl: consortium.websiteUrl ?? "",
				catalogueSearchUrl: consortium.catalogueSearchUrl ?? "",
			});
		}
	}, [
		consortium,
		reset,
		setDescription,
		setWebsiteURL,
		setCatalogueSearchURL,
		setDisplayName,
		setHeaderImageURL,
		setAboutImageURL,
	]);

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning(isDirty);

	const { mutateAsync: updateConsortium } = useMutation({
		mutationFn: (variables: any) =>
			gqlClient.request(updateConsortiumQuery, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["LoadConsortium"] }),
	});

	useEffect(() => {
		return () => {
			if (appHeaderPreviewUrl) URL.revokeObjectURL(appHeaderPreviewUrl);
			if (aboutPreviewUrl) URL.revokeObjectURL(aboutPreviewUrl);
		};
	}, [appHeaderPreviewUrl, aboutPreviewUrl]);

	const onSubmit = (formData: ConsortiumFormFields) => {
		const newChangedFields = Object.keys(formData).reduce((acc, key) => {
			const field = key as keyof ConsortiumFormFields;
			if (
				formData[field] !== consortium[field] &&
				formData[field] !== undefined
			) {
				(acc[field] as any) = formData[field];
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

	const handleConfirmSave = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		try {
			await updateConsortium({
				input: {
					id: consortium.id,
					reason,
					changeCategory,
					changeReferenceUrl,
					...changedFields,
				},
			});
			setAlert({
				open: true,
				severity: "success",
				text: t("ui.data_grid.updated"),
				title: t("ui.success"),
			});
			setEditMode(false);
			setChangedFields({});
		} catch {
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.error.update_failed"),
				title: t("ui.error.title"),
			});
		} finally {
			setConfirmationEdit(false);
		}
	};

	const validateImageSize = (
		file: File,
		width: number,
		height: number,
	): Promise<boolean> => {
		return new Promise((resolve, reject) => {
			const img = document.createElement("img");
			img.onload = () => {
				URL.revokeObjectURL(img.src);
				resolve(img.width <= width && img.height === height);
			};
			img.onerror = () => {
				URL.revokeObjectURL(img.src);
				reject(false);
			};
			img.src = URL.createObjectURL(file);
		});
	};

	const handleFileUpload = async (
		fileRef: React.RefObject<HTMLInputElement | null>,
		isHeader: boolean,
	) => {
		const file = fileRef.current?.files?.[0];
		if (!file) return;

		const isValidSize = await validateImageSize(
			file,
			isHeader ? 36 : 180,
			isHeader ? 36 : 48,
		);
		if (!isValidSize) {
			setAlert({
				open: true,
				severity: "error",
				text: t("consortium.invalid_image_size"),
				title: t("ui.error.title"),
			});
			return;
		}

		const formData = new FormData();
		formData.append("file", file);
		const uploadUrl =
			import.meta.env.VITE_DCB_API_BASE + "/persistentAssets/serverUpload";

		try {
			if (isHeader) setHeaderIsUploading(true);
			else setAboutIsUploading(true);
			const res = await fetch(uploadUrl, {
				method: "POST",
				body: formData,
				headers: { Authorization: `Bearer ${auth.user?.access_token}` },
			});
			const { url } = await res.json();

			await updateConsortium({
				input: {
					id: consortium.id,
					[isHeader ? "headerImageUrl" : "aboutImageUrl"]: url,
					reason: `Update of consortium ${isHeader ? "header" : "about"} image`,
					changeCategory: "Initial setup",
				},
			});

			if (isHeader) setAppHeaderPreviewUrl("");
			else setAboutPreviewUrl("");
			if (fileRef.current) fileRef.current.value = "";
			setAlert({
				open: true,
				severity: "success",
				text: t("ui.success"),
				title: t("ui.success"),
			});
		} catch {
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.error.update_failed"),
				title: t("ui.error.title"),
			});
		} finally {
			if (isHeader) setHeaderIsUploading(false);
			else setAboutIsUploading(false);
		}
	};

	if (loading)
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document")}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	if (error || !consortium)
		return (
			<PageContainer hideBreadcrumbs>
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					action={t("ui.actions.go_back")}
					goBack="/locations"
					message={t("consortium.no_consortium_setup")}
				/>
			</PageContainer>
		);

	return (
		<PageContainer
			title={t("nav.consortium.name")}
			mode={editMode ? "edit" : "view"}
			pageActions={
				editMode
					? [
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
									reset();
									setEditMode(false);
									setChangedFields({});
								}}
							>
								{t("ui.data_grid.cancel")}
							</Button>,
						]
					: [
							{
								key: "edit",
								onClick: () => setEditMode(true),
								disabled: !isAnAdmin,
								label: t("ui.data_grid.edit"),
								startIcon: (
									<Edit htmlColor={theme.palette.primary.exclamationIcon} />
								),
							},
						]
			}
		>
			<Tabs
				value={0}
				onChange={(_, val) =>
					router.navigate({
						to: [
							"/consortium",
							"/consortium/functionalSettings",
							"/consortium/onboarding",
							"/consortium/contacts",
						][val],
					})
				}
				sx={{ mb: 3 }}
			>
				<Tab label={t("nav.consortium.profile")} />
				<Tab label={t("nav.consortium.functionalSettings")} />
				<Tab label={t("nav.consortium.onboarding")} />
				<Tab label={t("nav.consortium.contacts")} />
			</Tabs>

			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("consortium.name")}
						</Typography>
						<RenderAttribute attribute={consortium.name} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography
							variant="attributeTitle"
							color={
								errors.displayName && editMode
									? "error"
									: "primary.attributeTitle"
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
										error={!!errors.displayName}
										helperText={errors.displayName?.message}
									/>
								) : (
									<RenderAttribute attribute={consortium.displayName} />
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
								errors.websiteUrl && editMode
									? "error"
									: "primary.attributeTitle"
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
										error={!!errors.websiteUrl}
										helperText={errors.websiteUrl?.message}
									/>
								) : (
									<RenderAttribute attribute={consortium.websiteUrl} />
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
								errors.catalogueSearchUrl && editMode
									? "error"
									: "primary.attributeTitle"
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
										error={!!errors.catalogueSearchUrl}
										helperText={errors.catalogueSearchUrl?.message}
									/>
								) : (
									<RenderAttribute attribute={consortium.catalogueSearchUrl} />
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
								errors.description && editMode
									? "error"
									: "primary.attributeTitle"
							}
						>
							{t("consortium.description_title")}
						</Typography>
						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<MarkdownInput
									{...field}
									editMode={editMode}
									error={!!errors.description}
									helperText={errors.description?.message}
								/>
							)}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("consortium.logo_app_header")}
						</Typography>
						{consortium.headerImageUrl ? (
							<Box
								component="img"
								src={consortium.headerImageUrl}
								sx={{ maxWidth: 200, maxHeight: 200, mt: 1 }}
							/>
						) : (
							<Typography>{t("consortium.no_file_uploaded")}</Typography>
						)}
						<FileUploadButton
							ref={appHeaderFileRef}
							icon={<CloudUpload />}
							buttonText={t("consortium.select_image")}
							href="#appHeaderUpload"
							isUploading={headerIsUploading}
							onFileSelect={(e) =>
								setAppHeaderPreviewUrl(URL.createObjectURL(e.target.files![0]))
							}
							previewUrl={appHeaderPreviewUrl}
							handleRemove={() => setAppHeaderPreviewUrl("")}
						/>
						{appHeaderPreviewUrl && (
							<Button
								variant="outlined"
								onClick={() => handleFileUpload(appHeaderFileRef, true)}
								disabled={headerIsUploading}
								sx={{ mt: 2 }}
							>
								{headerIsUploading ? t("common.uploading") : t("common.upload")}
							</Button>
						)}
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Typography variant="attributeTitle">
						{t("consortium.logo_about")}
					</Typography>
					{consortium.aboutImageUrl ? (
						<Box
							component="img"
							src={consortium.aboutImageUrl}
							sx={{ maxWidth: 200, maxHeight: 200, mt: 1 }}
						/>
					) : (
						<Typography>{t("consortium.no_file_uploaded")}</Typography>
					)}
					<FileUploadButton
						ref={aboutFileRef}
						icon={<CloudUpload />}
						buttonText={t("consortium.select_image")}
						href="#aboutFileUpload"
						isUploading={aboutIsUploading}
						onFileSelect={(e) =>
							setAboutPreviewUrl(URL.createObjectURL(e.target.files![0]))
						}
						previewUrl={aboutPreviewUrl}
						handleRemove={() => setAboutPreviewUrl("")}
					/>
					{aboutPreviewUrl && (
						<Button
							variant="outlined"
							onClick={() => handleFileUpload(aboutFileRef, false)}
							disabled={aboutIsUploading}
							sx={{ mt: 2 }}
						>
							{aboutIsUploading ? t("common.uploading") : t("common.upload")}
						</Button>
					)}
				</Grid>
			</Grid>

			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={handleConfirmSave}
				action="gridEdit"
				editInformation={formatChangedFields(changedFields, consortium)}
				entityName={consortium?.displayName}
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
