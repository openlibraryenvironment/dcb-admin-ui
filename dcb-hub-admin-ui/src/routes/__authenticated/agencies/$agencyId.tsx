import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Stack, Typography } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAgency } from "@queries/getAgency";
import { Agency } from "@models/Agency";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { agencyParamsSchema } from "@schemas/routeParams/agencyParams";

export const Route = createFileRoute("/__authenticated/agencies/$agencyId")({
	params: {
		parse: (raw) => agencyParamsSchema.parse(raw),
	},
	// Prefetches into the same query cache entry the component's useQuery
	// below reads (identical queryKey) - see docs/architecture.md.
	loader: ({ context: { queryClient, cfg, auth }, params: { agencyId } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global
		// network/401 error handler in main.tsx before __authenticated.tsx's
		// own component-level auth-gate redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: ["agency", agencyId],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any>(getAgency, {
					query: `id:${agencyId}`,
				}),
		});
	},
	component: AgencyDetails,
});

function AgencyDetails() {
	const { t } = useTranslation();
	const { agencyId } = Route.useParams();
	const gqlClient = useGraphQLClient();

	const { data, isLoading, error } = useQuery({
		queryKey: ["agency", agencyId],
		queryFn: () =>
			gqlClient.request<any>(getAgency, { query: `id:${agencyId}` }),
		enabled: !!agencyId,
		refetchInterval: 120000,
	});

	const agency: Agency = data?.agencies?.content?.[0];

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("agencies.agencies_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (error || !agency) {
		return (
			<PageContainer hideBreadcrumbs>
				<Error
					title={
						error
							? t("ui.error.cannot_retrieve_record")
							: t("ui.error.cannot_find_record")
					}
					message={
						error ? t("ui.info.connection_issue") : t("ui.error.invalid_UUID")
					}
					description={
						error ? t("ui.info.try_later") : t("ui.info.check_address")
					}
					action={t("ui.actions.go_back")}
					goBack="/agencies"
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={agency.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 1 }}
			>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.name")}
						</Typography>
						<RenderAttribute attribute={agency.name} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.uuid")}
						</Typography>
						<RenderAttribute attribute={agency.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.code")}
						</Typography>
						<RenderAttribute attribute={agency.code} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.hostlms")}
						</Typography>
						<RenderAttribute attribute={agency.hostLms?.code} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.supplying")}
						</Typography>
						<RenderAttribute attribute={String(agency.isSupplyingAgency)} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.borrowing")}
						</Typography>
						<RenderAttribute attribute={String(agency.isBorrowingAgency)} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("agencies.auth")}
						</Typography>
						<RenderAttribute attribute={agency.authProfile} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("locations.longitude")}
						</Typography>
						<RenderAttribute attribute={agency.longitude} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("locations.latitude")}
						</Typography>
						<RenderAttribute attribute={agency.latitude} />
					</Stack>
				</Grid>
			</Grid>
		</PageContainer>
	);
}
