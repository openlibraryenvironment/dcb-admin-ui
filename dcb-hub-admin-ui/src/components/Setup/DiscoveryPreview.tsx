import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { SearchOutlined } from "@mui/icons-material";

import { previewArrangement } from "@constants/discoveryBranding";
import type { DiscoveryBrandValues } from "@schemas/discoveryBrandSchema";

interface DiscoveryPreviewProps {
	values: DiscoveryBrandValues;
	/** The consortium's display name, which the discovery app shows in its app bar. */
	consortiumName?: string;
}

/**
 * What a patron will see, drawn from the same values symposia-service serves. A mock rather
 * than a frame of the live app, and an approximation that says so on screen - see
 * docs/theming.md.
 */
export default function DiscoveryPreview({
	values,
	consortiumName,
}: DiscoveryPreviewProps) {
	const { t } = useTranslation();
	const theme = useTheme();

	const parts = previewArrangement(
		values,
		consortiumName,
		t("setup.discovery.preview_no_name"),
	);

	// The same radial wash symposia-ui paints when a consortium has supplied no
	// photograph. Kept in step by hand, which is the cost of two repos rendering one
	// brand - symposia-ui/docs/hero-canvas.md is the other half.
	const themeTreatment =
		"radial-gradient(120% 100% at 50% 0%, " +
		`${alpha(theme.palette.primary.main, 0.16)} 0%, ` +
		`${alpha(theme.palette.primary.main, 0.04)} 45%, ` +
		`${theme.palette.primary.landingBackground} 100%)`;

	return (
		<Stack spacing={1}>
			<Typography variant="attributeTitle" component="h2">
				{t("setup.discovery.preview_heading")}
			</Typography>

			<Paper
				variant="outlined"
				// aria-hidden: every value drawn in here is also present in the form
				// controls above, labelled and editable. Announced, this is a second
				// reading of the same six answers with no way to act on them.
				aria-hidden="true"
				sx={{
					overflow: "hidden",
					// Theme tokens, not literals: a hardcoded hex here would be a
					// dark-mode bug and a per-tenant-branding bug in one line.
					backgroundColor: "primary.landingBackground",
				}}
			>
				{/* The discovery app's app bar, which carries the consortium's name on every
				    screen. */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						px: 2,
						py: 1,
						backgroundColor: "primary.main",
						color: "primary.contrastText",
					}}
				>
					{parts.headerIcon && (
						<Box
							component="img"
							src={parts.headerIcon}
							alt=""
							sx={{ height: 24, width: 24, objectFit: "contain", flexShrink: 0 }}
						/>
					)}
					<Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
						{parts.appBarName}
					</Typography>
				</Box>

				<Box
					sx={{
						minHeight: 220,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: 1.5,
						p: 3,
						// With no photograph the discovery app draws its own theme
						// treatment, so the preview draws it too.
						backgroundImage: parts.background
							? `url(${parts.background})`
							: themeTreatment,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					{/* THE PLATE. symposia-ui puts the copy on its own ground rather than
					    washing the whole picture out. */}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 1.5,
							px: 3,
							py: 2,
							borderRadius: 1,
							maxWidth: 480,
							backgroundColor: alpha(theme.palette.background.default, 0.94),
						}}
					>
						{parts.logo && (
							<Box
								component="img"
								src={parts.logo}
								// Decorative inside a preview that is already aria-hidden;
								// the real alt text is the brandLogoAlt field above.
								alt=""
								sx={{ maxHeight: 64, maxWidth: "70%", objectFit: "contain" }}
							/>
						)}

						<Typography variant="h2" component="p" sx={{ textAlign: "center" }}>
							{t("setup.discovery.preview_task")}
						</Typography>

						{parts.welcome && (
							<Typography sx={{ textAlign: "center", maxWidth: 420 }}>
								{parts.welcome}
							</Typography>
						)}
					</Box>

					<Paper
						elevation={0}
						sx={{
							mt: 1,
							px: 2,
							py: 1,
							width: "min(100%, 420px)",
							display: "flex",
							alignItems: "center",
							gap: 1,
							backgroundColor: "background.paper",
						}}
					>
						<SearchOutlined fontSize="small" />
						<Typography variant="body2" sx={{ color: "text.secondary" }}>
							{t("setup.discovery.preview_search_placeholder")}
						</Typography>
					</Paper>
				</Box>
			</Paper>

			<Typography variant="body2" sx={{ color: "text.secondary" }}>
				{t("setup.discovery.preview_caveat")}
			</Typography>
		</Stack>
	);
}
