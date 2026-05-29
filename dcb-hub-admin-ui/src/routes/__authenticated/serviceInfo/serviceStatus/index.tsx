import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";

import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";

const ServiceStatus: NextPage = () => {
	const { status } = useSession();
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

export async function getStaticProps(ctx: any) {
	const { locale } = ctx;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
}

export default ServiceStatus;
