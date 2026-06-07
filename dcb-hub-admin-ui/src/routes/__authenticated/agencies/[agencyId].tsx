import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Stack, Typography } from "@mui/material";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAgency } from "@queries/getAgency";
import { Agency } from "@models/Agency";

export const Route = createFileRoute("/__authenticated/agencies/$agencyId")({
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
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("agencies.agencies_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	if (error || !agency) {
		return (
			<AdminLayout hideBreadcrumbs>
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
					action={t("ui.action.go_back")}
					goBack="/agencies"
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={agency.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 1 }}
			>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("details.agency_name")}
						</Typography>
						<RenderAttribute attribute={agency.name} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("details.agency_uuid")}
						</Typography>
						<RenderAttribute attribute={agency.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("details.agency_code")}
						</Typography>
						<RenderAttribute attribute={agency.code} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("details.agency_hostlms")}
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
							{t("details.agency_auth")}
						</Typography>
						<RenderAttribute attribute={agency.authProfile} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("details.long")}
						</Typography>
						<RenderAttribute attribute={agency.longitude} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 3, sm: 3, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">{t("details.lat")}</Typography>
						<RenderAttribute attribute={agency.latitude} />
					</Stack>
				</Grid>
			</Grid>
		</AdminLayout>
	);
}
