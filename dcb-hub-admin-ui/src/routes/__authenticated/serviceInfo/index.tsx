import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import ServiceCapabilities from "@components/ServiceCapabilities/ServiceCapabilities";
import { canManageDcbNcipOnboarding } from "@helpers/dcbNcipOnboarding";
import {
	isAuditExplorerEnabled,
	isNcipOnboardingEnabled,
} from "@helpers/featureFlags";

export const Route = createFileRoute("/__authenticated/serviceInfo/")({
	component: ServiceInfo,
});

function ServiceInfo() {
	const { t } = useTranslation();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = canManageDcbNcipOnboarding(userRoles);
	// Two independent gates on the same entry, and both are needed. The role decides who
	// may onboard; the flag decides whether this deployment's dcb-service can be asked at
	// all. Neither is a substitute for the other, and neither is the security control -
	// that is the route's own guard and dcb-service's @Secured.
	const showNcipOnboarding = isAnAdmin && isNcipOnboardingEnabled();

	return (
		<PageContainer title={t("nav.serviceInfo.name")}>
			<List component="nav" aria-labelledby="service-information">
				{showNcipOnboarding && (
					<ListItem disablePadding>
						<ListItemButton
							component={Link}
							to="/serviceInfo/dcbNcipOnboarding"
						>
							<ListItemText primary={t("nav.serviceInfo.dcbNcipOnboarding")} />
						</ListItemButton>
					</ListItem>
				)}
				<ListItem disablePadding>
					{/* Replaced 'a' tag with TanStack 'Link' for instantaneous SPA navigation */}
					<ListItemButton
						component={Link}
						to="/serviceInfo/catalogMetricsByHostLms"
					>
						<ListItemText
							primary={t("nav.serviceInfo.catalogMetricsByHostLms")}
						/>
					</ListItemButton>
				</ListItem>

				<ListItem disablePadding>
					<ListItemButton component={Link} to="/serviceInfo/serviceStatus">
						<ListItemText primary={t("nav.serviceInfo.serviceStatus")} />
					</ListItemButton>
				</ListItem>

				{isAnAdmin && (
					<ListItem disablePadding>
						<ListItemButton component={Link} to="/serviceInfo/dataChangeLog">
							<ListItemText primary={t("nav.serviceInfo.dataChangeLog")} />
						</ListItemButton>
					</ListItem>
				)}

				<ListItem disablePadding>
					<ListItemButton component={Link} to="/serviceInfo/requestErrors">
						<ListItemText primary={t("nav.serviceInfo.requestErrors.name")} />
					</ListItemButton>
				</ListItem>

				{isAuditExplorerEnabled() && (
					<ListItem disablePadding>
						<ListItemButton component={Link} to="/serviceInfo/auditExplorer">
							<ListItemText primary={t("nav.serviceInfo.auditExplorer")} />
						</ListItemButton>
					</ListItem>
				)}
			</List>

			{/* Which of this application's features the deployment's dcb-service can
			    actually serve, and whether each is switched on. Service Info is where
			    somebody already comes to ask what version is running, so it is where
			    the answer to "is the upgrade switch due yet" belongs. */}
			<ServiceCapabilities />
		</PageContainer>
	);
}
