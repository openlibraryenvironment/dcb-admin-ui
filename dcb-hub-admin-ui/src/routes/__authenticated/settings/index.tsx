import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";

export const Route = createFileRoute("/__authenticated/settings/")({
	component: SettingsComponent,
});

function SettingsComponent() {
	const { t } = useTranslation();

	return (
		<PageContainer title={t("nav.settings.name")}>
			<Typography variant="h2">{t("common.missing")}</Typography>
		</PageContainer>
	);
}
