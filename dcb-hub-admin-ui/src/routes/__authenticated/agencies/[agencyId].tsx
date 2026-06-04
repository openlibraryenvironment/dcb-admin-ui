import { createFileRoute } from "@tanstack/react-router";
import { Grid } from "@queries/createFileRoute } from "@tanstack/react-router";
import { Grid";
import { Stack } from "@queries/Stack";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getAgency } from "@queries/Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getAgency";
import { AdminLayout } from "@layout";

import { useQuery } from "@tanstack/react-query";
import { Agency } from "@models/Agency";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useAuth } from "react-oidc-context";
import { useNavigate, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/__authenticated/agencies/agencyId")({
	component: AgencyDetails,
});

function AgencyDetails() {
	const { t } = useTranslation();
	const router = useRouter();
	const { agencyId  } = Route.useParams();
	const { loading, data, error } = useQuery(getAgency, {
		variables: {
			query: "id:" + agencyId,
		},
		skip: !agencyId,
		pollInterval: 120000,
		errorPolicy: "all",
	});
	const agency: Agency = data?.agencies?.content?.[0];

	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	if (loading || status === "loading") {
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

	return error || agency == null || agency == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/agencies"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/agencies"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={agency?.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
			>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_name")}
						</Typography>
						<RenderAttribute attribute={agency?.name} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_uuid")}
						</Typography>
						<RenderAttribute attribute={agency?.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_code")}
						</Typography>
						<RenderAttribute attribute={agency?.code} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_hostlms")}
						</Typography>
						<RenderAttribute attribute={agency?.hostLms?.code} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("agencies.supplying")}
						</Typography>
						<RenderAttribute attribute={String(agency?.isSupplyingAgency)} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("agencies.borrowing")}
						</Typography>
						<RenderAttribute attribute={String(agency?.isBorrowingAgency)} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_auth")}
						</Typography>
						<RenderAttribute attribute={agency?.authProfile} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.long")}
						</Typography>
						<RenderAttribute attribute={agency?.longitude} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">{t("details.lat")}</Typography>
						<RenderAttribute attribute={agency?.latitude} />
					</Stack>
				</Grid>
			</Grid>
		</AdminLayout>
	);
}




