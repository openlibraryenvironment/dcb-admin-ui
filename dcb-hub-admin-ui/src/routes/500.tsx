import { AdminLayout } from "@layout";
import Error from "@components/Error/Error";
import { useTranslation } from "react-i18next";

export default function Custom500Page() {
	const { t } = useTranslation();
	return (
		<AdminLayout hideBreadcrumbs>
			<Error
				title={t("ui.error.500.name")}
				message={t("ui.error.500.summary")}
				description={t("ui.error.500.description")}
				action={t("ui.error.500.action")}
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
