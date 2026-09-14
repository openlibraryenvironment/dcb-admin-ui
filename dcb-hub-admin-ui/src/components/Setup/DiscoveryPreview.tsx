import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { SearchOutlined } from "@mui/icons-material";

import { isValidLogoUrl } from "@constants/discoveryBranding";
import type { DiscoveryBrandValues } from "@schemas/discoveryBrandSchema";

interface DiscoveryPreviewProps {
	values: DiscoveryBrandValues;
	/** The consortium's display name, which is the lockup's text when there is no logo. */
	consortiumName?: string;
}

/**
 * What a patron will see — W-8.
 *
 * The argument for this chapter existing at all is that today nobody can see what they are
 * branding: the fields sit in a 971-line staff record page and the result appears in a
 * different application, on a different origin, that the administrator may never open.
 *
 * <h2>A mock, not an iframe</h2>
 *
 * Framing the live Symposia app would need its origin to be reachable from the admin
 * console and would need a frame-ancestors decision taken for the sake of a thumbnail. So
 * this draws the lockup itself, from the same values symposia-service will serve.
 *
 * It is therefore an APPROXIMATION and says so on screen. It shows the arrangement - mark,
 * name, welcome sentence, canvas - not the discovery app's exact typography or spacing,
 * and it deliberately does not try to: a preview that claims to be pixel-exact and is not
 * is worse than one that admits what it is.
 *
 * <h2>Only what would really render</h2>
 *
 * `isValidLogoUrl` is the same check symposia-ui runs on read and dcb-service runs on
 * write. Applying it here means the preview cannot show an image the patron app would
 * reject, which is the whole point of showing anything.
 */
export default function DiscoveryPreview({
	values,
	consortiumName,
}: DiscoveryPreviewProps) {
	const { t } = useTranslation();
	const theme = useTheme();

	const logo = isValidLogoUrl(values.brandLogoUrl)
		? values.brandLogoUrl?.trim()
		: undefined;
	const background = isValidLogoUrl(values.brandBackgroundImageUrl)
		? values.brandBackgroundImageUrl?.trim()
		: undefined;

	const name = consortiumName?.trim() || t("setup.discovery.preview_no_name");

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
						// treatment, so the preview draws it too - an operator who clears
						// the image must see what they are switching TO, not a flat panel
						// that the product never renders.
						backgroundImage: background ? `url(${background})` : themeTreatment,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					{/* THE PLATE. symposia-ui puts the copy on its own ground rather than
					    washing the whole picture out, so a preview that draws the copy
					    straight onto the photograph is showing an arrangement the product
					    does not render. */}
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
						{logo ? (
							<Box
								component="img"
								src={logo}
								// Decorative inside a preview that is already aria-hidden;
								// the real alt text is the brandLogoAlt field above.
								alt=""
								sx={{ maxHeight: 64, maxWidth: "70%", objectFit: "contain" }}
							/>
						) : (
							<Typography variant="h2" sx={{ textAlign: "center" }}>
								{name}
							</Typography>
						)}

						{values.patronWelcome?.trim() && (
							<Typography sx={{ textAlign: "center", maxWidth: 420 }}>
								{values.patronWelcome.trim()}
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
