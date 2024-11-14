import { AdminLayout } from "@layout";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";

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
		<AdminLayout title={t("nav.consortium.name")}>
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

			{tabIndex === 1 && (
				<Box sx={{ py: 4 }}>
					<Typography variant="h4" gutterBottom>
						Consortium Onboarding
					</Typography>
					<Typography>
						This is the Consortium onboarding page, where you can find details
						about the organization and its members.
					</Typography>
				</Box>
			)}
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
