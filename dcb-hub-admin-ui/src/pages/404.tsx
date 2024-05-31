import Error from "@components/Error/Error";
import { AdminLayout } from "@layout";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { capitaliseFirstCharacter } from "src/helpers/capitaliseFirstCharacter";

export default function NotFound() {
	const { t } = useTranslation();
	return (
		<AdminLayout
			title={t("404.page_title")}
			hideTitleBox={true}
			hideBreadcrumbs={true}
		>
			<Error
				title={t("ui.error.404.name")}
				message={t("ui.error.404.summary")}
				description={t("ui.error.404.description")}
				action={capitaliseFirstCharacter(t("ui.error.404.action"))}
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
