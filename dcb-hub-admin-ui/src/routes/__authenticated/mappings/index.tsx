import { createFileRoute, Link } from "@tanstack/react-router";
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
			{/* page-title is the id PageContainer gives the <h1>. The previous values -
			    "mappings-title" and "service-information" - were defined nowhere in the
			    application, so this landmark had no accessible name and the reference was
			    dangling: axe aria-valid-attr-value, serious. Two navigation landmarks on
			    the page (this and the sidebar) and only one of them named. */}
			<List component="nav" aria-labelledby="page-title">
				<ListItem disablePadding>
					<ListItemButton component={Link} to="/mappings/allNumericRange">
						<ListItemText primary={t("nav.mappings.allNumericRange")} />
					</ListItemButton>
				</ListItem>
				<ListItem disablePadding>
					<ListItemButton component={Link} to="/mappings/allReferenceValue">
						<ListItemText primary={t("nav.mappings.allReferenceValue")} />
					</ListItemButton>
				</ListItem>
			</List>
		</PageContainer>
	);
}
