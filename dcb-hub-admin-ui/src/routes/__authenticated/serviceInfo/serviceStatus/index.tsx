import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Stack } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import TrackingBacklog from "@components/TrackingBacklog/TrackingBacklog";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/serviceStatus/",
)({
	component: ServiceStatus,
});

function ServiceStatus() {
	const { t } = useTranslation();
	const auth = useAuth();
	const isAdmin = auth?.user?.profile?.roles?.includes("ADMIN") ?? false;

	return (
		<PageContainer title={t("nav.serviceInfo.serviceStatus")}>
			<Stack spacing={4}>
				<CombinedEnvironmentComponent />
				{isAdmin && <TrackingBacklog />}
			</Stack>
		</PageContainer>
	);
}
