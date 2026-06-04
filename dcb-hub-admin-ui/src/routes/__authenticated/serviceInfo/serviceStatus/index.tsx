import { createFileRoute } from "@tanstack/react-router";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";

import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";

const ServiceStatus: NextPage = () => {
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");
	const { t } = useTranslation();

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.serviceInfo.serviceStatus").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.serviceInfo.serviceStatus")}>
			<CombinedEnvironmentComponent />
		</AdminLayout>
	);
};
