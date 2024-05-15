import Error from "@components/Error/Error";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Unauthorised() {
	const { t } = useTranslation();
	return (
		<AdminLayout hideTitleBox={true} hideBreadcrumbs={true}>
			<Error
				title={t("ui.error.401.name")}
				message={t("ui.error.401.summary")}
				description={t("ui.error.401.description")}
				action={t("ui.error.401.action")}
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
