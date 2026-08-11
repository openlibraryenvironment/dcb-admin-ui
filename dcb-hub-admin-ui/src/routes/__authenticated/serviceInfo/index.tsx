import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import { canManageDcbNcipOnboarding } from "@helpers/dcbNcipOnboarding";
import { isAuditExplorerEnabled } from "@helpers/featureFlags";

export const Route = createFileRoute("/__authenticated/serviceInfo/")({
	component: ServiceInfo,
});

function ServiceInfo() {
	const { t } = useTranslation();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = canManageDcbNcipOnboarding(userRoles);

	return (
		<PageContainer title={t("nav.serviceInfo.name")}>
			<List component="nav" aria-labelledby="service-information">
				{isAnAdmin && (
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
		</PageContainer>
	);
}
