import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@layout";
import Error from "@components/Error/Error";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/500")({
	component: Custom500Page,
});

function Custom500Page() {
	const { t } = useTranslation();
	return (
		<AdminLayout hideBreadcrumbs>
			<Error
				title={t("ui.error.500.name")}
				message={t("ui.error.500.summary")}
				description={t("ui.error.500.description")}
				action={t("ui.error.500.action")}
				goBack="/"
			/>
		</AdminLayout>
	);
}
