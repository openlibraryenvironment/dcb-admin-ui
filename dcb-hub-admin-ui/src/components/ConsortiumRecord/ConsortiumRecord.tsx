import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { isEmpty } from "lodash";

import {
	Alert,
	AlertTitle,
	Button,
	Grid,
	MenuItem,
	TextField,
	Typography,
	useTheme,
	Stack,
} from "@mui/material";
import { Cancel, Edit, Save } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import ConsortiumTabs from "@components/ConsortiumTabs/ConsortiumTabs";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useUnsavedChangesWarning } from "@hooks/useUnsavedChangesWarning";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import useDCBServiceInfo from "@hooks/useDCBServiceInfo";
import { getConsortia } from "@queries/getConsortia";
import type {
	LoadConsortiumQueryVariables,
	UpdateConsortiumMutationVariables,
} from "@generated/graphql";

import { updateConsortiumQuery } from "@mutations/updateConsortium";
import {
	readConsortiumBrand,
	stripUnsupportedConsortiumInput,
} from "@helpers/consortiumBrand";
import { formatChangedFields } from "@helpers/formatChangedFields";
import { Consortium } from "@models/Consortium";
import Error from "@components/Error/Error";
import { CustomLinkButton } from "@components/CustomLink/CustomLink";
import MarkdownInput from "@components/MarkdownInput/MarkdownInput";
import { BrandImageField } from "@components/BrandImageField/BrandImageField";
import { themeOptions } from "@constants/discoveryBranding";
import { discoveryBrandFields } from "@schemas/discoveryBrandSchema";
import {
	BrandUploadError,
	hasStagedImages,
	uploadStagedBrandImages,
} from "@helpers/brandAssetUpload";
import {
	CONSORTIUM_QUERY_KEY,
	CONSORTIUM_QUERY_VARIABLES,
} from "@/queryOptions/consortiumRecord";

/**
 * Which label to name in an upload refusal. Three images on one form means the message
 * alone does not say which one was refused.
 */
const BRAND_FIELD_LABELS: Record<string, string> = {
	brandLogoUrl: "logo_url",
	brandHeaderIconUrl: "header_icon_url",
	brandBackgroundImageUrl: "background_image_url",
};

/**
 * The consortium record, rendered as two tabs over ONE form.
 *
 * <h2>Why a section prop and not two pages</h2>
 *
 * Saving here is not a simple mutation: it stages image uploads, diffs the form against
 * the record to find what actually changed, collects a reason through a confirmation
 * dialog, and reports the outcome. A second page for branding would have had to duplicate
 * all of that or diverge from it - and the two would drift the first time either was
 * fixed.
 *
 * So the machinery is shared and only the FIELDS differ. The form still holds every field,
 * which costs nothing: the diff compares against the loaded record, so fields the visible
 * section never touches compare equal and are not sent.
 *
 * <h2>Why branding is its own tab at all</h2>
 *
 * The brand block had grown to five fields and a theme choice sitting underneath the
 * consortium's name and description, with a heading trying to explain that the images below
 * were for a different application than the ones above. There were no images above - the
 * separate admin-chrome columns were merged away by V9_0_004 - so the explanation was
 * describing a page that no longer existed.
 *
 * <h2>The images ARE shared</h2>
 *
 * `brandLogoUrl` and `brandHeaderIconUrl` are what DCB Admin puts in its own app bar and
 * landing card AND what discovery renders. V9_0_004 replaced `about_image_url` and
 * `header_image_url` with them precisely so a consortium's mark is one asset that CSS
 * sizes, not four columns to keep in step. The help text now says so.
 */
export type ConsortiumRecordSection = "profile" | "branding";

interface ConsortiumRecordProps {
	section: ConsortiumRecordSection;
}

interface ConsortiumFormFields {
	displayName: string;
	websiteUrl?: string;
	catalogueSearchUrl?: string;
	description?: string;
	// Patron-facing brand (N-1B). These are rendered by the discovery app, not here.
	brandLogoUrl?: string;
	brandLogoAlt?: string;
	brandHeaderIconUrl?: string;
	brandBackgroundImageUrl?: string;
	patronWelcome?: string;
	defaultThemeName?: string;
}

/**
 * Whether an edit actually changed a field.
 *
 * An empty control and an unset column are the same state, and treating them as
 * different made every untouched optional field appear in the confirmation dialog as a
 * change the administrator was about to make. That was invisible while the form held four
 * mostly-populated fields; the brand fields are mostly empty, so it is not any more.
 */
function hasChanged(next: unknown, current: unknown): boolean {
	const normalise = (value: unknown) =>
		value === null || value === undefined ? "" : value;
	return normalise(next) !== normalise(current);
}

