import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/serviceStatus/",
)({
	component: ServiceStatus,
});

function ServiceStatus() {
	const { t } = useTranslation();

	return (
		<AdminLayout title={t("nav.serviceInfo.serviceStatus")}>
			<CombinedEnvironmentComponent />
		</AdminLayout>
	);
}
