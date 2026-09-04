import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	AlertTitle,
	LinearProgress,
	Stack,
	Typography,
} from "@mui/material";

import DiscoveryBrandFields from "./DiscoveryBrandFields";
import DiscoveryPreview from "../DiscoveryPreview";
import SetupFooter from "../SetupFooter";
import { useSetupNavigation } from "@hooks/useSetupNavigation";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import useDCBServiceInfo from "@hooks/useDCBServiceInfo";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import {
	BrandUploadError,
	hasStagedImages,
	uploadStagedBrandImages,
} from "@helpers/brandAssetUpload";
import {
	discoveryBrandSchema,
	type DiscoveryBrandValues,
} from "@schemas/discoveryBrandSchema";
import { updateConsortiumQuery } from "@mutations/updateConsortium";
import { stripUnsupportedConsortiumInput } from "@helpers/consortiumBrand";
import type { UpdateConsortiumMutationVariables } from "@generated/graphql";
import { useRegisterSetupDirty } from "../setupRun";

/** Which label to name in an upload refusal - three images on one form. */
const BRAND_FIELD_LABELS: Record<string, string> = {
	brandLogoUrl: "logo_url",
	brandHeaderIconUrl: "header_icon_url",
	brandBackgroundImageUrl: "background_image_url",
};

/**
 * C5 — "How should discovery look to your patrons?"
 *
 * The UI text says "discovery", not "Symposia". Symposia is the product's name, not
 * necessarily what a consortium calls the thing its patrons search - the whole point of
 * this chapter is that they brand it themselves - and "discovery" is what the rest of this
 * application already calls it. The name stays in code and comments, where it identifies
 * which service we mean.
 *
 * <h2>Cross-repo position</h2>
 *
 * Every field written here already exists on `UpdateConsortiumInput` and is already read by
 * symposia-ui from `GET /api/branding`. There is NO contract change and no symposia-ui work
 * in this chapter: it is a better place to answer questions the record page could already
 * answer, not a new capability.
 *
 * <h2>Uploads are staged, not immediate</h2>
 *
 * Same bargain as the consortium page: choosing a file does not store it. Uploading at pick
 * time leaves an orphaned image behind every time somebody reconsiders, and dcb-service
 * cannot tell those from an image about to be used. The upload happens on save, and a
 * refusal is reported at the top of the chapter because that is where the user just acted.
 *
 * <h2>Skipping is a real answer</h2>
 *
 * An unbranded discovery service works. A consortium that has not decided its marks yet
 * must be able to say so and move on, and the progress model records that as settled
 * rather than asking again forever.
 */
