import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Outlet,
	useNavigate,
	useLocation,
} from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Tab, Typography, Button, Stack, Alert } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import PageContainer from "@layout/PageContainer/PageContainer";
import StaffRequest from "@forms/StaffRequest/StaffRequest";
import ExpeditedCheckout from "@forms/ExpeditedCheckout/ExpeditedCheckout";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getClustersTitleOnly } from "@queries/getClustersTitlesOnly";

export const Route = createFileRoute("/__authenticated/search/$clusterId")({
	component: ClusterLayout,
});

function ClusterLayout() {
	const { clusterId } = Route.useParams();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showStaffRequest, setShowStaffRequest] = useState(false);
	const [showExpeditedCheckout, setShowExpeditedCheckout] = useState(false);

	const { data, isLoading, error } = useQuery({
		queryKey: ["cluster", "titleOnly", clusterId],
		queryFn: () =>
			gqlClient.request<any>(getClustersTitleOnly, {
				query: `id: ${clusterId}`,
			}),
		enabled: !!clusterId,
	});

	const title =
		isLoading || error
			? clusterId
			: data?.instanceClusters?.content?.[0]?.title;

	// Determine active tab based on the current URL path
	const currentPath = location.pathname;
	let activeTab = "cluster";
	if (currentPath.endsWith("/explanation")) activeTab = "explanation";
	if (currentPath.endsWith("/items")) activeTab = "items";
	if (currentPath.endsWith("/identifiers")) activeTab = "identifiers";
	if (currentPath.endsWith("/history")) activeTab = "history";

	const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
		const destination =
			newValue === "cluster"
				? `/search/${clusterId}`
				: `/search/${clusterId}/${newValue}`;
		navigate({ to: destination });
	};

	const pageActions = [
		{
			key: "staffRequest",
			onClick: () => setShowStaffRequest(true),
			disabled: !isAnAdmin,
			label: t("staff_request.actions.place"),
		},
		{
			key: "expeditedCheckout",
			onClick: () => setShowExpeditedCheckout(true),
			disabled: !isAnAdmin,
			label: t("expedited_checkout.steps.checkout"),
		},
	];

	return (
		<PageContainer
			title={t("search.cluster_title", { record: title })}
			pageActions={pageActions}
		>
			{/* Modals */}
			{showStaffRequest && (
				<StaffRequest
					show={showStaffRequest}
					onClose={() => setShowStaffRequest(false)}
					bibClusterId={clusterId}
				/>
			)}
			{showExpeditedCheckout && (
				<ExpeditedCheckout
					show={showExpeditedCheckout}
					onClose={() => setShowExpeditedCheckout(false)}
					bibClusterId={clusterId}
				/>
			)}

			{/* Source Record Error Banner */}
			{(error as any)?.message?.includes("Source emitted") && (
				<Alert severity="info" sx={{ mb: 2 }}>
					<Typography variant="attributeText">
						{t("search.cluster_bib_multiple_records")}
					</Typography>
				</Alert>
			)}

			<TabContext value={activeTab}>
				<TabList onChange={handleTabChange} variant="scrollable" sx={{ mb: 3 }}>
					<Tab label={t("nav.search.cluster")} value="cluster" />
					<Tab label={t("nav.search.cluster_explainer")} value="explanation" />
					<Tab label={t("nav.search.items")} value="items" />
					<Tab label={t("nav.search.identifiers")} value="identifiers" />
					<Tab label={t("nav.search.requesting_history")} value="history" />
				</TabList>

				<TabPanel value={activeTab} sx={{ p: 0 }}>
					<Outlet />
				</TabPanel>
			</TabContext>
		</PageContainer>
	);
}