export default function ConsortiumRecord({ section }: ConsortiumRecordProps) {
	const { t } = useTranslation();
	const auth = useAuth();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const client = useDcbRestClient();
	const queryClient = useQueryClient();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const firstEditableFieldRef = useRef<HTMLInputElement>(null);

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

	// R-17b. A deployment with dcb.branding.assets.store=none has no upload route at all,
	// so the button would 404. The URL field stays either way - pointing at a CDN the
	// consortium already runs is a first-class route in, not a fallback.
	const { brandUploadsAvailable } = useDCBServiceInfo();

	const {
		data: gridData,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: CONSORTIUM_QUERY_KEY,
		queryFn: () =>
			gqlClient.request<any, LoadConsortiumQueryVariables>(
				getConsortia(),
				CONSORTIUM_QUERY_VARIABLES,
			),
	});

	// May legitimately be absent (no consortium configured yet) - the render guards
	// on it below. Typing it as a bare Consortium hid that from the compiler.
	const consortium = gridData?.consortia?.content?.[0] as
		Consortium | undefined;

	const validationSchema = Yup.object().shape({
		displayName: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", { field: t("consortium.display_name") }),
			)
			.max(200),
		description: Yup.string().trim().max(400),
		websiteUrl: Yup.string().trim().max(200),
		catalogueSearchUrl: Yup.string().trim().max(200),
		// The patron-facing brand rules live in one place, shared with setup's
		// discovery chapter - see @schemas/discoveryBrandSchema. Two hand-maintained
		// copies of a rule that mirrors a server validator is how one of them ends up
		// accepting what the server refuses.
		...discoveryBrandFields(t),
	});

	/**
	 * Brand images chosen but not yet uploaded, keyed by the field they belong to â€” R-17e.
	 *
	 * Uploading at pick time left a stored image behind every time somebody reconsidered or
	 * closed the tab. dcb-service cannot tell those from an image about to be used, so it
	 * keeps unreferenced uploads for a day and sweeps them; staging makes that the rare case
	 * rather than the ordinary one. The cost is that a rejected image is reported at Save.
	 */
	const [stagedImages, setStagedImages] = useState<Record<string, File | null>>(
		{},
	);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const stageImage = (field: string, file: File | null) => {
		setUploadError(null);
		setStagedImages((current) => ({ ...current, [field]: file }));
	};

	const {
		control,
		handleSubmit,
		reset,
		setValue,
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
			// The chrome images the app bar and the landing card render. V9_0_004
			// replaced headerImageUrl with brandHeaderIconUrl and aboutImageUrl with
			// brandLogoUrl, because a consortium's mark is one asset that CSS sizes, not
			// four columns - so which columns the response carries depends on the
			// deployment's dcb-service. readConsortiumBrand answers from either shape,
			// and always with a string: the store renders a fallback mark on "".
			const chrome = readConsortiumBrand(consortium);
			setHeaderImageURL(chrome.headerIconUrl);
			setAboutImageURL(chrome.logoUrl);
			reset({
				displayName: consortium.displayName ?? "",
				description: consortium.description ?? "",
				websiteUrl: consortium.websiteUrl ?? "",
				catalogueSearchUrl: consortium.catalogueSearchUrl ?? "",
				brandLogoUrl: consortium.brandLogoUrl ?? "",
				brandLogoAlt: consortium.brandLogoAlt ?? "",
				brandHeaderIconUrl: consortium.brandHeaderIconUrl ?? "",
				brandBackgroundImageUrl: consortium.brandBackgroundImageUrl ?? "",
				patronWelcome: consortium.patronWelcome ?? "",
				defaultThemeName: consortium.defaultThemeName ?? "",
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
		// The brand keys are stripped HERE, not at each caller. UpdateConsortiumInput
		// does not declare them before dcb-service 9.0.0, and an undeclared input field
		// fails the WHOLE mutation - so on 8.71.0 forgetting this at one call site means
		// nothing on the consortium form saves, brand or not.
		mutationFn: (variables: UpdateConsortiumMutationVariables) =>
			gqlClient.request<any, UpdateConsortiumMutationVariables>(
				updateConsortiumQuery(),
				{
					...variables,
					input: stripUnsupportedConsortiumInput(variables.input),
				} as UpdateConsortiumMutationVariables,
			),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["LoadConsortium"] }),
	});

	const onSubmit = async (formData: ConsortiumFormFields) => {
		if (!consortium) return;

		// Staged images are uploaded HERE, before the confirmation dialog rather than after
		// it. A refusal is the administrator's to act on, and asking them to confirm a save
		// that is about to be rejected would be asking them to approve something we already
		// know will not happen.
		let submitted = formData;

		if (hasStagedImages(stagedImages)) {
			setUploadError(null);

			try {
				const uploaded = await uploadStagedBrandImages(
					stagedImages,
					client,
					t("consortium.brand.upload_failed"),
				);

				// Into the form as well as the diff, so the URL box shows what was stored
				// rather than staying empty until the page is reloaded.
				Object.entries(uploaded).forEach(([field, url]) =>
					setValue(field as keyof ConsortiumFormFields, url, {
						shouldDirty: true,
					}),
				);

				submitted = { ...formData, ...uploaded };
				setStagedImages({});
			} catch (failure: unknown) {
				const field =
					failure instanceof BrandUploadError ? failure.field : undefined;

				setUploadError(
					field
						? t("consortium.brand.upload_failed_field", {
								label: t(`consortium.brand.${BRAND_FIELD_LABELS[field]}`),
								reason: (failure as BrandUploadError).message,
							})
						: t("consortium.brand.upload_failed"),
				);
				return;
			}
		}

		const newChangedFields = Object.keys(submitted).reduce((acc, key) => {
			const field = key as keyof ConsortiumFormFields;
			if (
				hasChanged(submitted[field], consortium[field]) &&
				submitted[field] !== undefined
			) {
				(acc[field] as any) = submitted[field];
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
		if (!consortium) return;
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
				title: t("ui.data_grid.success"),
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

	if (loading)
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document")}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	// No consortium is not an error, it is an unfinished installation - and it
	// used to be reported as "cannot retrieve record" with a "go back" button,
	// which told the one person who can fix it neither what was wrong nor how.
	if (!error && !consortium)
		return (
			<PageContainer title={t("nav.consortium.name")} hideBreadcrumbs>
				<Alert
					severity="warning"
					action={
						isAnAdmin ? (
							// Into the setup flow, which is the ONLY place a consortium is
							// created. It spans several sittings, has to survive a refresh and
							// a bookmark, and gets handed between colleagues - a dialog can do
							// none of that, and offering both was two implementations of one
							// job.
							<CustomLinkButton
								color="inherit"
								variant="outlined"
								to="/setup/$step"
								params={{ step: "consortium" }}
							>
								{t("consortium.new.title")}
							</CustomLinkButton>
						) : undefined
					}
				>
					<AlertTitle>{t("consortium.new.required_title")}</AlertTitle>
					{t("consortium.new.required_body")}
				</Alert>
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
			<ConsortiumTabs current={section} />

			{/* An upload refusal arrives at Save now that images are staged, so it belongs
			    at the top of the form rather than beside one field: the administrator has
			    just pressed a button and needs to know why nothing happened. role="alert"
			    because it appears in response to their action and moves no focus. */}
			{uploadError && (
				<Alert
					severity="error"
					role="alert"
					onClose={() => setUploadError(null)}
					sx={{ mb: 2 }}
				>
					{uploadError}
				</Alert>
			)}

			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				{section === "profile" && (
					<>
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
											<RenderAttribute
												attribute={consortium.catalogueSearchUrl}
											/>
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

						{/* Only the fields this tab is about. The FORM still holds every field - the
				    diff below compares against the loaded record, so anything the hidden
				    section never touched compares equal and is not sent. */}
					</>
				)}

				{section === "branding" && (
					<>
						{/* Patron-facing brand - N-1B, and now a tab of its own.
				    The old comment here said these were separate from "the two directly above,
				    which are the admin chrome's". There is nothing above: V9_0_004 merged
				    header_image_url and about_image_url INTO brandHeaderIconUrl and
				    brandLogoUrl, so one mark now serves both DCB Admin and discovery. */}
						<Grid size={{ xs: 4, sm: 8, md: 12 }}>
							<Typography variant="h3" sx={{ mt: 2 }}>
								{t("consortium.brand.section")}
							</Typography>
							<Typography variant="body1">
								{t("consortium.brand.section_help")}
							</Typography>
							{/* Said once, in the section, rather than three times in three help
					    texts. An administrator choosing between uploading and pasting a
					    CDN address deserves to know what the second one costs. */}
							{editMode && (
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ mt: 1 }}
								>
									{t("consortium.brand.external_url_cost")}
								</Typography>
							)}
						</Grid>

						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography
									variant="attributeTitle"
									color={
										errors.brandLogoUrl && editMode
											? "error"
											: "primary.attributeTitle"
									}
								>
									{t("consortium.brand.logo_url")}
								</Typography>
								<Controller
									name="brandLogoUrl"
									control={control}
									render={({ field }) =>
										editMode ? (
											<BrandImageField
												value={field.value ?? ""}
												onChange={field.onChange}
												stagedFile={stagedImages[field.name] ?? null}
												onStageFile={(file) => stageImage(field.name, file)}
												label={t("consortium.brand.logo_url")}
												uploadsAvailable={brandUploadsAvailable}
												error={!!errors.brandLogoUrl}
												helperText={
													errors.brandLogoUrl?.message ??
													t("consortium.brand.logo_url_help")
												}
											/>
										) : (
											<RenderAttribute attribute={consortium.brandLogoUrl} />
										)
									}
								/>
							</Stack>
						</Grid>

						{/* R-17d/R-17e. Two more images, each with the same two routes in: upload
				    into our bucket, or point at a CDN the consortium already runs. Neither
				    is the fallback for the other. */}
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography
									variant="attributeTitle"
									color={
										errors.brandHeaderIconUrl && editMode
											? "error"
											: "primary.attributeTitle"
									}
								>
									{t("consortium.brand.header_icon_url")}
								</Typography>
								<Controller
									name="brandHeaderIconUrl"
									control={control}
									render={({ field }) =>
										editMode ? (
											<BrandImageField
												value={field.value ?? ""}
												onChange={field.onChange}
												stagedFile={stagedImages[field.name] ?? null}
												onStageFile={(file) => stageImage(field.name, file)}
												label={t("consortium.brand.header_icon_url")}
												uploadsAvailable={brandUploadsAvailable}
												error={!!errors.brandHeaderIconUrl}
												helperText={
													errors.brandHeaderIconUrl?.message ??
													t("consortium.brand.header_icon_url_help")
												}
											/>
										) : (
											<RenderAttribute
												attribute={consortium.brandHeaderIconUrl}
											/>
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
										errors.brandBackgroundImageUrl && editMode
											? "error"
											: "primary.attributeTitle"
									}
								>
									{t("consortium.brand.background_image_url")}
								</Typography>
								<Controller
									name="brandBackgroundImageUrl"
									control={control}
									render={({ field }) =>
										editMode ? (
											<BrandImageField
												value={field.value ?? ""}
												onChange={field.onChange}
												stagedFile={stagedImages[field.name] ?? null}
												onStageFile={(file) => stageImage(field.name, file)}
												label={t("consortium.brand.background_image_url")}
												uploadsAvailable={brandUploadsAvailable}
												error={!!errors.brandBackgroundImageUrl}
												helperText={
													errors.brandBackgroundImageUrl?.message ??
													t("consortium.brand.background_image_url_help")
												}
											/>
										) : (
											<RenderAttribute
												attribute={consortium.brandBackgroundImageUrl}
											/>
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
										errors.brandLogoAlt && editMode
											? "error"
											: "primary.attributeTitle"
									}
								>
									{t("consortium.brand.logo_alt")}
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
												helperText={
													errors.brandLogoAlt?.message ??
													t("consortium.brand.logo_alt_help")
												}
											/>
										) : (
											<RenderAttribute attribute={consortium.brandLogoAlt} />
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
										errors.defaultThemeName && editMode
											? "error"
											: "primary.attributeTitle"
									}
								>
									{t("consortium.brand.theme")}
								</Typography>
								<Controller
									name="defaultThemeName"
									control={control}
									render={({ field }) =>
										editMode ? (
											// A list, not a text field, and not a colour picker. A theme
											// from the registry has been contrast-tested in every mode;
											// a hex an administrator types has not, and nothing here
											// could tell them it failed.
											<TextField
												{...field}
												select
												fullWidth
												error={!!errors.defaultThemeName}
												helperText={
													errors.defaultThemeName?.message ??
													t("consortium.brand.theme_help")
												}
											>
												<MenuItem value="">
													{t("consortium.brand.theme_default")}
												</MenuItem>
												{themeOptions(consortium.defaultThemeName).map(
													(name) => (
														<MenuItem key={name} value={name}>
															{name}
														</MenuItem>
													),
												)}
											</TextField>
										) : (
											<RenderAttribute
												attribute={consortium.defaultThemeName}
											/>
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
										errors.patronWelcome && editMode
											? "error"
											: "primary.attributeTitle"
									}
								>
									{t("consortium.brand.patron_welcome")}
								</Typography>
								<Controller
									name="patronWelcome"
									control={control}
									render={({ field }) =>
										editMode ? (
											<TextField
												{...field}
												fullWidth
												multiline
												minRows={2}
												error={!!errors.patronWelcome}
												helperText={
													errors.patronWelcome?.message ??
													t("consortium.brand.patron_welcome_help")
												}
											/>
										) : (
											<RenderAttribute attribute={consortium.patronWelcome} />
										)
									}
								/>
							</Stack>
						</Grid>
					</>
				)}
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
