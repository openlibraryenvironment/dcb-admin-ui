import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";

import LoginLayout from "@layout/LoginLayout/LoginLayout";
import ErrorComponent from "@components/Error/Error";

export const Route = createFileRoute("/maintenance")({
	component: MaintenancePage,
});

function MaintenancePage() {
	const { t } = useTranslation();

	return (
		<LoginLayout pageName={t("ui.error.503.page_title")}>
			<ErrorComponent
				title={t("ui.error.503.name")}
				message={t("ui.error.503.summary")}
				description={t("ui.error.503.description")}
				action={t("ui.error.503.action")}
				goBack="/logout"
			/>
		</LoginLayout>
	);
}
