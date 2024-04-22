import { AdminLayout } from "@layout";
import Error from "@components/Error/Error";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Custom500Page() {
	const { t } = useTranslation();
	return (
		<AdminLayout hideBreadcrumbs>
			<Error
				title={t("ui.error.500.name")}
				message={t("ui.error.500.summary")}
				action={t("ui.action.go_home")}
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
