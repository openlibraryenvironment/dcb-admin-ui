import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";

import PageContainer from "@layout/PageContainer/PageContainer";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/serviceStatus/",
)({
	component: ServiceStatus,
});

function ServiceStatus() {
	const { t } = useTranslation();

	return (
		<PageContainer title={t("nav.serviceInfo.serviceStatus")}>
			<CombinedEnvironmentComponent />
		</PageContainer>
	);
}
