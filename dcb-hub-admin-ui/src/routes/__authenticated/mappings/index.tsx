import { createFileRoute, Link } from "@tanstack/react-router";
import PageContainer from "@layout/PageContainer/PageContainer";
import {
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
} from "@mui/material";
//localisation
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/__authenticated/mappings/")({
	component: MappingsRouteComponent,
});

function MappingsRouteComponent() {
	const { t } = useTranslation();

	return (
		<PageContainer title={t("nav.mappings.name")}>
			{/* The landmark and the list are separate elements, as Sidebar.tsx already
			    documents: rendering the List itself as <nav> replaces the <ul>, which
			    leaves every <li> with no list to belong to - axe `listitem`, serious,
			    and a screen reader that no longer announces how many destinations there
			    are. `aria-labelledby` names it from the id PageContainer gives the <h1>;
			    the previous ids were defined nowhere, so the reference dangled. */}
			<Box component="nav" aria-labelledby="page-title">
				<List>
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
			</Box>
		</PageContainer>
	);
}
