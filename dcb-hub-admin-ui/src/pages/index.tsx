import type { NextPage } from "next";
import { AdminLayout } from "@layout";
import { Stack, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation, Trans } from "next-i18next"; //localisation
import Link from "@components/Link/Link";
import VersionInfo from "@components/HomeContent/VersionInfo";
import ConsortiumDetails from "@components/HomeContent/ConsortiumDetails";
import { RELEASE_PAGE_LINKS } from "../../homeData/homeConfig";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import EnvironmentDetails from "@components/HomeContent/EnvironmentDetails";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";

const Home: NextPage = () => {
	const router = useRouter();
	const { data: session, status }: { data: any; status: any } = useSession({
		required: true,
		onUnauthenticated() {
			// If user is not authenticated, push them to unauthorised page
			// At present, they will likely be kicked to the logout page first
			// However this is important for when we introduce RBAC.
			router.push("/unauthorised");
		},
	});

	const getUserName = () => {
		const nameOfUser = session?.profile?.given_name;
		if (nameOfUser == undefined) {
			return t("app.guest_user");
		} else {
			return nameOfUser;
		}
	};
	const { t } = useTranslation();

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.home").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout
			title={t("welcome.greeting") + " " + getUserName()}
			hideTitleBox={true}
		>
			<Stack direction="column" spacing={2}>
				<Typography variant="h1" sx={{ fontSize: 32 }}>
					{t("welcome.greeting") + " " + getUserName()}
				</Typography>
				<Typography variant="homePageText">
					{t("welcome.context", { consortium_name: "MOBIUS" })}
				</Typography>
				<Typography variant="h2" sx={{ fontSize: 32 }}>
					{t("consortium.your")}
				</Typography>
				<Typography variant="homePageText">
					{t("common.placeholder_text")}
				</Typography>
				<ConsortiumDetails />
				<Typography variant="h2" sx={{ marginBottom: 1, fontSize: 32 }}>
					{t("environment.your")}
				</Typography>
				<Typography variant="homePageText">
					{t("environment.configured_for")}
				</Typography>
				<EnvironmentDetails />
				<Typography variant="homePageText">
					{t("environment.compare_components")}
				</Typography>
				<VersionInfo />
				<Typography variant="homePageText">
					<Trans
						i18nKey="environment.releases_link"
						components={{
							linkToReleases: <Link href={RELEASE_PAGE_LINKS.ALL_RELEASES} />,
						}}
					></Trans>
				</Typography>
			</Stack>
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

export default Home;
