import Link from "@components/Link/Link";
import { AdminLayout } from "@layout";
import { Stack, Typography } from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function NotFound() {
	const { t } = useTranslation();
	return (
		<AdminLayout
			title={t("404.page_title")}
			hideTitleBox={true}
			hideBreadcrumbs={true}
		>
			<Stack direction="column" spacing={3} alignItems={"center"}>
				<Typography variant="notFoundTitle">{t("404.page_title")}</Typography>
				<Stack spacing={2} direction="column">
					<Typography variant="notFoundText">{t("404.page_text")}</Typography>
					<Typography variant="notFoundText">
						<Trans
							i18nKey={"404.go_back_text"}
							t={t}
							components={{
								linkComponent: (
									<Link key="return-to-dashboard-link-404" href="/" />
								),
							}}
						/>
					</Typography>
				</Stack>
			</Stack>
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
