import { AdminLayout } from "@layout";
import { Grid, Tab, Tabs, Typography } from "@mui/material";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
import ConsortiumDetails from "@components/HomeContent/ConsortiumDetails";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import { handleConsortiumTabChange } from "src/helpers/navigation/handleTabChange";

const Onboarding: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(2);
	const router = useRouter();

	return (
		<AdminLayout title={t("nav.consortium.onboarding")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
			>
				<Tabs
					value={tabIndex}
					onChange={(event, value) => {
						handleConsortiumTabChange(event, value, router, setTabIndex);
					}}
					aria-label="Consortium Navigation"
				>
					<Tab label={t("nav.consortium.profile")} />
					<Tab label={t("nav.consortium.functionalSettings")} />
					<Tab label={t("nav.consortium.onboarding")} />
					<Tab label={t("nav.consortium.contacts")} />
				</Tabs>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2">{t("consortium.onboarding")}</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="homePageText">
						{t("common.placeholder_text")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<ConsortiumDetails />
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<CombinedEnvironmentComponent />
				</Grid>
			</Grid>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
	const { locale } = context;
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
};

export default Onboarding;
