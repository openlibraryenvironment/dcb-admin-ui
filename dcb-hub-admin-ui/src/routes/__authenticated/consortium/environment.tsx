import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import ConsortiumTabs from "@components/ConsortiumTabs/ConsortiumTabs";
import PageContainer from "@layout/PageContainer/PageContainer";

export const Route = createFileRoute("/__authenticated/consortium/environment")(
	{
		component: Environment,
	},
);

/**
 * Service versions, tracking configuration and RAG status, on a tab of their own.
 *
 * It used to sit at the foot of the onboarding page, under the grid of libraries that
 * still need attention. Those are two different questions - "which of my libraries is not
 * ready" and "what is this deployment running" - and stacking the second under the first
 * meant it was only ever found by somebody scrolling past the thing they came for.
 *
 * The same component also renders at /serviceInfo/serviceStatus, which is where a user
 * looking for service health goes rather than a user looking at their consortium. Both
 * routes sit on the same authenticated surface, so this adds a route to the information,
 * not an audience for it.
 */
function Environment() {
	const { t } = useTranslation();

	return (
		<PageContainer title={t("nav.consortium.environment")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 3 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<ConsortiumTabs current="environment" />
				</Grid>

				{/* No heading of our own: CombinedEnvironmentComponent renders its own h2
				    ("Your DCB environment"), so one here made two headings saying the same
				    thing - and /serviceInfo/serviceStatus, which renders the same
				    component, adds none either. */}
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<CombinedEnvironmentComponent />
				</Grid>
			</Grid>
		</PageContainer>
	);
}
