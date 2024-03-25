import { GetServerSideProps, NextPage } from "next";
import { AdminLayout } from "@layout";
import {
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	useTheme,
} from "@mui/material";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Mappings: NextPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<AdminLayout title={t("nav.mappings.name")}>
			<List component="nav" aria-labelledby="mappings-title">
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/mappings/all">
						<ListItemText primary={t("nav.mappings.all")} />
					</ListItemButton>
				</ListItem>
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/mappings/circulationStatus">
						<ListItemText primary={t("nav.mappings.circulationStatus")} />
					</ListItemButton>
				</ListItem>
			</List>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
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

export default Mappings;
