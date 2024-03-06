import Link from "@components/Link/Link";
import { AdminLayout } from "@layout";
import { Card, List, ListItem } from "@mui/material";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const ServiceInfo: NextPage = () => {
    const { t } = useTranslation();
    return (
        <AdminLayout title={t("nav.serviceInfo.name")}>
            <List component={Card} elevation={3}>
                <ListItem>
                    <Link href="/serviceInfo/bibRecordCountByHostLms">{t("nav.serviceInfo.bibRecordCountByHostLms")}</Link>
                </ListItem>
            </List>
        </AdminLayout>
    )
}
export const getServerSideProps: GetServerSideProps = async (context) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}
	return {
		props: {
			...translations,
		}
	};
};

export default ServiceInfo;
