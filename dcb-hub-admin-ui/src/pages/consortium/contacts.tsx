import { AdminLayout } from "@layout";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";

const Policies: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(3); // needs to match order of tab
	const router = useRouter();
	// Need custom tab components for accessibility + more

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
		switch (newValue) {
			case 0:
				router.push("/consortium");
				break;
			case 1:
				router.push("/consortium/policies");
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
				<Tab label={t("nav.consortium.policies")} />
				<Tab label={t("nav.consortium.onboarding")} />
				<Tab label={t("nav.consortium.contacts")} />
			</Tabs>

			<Box sx={{ py: 4 }}>
				<Typography variant="h4" gutterBottom>
					Consortium Contacts
				</Typography>
				<Typography>This is the Consortium Contacts page</Typography>
			</Box>
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

export default Policies;
