import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@layout/AdminLayout/AdminLayout";
import { useTranslation } from "react-i18next";

import Typography from "@mui/material/Typography";
export const Settings = createFileRoute("/__authenticated/settings/")({
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
