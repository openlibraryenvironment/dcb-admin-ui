import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";

import AdminLayout from "@layout/AdminLayout/AdminLayout";

export const Route = createFileRoute("/__authenticated/settings/")({
	component: SettingsComponent,
});

function SettingsComponent() {
	const { t } = useTranslation();

	return (
		<AdminLayout title={t("nav.settings.name")}>
			<Typography variant="h2">{t("common.missing")}</Typography>
		</AdminLayout>
	);
}
