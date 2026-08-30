import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Alert, Stack, Typography } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import ThemeControls from "@components/ThemeControls/ThemeControls";
import LanguageSwitcher from "@layout/Header/LanguageSwitcher";

export const Route = createFileRoute("/__authenticated/settings/")({
	component: SettingsComponent,
});

/**
 * Where a choice made during setup is changed afterwards — W-6.
 *
 * This route existed and rendered the string "missing". Setup's first chapter offers the
 * theme, the mode, the typeface and the language, and a preference that can only be set
 * during a first-run flow is a preference somebody is stuck with - so the same controls
 * live here permanently.
 *
 * Everything on this page is per user and stored in this browser. Nothing here is a
 * property of the consortium and nothing here reaches a patron: a consortium-wide typeface
 * would let one administrator impose a typeface on a colleague who needs a different one,
 * and Symposia's typography belongs to its own theme registry.
 */
function SettingsComponent() {
	const { t } = useTranslation();

	return (
		<PageContainer title={t("nav.settings.name")}>
			<Stack spacing={4} sx={{ maxWidth: 680 }}>
				<Alert severity="info">{t("setup.appearance.scope_note")}</Alert>

				<section aria-labelledby="settings-appearance-heading">
					<Typography
						id="settings-appearance-heading"
						variant="h2"
						component="h2"
						sx={{ mb: 2 }}
					>
						{t("theme.appearance")}
					</Typography>
					<ThemeControls showFont />
				</section>

				<section aria-labelledby="settings-language-heading">
					<Typography
						id="settings-language-heading"
						variant="h2"
						component="h2"
						sx={{ mb: 2 }}
					>
						{t("profile.language")}
					</Typography>
					<LanguageSwitcher />
				</section>
			</Stack>
		</PageContainer>
	);
}
