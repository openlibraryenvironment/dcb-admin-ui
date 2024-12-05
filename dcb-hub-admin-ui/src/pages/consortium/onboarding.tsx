import { AdminLayout } from "@layout";
import { Tab, Tabs, Typography } from "@mui/material";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import ConsortiumDetails from "@components/HomeContent/ConsortiumDetails";
import EnvironmentDetails from "@components/HomeContent/EnvironmentDetails";

const Onboarding: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(2);
	const router = useRouter();

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
		switch (newValue) {
			case 0:
				router.push("/consortium");
				break;
			case 1:
				router.push("/consortium/functionalSettings");
				break;
			case 2:
				router.push("/consortium/onboarding");
				break;
			case 3:
				router.push("/consortium/contacts");
				break;
		}
	};

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
					onChange={handleTabChange}
					aria-label="Consortium Navigation"
				>
					<Tab label={t("nav.consortium.profile")} />
					<Tab label={t("nav.consortium.functionalSettings")} />
					<Tab label={t("nav.consortium.onboarding")} />
					<Tab label={t("nav.consortium.contacts")} />
				</Tabs>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="h2">{t("consortium.onboarding")}</Typography>
				</Grid>

				<Grid xs={4} sm={8} md={12}>
					<Typography variant="homePageText">
						{t("common.placeholder_text")}
					</Typography>
				</Grid>

				<Grid xs={4} sm={8} md={12}>
					<ConsortiumDetails />
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<EnvironmentDetails />
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
