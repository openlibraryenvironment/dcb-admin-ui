import { createFileRoute } from "@tanstack/react-router";
import PageContainer from "@layout/PageContainer/PageContainer";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
//localisation
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/__authenticated/mappings/")({
	component: MappingsRouteComponent,
});

function MappingsRouteComponent() {
	const { t } = useTranslation();

	return (
		<PageContainer title={t("nav.mappings.name")}>
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
		</PageContainer>
	);
}
