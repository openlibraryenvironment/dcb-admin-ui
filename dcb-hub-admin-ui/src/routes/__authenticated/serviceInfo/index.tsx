import { AdminLayout } from "@layout";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";

import { adminOrConsortiumAdmin } from "src/constants/roles";

const ServiceInfo: NextPage = () => {
	const { t } = useTranslation();
	const { data: session } = useSession();
	const isAValidAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	return (
		<AdminLayout title={t("nav.serviceInfo.name")}>
			<List component="nav" aria-labelledby="service-information">
				<ListItem component="nav" disablePadding>
					<ListItemButton
						component="a"
						href="/serviceInfo/catalogMetricsByHostLms"
					>
						<ListItemText
							primary={t("nav.serviceInfo.catalogMetricsByHostLms")}
						/>
					</ListItemButton>
				</ListItem>
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/serviceInfo/serviceStatus">
						<ListItemText primary={t("nav.serviceInfo.serviceStatus")} />
					</ListItemButton>
				</ListItem>
				{isAValidAdmin ? (
					<ListItem component="nav" disablePadding>
						<ListItemButton component="a" href="/serviceInfo/dataChangeLog">
							<ListItemText primary={t("nav.serviceInfo.dataChangeLog")} />
						</ListItemButton>
					</ListItem>
				) : null}
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/serviceInfo/requestErrors">
						<ListItemText primary={t("nav.serviceInfo.requestErrors.name")} />
					</ListItemButton>
				</ListItem>
			</List>
		</AdminLayout>
	);
};
export async function getStaticProps(ctx: any) {
	const { locale } = ctx;
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
}

export default ServiceInfo;
