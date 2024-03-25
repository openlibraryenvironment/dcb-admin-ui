import Link from "@components/Link/Link";
import { AdminLayout } from "@layout";
import {
	Card,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
} from "@mui/material";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const ServiceInfo: NextPage = () => {
	const { t } = useTranslation();
	return (
		<AdminLayout title={t("nav.serviceInfo.name")}>
			<List component="nav" aria-labelledby="service-information">
				<ListItem component="nav" disablePadding>
					<ListItemButton
						component="a"
						href="/serviceInfo/bibRecordCountByHostLms"
					>
						<ListItemText
							primary={t("nav.serviceInfo.bibRecordCountByHostLms")}
						/>
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

export default ServiceInfo;
