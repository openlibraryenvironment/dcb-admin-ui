import { AdminLayout } from "@layout";
import { useTranslation } from "react-i18next";

import Typography from "@mui/material/Typography";

const Settings: NextPage = () => {
	const { t } = useTranslation();
	return (
		<AdminLayout title={t("nav.settings.name")}>
			<Typography variant="h2">{t("common.missing")}</Typography>
		</AdminLayout>
	);
};

export async function getStaticProps({ locale }: { locale: string }) {
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

export default Settings;
