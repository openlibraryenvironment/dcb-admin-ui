import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { Stack } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import TrackingBacklog from "@components/TrackingBacklog/TrackingBacklog";
import { environmentHealthQuery } from "@/queryOptions/environmentHealth";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/serviceStatus/",
)({
	component: ServiceStatus,
});

function ServiceStatus() {
	const { t } = useTranslation();
	const auth = useAuth();
	const isAdmin = auth?.user?.profile?.roles?.includes("ADMIN") ?? false;
	// The query CombinedEnvironmentComponent renders, read for its state alone. The backlog
	// waits for it: mounted under that component's short loading state, it was pushed 424px
	// down when the grids arrived (CLS 0.17 at 768x1024, e2e/layout-shift.spec.ts).
	const { isPending: environmentPending } = useQuery(
		environmentHealthQuery(auth.user?.access_token),
	);

	return (
		<PageContainer title={t("nav.serviceInfo.serviceStatus")}>
			<Stack spacing={4}>
				<CombinedEnvironmentComponent />
				{isAdmin && !environmentPending && <TrackingBacklog />}
			</Stack>
		</PageContainer>
	);
}