export default function DiscoveryChapter() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const restClient = useDcbRestClient();
	const queryClient = useQueryClient();
	const { goNext, goBack, skipAndContinue } = useSetupNavigation("discovery");
	const { consortium } = useConsortiumSetup();

	// R-17b: a deployment with dcb.branding.assets.store=none registers no upload
	// controller at all, so the button could only ever 404. The URL field stays either
	// way - pointing at a CDN the consortium already runs is a first-class route in.
	const { brandUploadsAvailable } = useDCBServiceInfo();

	const [error, setError] = useState<string | null>(null);
	const [isBusy, setBusy] = useState(false);
	const [stagedImages, setStagedImages] = useState<Record<string, File | null>>(
		{},
	);
	const isSubmitting = useRef(false);

	const {
		control,
		getValues,
		reset,
		setValue,
		trigger,
		formState: { errors, isDirty },
	} = useForm<DiscoveryBrandValues>({
		mode: "onTouched",
		resolver: yupResolver(discoveryBrandSchema(t)) as any,
		defaultValues: {
			brandLogoUrl: consortium?.brandLogoUrl ?? "",
			brandLogoAlt: consortium?.brandLogoAlt ?? "",
			brandHeaderIconUrl: consortium?.brandHeaderIconUrl ?? "",
			brandBackgroundImageUrl: consortium?.brandBackgroundImageUrl ?? "",
			patronWelcome: consortium?.patronWelcome ?? "",
			defaultThemeName: consortium?.defaultThemeName ?? "",
		},
	});

	// Tells the layout there is unsaved work here, so leaving the chapter asks first.
	useRegisterSetupDirty("discovery", isDirty);

	// useWatch, not a root-level watch(): the preview needs these six values and nothing
	// else, and a root watch re-renders the whole chapter on every keystroke in any field.
	const previewValues = useWatch({ control }) as DiscoveryBrandValues;

	const stageImage = (field: string, file: File | null) =>
		setStagedImages((current) => ({ ...current, [field]: file }));

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

	const handleContinue = async () => {
		if (isSubmitting.current || !consortium) return;
		isSubmitting.current = true;
		setBusy(true);
		setError(null);

		try {
			if (!(await trigger())) return;

			let values = getValues();

			if (hasStagedImages(stagedImages)) {
				try {
					const uploaded = await uploadStagedBrandImages(
						stagedImages,
						restClient,
						t("consortium.brand.upload_failed"),
					);
					// Into the form as well as the payload, so the URL box shows what
					// was stored rather than staying empty until a reload.
					Object.entries(uploaded).forEach(([field, url]) =>
						setValue(field as keyof DiscoveryBrandValues, url),
					);
					values = { ...values, ...uploaded };
					setStagedImages({});
				} catch (failure: unknown) {
					const field =
						failure instanceof BrandUploadError ? failure.field : undefined;
					setError(
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

			await updateConsortium({
				input: {
					id: consortium.id,
					reason: "Initial discovery branding",
					changeCategory: "Initial setup",
					// Sent as written, empty string included: an explicit empty CLEARS
					// the column, which is how an administrator removes a mark they
					// uploaded by mistake.
					brandLogoUrl: values.brandLogoUrl ?? "",
					brandLogoAlt: values.brandLogoAlt ?? "",
					brandHeaderIconUrl: values.brandHeaderIconUrl ?? "",
					brandBackgroundImageUrl: values.brandBackgroundImageUrl ?? "",
					patronWelcome: values.patronWelcome ?? "",
					defaultThemeName: values.defaultThemeName ?? "",
				},
			});

			// Settle the form against what was just saved BEFORE navigating. Without this
			// the values are still "dirty" relative to the defaults, so the layout's
			// unsaved-work guard fires on the flow's OWN Continue - warning the user they
			// are about to lose work that has this moment been written to the server.
			reset(getValues());
			goNext();
		} catch (failure: any) {
			console.error("Discovery branding save failed:", failure);
			setError(describeGraphQLError(failure, t("setup.discovery.error")));
		} finally {
			setBusy(false);
			isSubmitting.current = false;
		}
	};

	return (
		<Stack spacing={2}>
			<div style={{ height: 4 }}>{isBusy && <LinearProgress />}</div>

			{error && (
				<Alert severity="error" role="alert" onClose={() => setError(null)}>
					<AlertTitle>{t("setup.discovery.error")}</AlertTitle>
					{error}
				</Alert>
			)}

			<DiscoveryPreview
				values={previewValues}
				consortiumName={consortium?.displayName ?? consortium?.name}
			/>

			<Typography variant="body2" sx={{ color: "text.secondary" }}>
				{t("consortium.brand.external_url_cost")}
			</Typography>

			<DiscoveryBrandFields
				control={control}
				errors={errors}
				stagedImages={stagedImages}
				onStageFile={stageImage}
				uploadsAvailable={brandUploadsAvailable}
				storedThemeName={consortium?.defaultThemeName}
			/>

			<SetupFooter
				onBack={goBack}
				onContinue={handleContinue}
				continueLabel={t("setup.actions.save_and_continue")}
				onSkip={skipAndContinue}
				skipLabel={t("setup.discovery.skip")}
				busy={isBusy}
			/>
		</Stack>
	);
}
