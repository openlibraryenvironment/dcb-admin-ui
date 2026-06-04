import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@layout";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
//localisation
import { useTranslation } from "react-i18next";

const Mappings: NextPage = () => {
	const { t } = useTranslation();

	return (
		<AdminLayout title={t("nav.mappings.name")}>
			<List component="nav" aria-labelledby="mappings-title">
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/mappings/allNumericRange">
						<ListItemText primary={t("nav.mappings.allNumericRange")} />
					</ListItemButton>
				</ListItem>
				<ListItem component="nav" disablePadding>
					<ListItemButton component="a" href="/mappings/allReferenceValue">
						<ListItemText primary={t("nav.mappings.allReferenceValue")} />
					</ListItemButton>
				</ListItem>
			</List>
		</AdminLayout>
	);
};
