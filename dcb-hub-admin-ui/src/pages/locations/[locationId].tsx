import { Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { getLocationById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Location } from "@models/Location";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { useQuery } from "@apollo/client";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import {
	StyledAccordion,
	StyledAccordionSummary,
	StyledAccordionDetails,
} from "@components/StyledAccordion/StyledAccordion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

type LocationDetails = {
	locationId: string;
};
// Coming in, we know the ID. So we need to query our GraphQL server to get the associated data.

export default function LocationDetails({ locationId }: LocationDetails) {
	const { t } = useTranslation();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// If user is not authenticated, push them to unauthorised page
			// At present, they will likely be kicked to the logout page first
			// However this is important for when we introduce RBAC.
			router.push("/unauthorised");
		},
	});

	// Poll interval in ms
	const { loading, data, error } = useQuery(getLocationById, {
		variables: {
			query: "id:" + locationId,
		},
		pollInterval: 120000,
	});
	const location: Location = data?.locations?.content?.[0];

	// If GraphQL is loading or session fetching is loading
	if (loading || status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("locations.location_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || location == null || location == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.info.go_back")}
					goBack="/locations"
				/>
			) : (
				<Error
					title={t("ui.error.record_not_found")}
					message={t("ui.info.record_unavailable")}
					description={t("ui.action.check_url")}
					action={t("ui.info.go_back")}
					goBack="/locations"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={location?.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_name")}
						</Typography>
						<RenderAttribute attribute={location?.name} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_code")}
						</Typography>
						<RenderAttribute attribute={location?.code} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_id")}
						</Typography>
						<RenderAttribute attribute={location?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_type")}
						</Typography>
						<RenderAttribute attribute={location?.type} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.location_agency")}
						</Typography>
						<RenderAttribute attribute={location?.agency?.id} />
					</Stack>
				</Grid>
			</Grid>
			<StyledAccordion variant="outlined" disableGutters>
				<StyledAccordionSummary
					aria-controls="client-config-location-details"
					id="client-config-location-details"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("details.location_info")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<Stack direction={"row"} spacing={0.5}>
						<Typography variant="attributeTitle">
							{t("details.long")}
						</Typography>
						<RenderAttribute attribute={location?.longitude} />
					</Stack>
					<Stack direction={"row"} spacing={0.5}>
						<Typography variant="attributeTitle">{t("details.lat")}</Typography>
						<RenderAttribute attribute={location?.latitude} />
					</Stack>
				</StyledAccordionDetails>
			</StyledAccordion>
		</AdminLayout>
	);
}

export async function getServerSideProps(ctx: any) {
	const { locale } = ctx;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	const locationId = ctx.params.locationId;
	return {
		props: {
			locationId,
			...translations,
		},
	};
}
