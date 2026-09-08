import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { MenuItem, TextField } from "@mui/material";

import { BrandImageField } from "@components/BrandImageField/BrandImageField";
import { BRAND_LIMITS, themeOptions } from "@constants/discoveryBranding";
import type { DiscoveryBrandValues } from "@schemas/discoveryBrandSchema";

interface DiscoveryBrandFieldsProps {
	control: Control<DiscoveryBrandValues>;
	errors: FieldErrors<DiscoveryBrandValues>;
	/** Files chosen but not yet uploaded, keyed by field name. */
	stagedImages: Record<string, File | null>;
	onStageFile: (field: string, file: File | null) => void;
	/** False when dcb-service registers no upload controller — R-17b. */
	uploadsAvailable: boolean;
	/** Whatever theme is already stored, so an unknown one is offered rather than lost. */
	storedThemeName?: string;
}

/**
 * The six questions the discovery chapter asks.
 *
 * Split out of `DiscoveryChapter` because that component had grown to two jobs at 365
 * lines: what to ask, and what happens when it is answered. The second is the one with the
 * subtlety in it — staged uploads, a refusal that has to name which of three images failed,
 * and a form that must be settled against the server's answer before navigating — and it
 * was being read past 130 lines of entirely declarative `Controller` blocks to get to.
 *
 * This is not a reusable brand form and should not become one. The Consortium record page
 * asks the same six questions through `RenderAttribute` and an edit-mode toggle, which is a
 * different component shape for a different job; folding both into one parameterised
 * component would buy nothing and cost the ability to change either independently.
 */
export default function DiscoveryBrandFields({
	control,
	errors,
	stagedImages,
	onStageFile,
	uploadsAvailable,
	storedThemeName,
}: DiscoveryBrandFieldsProps) {
	const { t } = useTranslation();

	const image = (
		name: "brandLogoUrl" | "brandHeaderIconUrl" | "brandBackgroundImageUrl",
		labelKey: string,
		helpKey: string,
	) => (
		<Controller
			name={name}
			control={control}
			render={({ field }) => (
				<BrandImageField
					value={field.value ?? ""}
					onChange={field.onChange}
					stagedFile={stagedImages[field.name] ?? null}
					onStageFile={(file) => onStageFile(field.name, file)}
					label={t(labelKey)}
					uploadsAvailable={uploadsAvailable}
					error={!!errors[name]}
					helperText={errors[name]?.message ?? t(helpKey)}
				/>
			)}
		/>
	);

	return (
		<Fragment>
			{image(
				"brandLogoUrl",
				"consortium.brand.logo_url",
				"consortium.brand.logo_url_help",
			)}

			<Controller
				name="brandLogoAlt"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="setup-brand-logo-alt"
						label={t("consortium.brand.logo_alt")}
						fullWidth
						error={!!errors.brandLogoAlt}
						helperText={
							errors.brandLogoAlt?.message ?? t("consortium.brand.logo_alt_help")
						}
					/>
				)}
			/>

			{image(
				"brandHeaderIconUrl",
				"consortium.brand.header_icon_url",
				"consortium.brand.header_icon_url_help",
			)}

			{image(
				"brandBackgroundImageUrl",
				"consortium.brand.background_image_url",
				"consortium.brand.background_image_url_help",
			)}

			<Controller
				name="patronWelcome"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="setup-patron-welcome"
						label={t("consortium.brand.patron_welcome")}
						fullWidth
						multiline
						rows={2}
						slotProps={{ htmlInput: { maxLength: BRAND_LIMITS.patronWelcome } }}
						error={!!errors.patronWelcome}
						helperText={
							errors.patronWelcome?.message ??
							t("consortium.brand.patron_welcome_help")
						}
					/>
				)}
			/>

			<Controller
				name="defaultThemeName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="setup-default-theme-name"
						select
						label={t("consortium.brand.theme")}
						fullWidth
						error={!!errors.defaultThemeName}
						helperText={
							errors.defaultThemeName?.message ?? t("consortium.brand.theme_help")
						}
					>
						<MenuItem value="">{t("consortium.brand.theme_default")}</MenuItem>
						{/* themeOptions folds in whatever is stored, so a deployment running a
						    discovery build we have never heard of keeps its theme instead of
						    having it silently cleared on save. */}
						{themeOptions(storedThemeName).map((name) => (
							<MenuItem key={name} value={name}>
								{name}
							</MenuItem>
						))}
					</TextField>
				)}
			/>
		</Fragment>
	);
}
