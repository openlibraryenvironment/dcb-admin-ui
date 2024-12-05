import type { NextPage } from "next";
import { AdminLayout } from "@layout";
import { Stack, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next"; //localisation
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import OperatingWelcome from "@components/OperatingWelcome/OperatingWelcome";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
// The DCB Admin Home Page.
// Now without launch-date-based conditional display, with onboarding components moved to the 'onboarding' page in the consortium section.
// Shows consortium information and libraries
const Home: NextPage = () => {
	const router = useRouter();
	const { data: session, status }: { data: any; status: any } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});
	const { t } = useTranslation();
	const nameOfUser = session?.profile?.given_name ?? t("app.guest_user");
	const { displayName } = useConsortiumInfoStore();

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
			title={t("welcome.greeting", { user: nameOfUser })}
			hideTitleBox={true}
		>
			<Stack direction="column" spacing={2}>
				<Typography variant="h1">
					{t("welcome.greeting", { user: nameOfUser })}
				</Typography>
				<Typography variant="homePageText">
					{t("welcome.context", { consortium_name: displayName })}
				</Typography>
				<Typography variant="h2">{t("consortium.your")}</Typography>
				<OperatingWelcome />
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
