import { AdminLayout } from "@layout";
import Error from "@components/Error/Error";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function MaintenancePage() {
	const { t } = useTranslation();

	return (
		<AdminLayout hideBreadcrumbs title={t("ui.error.503.page_title")}>
			<Error
				title={t("ui.error.503.name") || "Maintenance"}
				message={t("ui.error.503.summary") || "System Under Maintenance"}
				description={
					t("ui.error.503.description") ||
					"The service is currently unavailable. Please try again later."
				}
				action={t("ui.error.503.action") || "Refresh Page"}
				goBack="/"
			/>
		</AdminLayout>
	);
}

export async function getStaticProps({ locale }: { locale: any }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
				"application",
				"common",
				"validation",
			])),
		},
	};
}
