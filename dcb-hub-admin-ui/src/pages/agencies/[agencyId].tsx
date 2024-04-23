import {
	Stack,
	Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { getAgencyById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { useQuery } from "@apollo/client";
import { Agency } from "@models/Agency";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { StyledAccordion, StyledAccordionSummary, StyledAccordionDetails } from "@components/StyledAccordion/StyledAccordion";

type AgencyDetails = {
	agencyId: string;
};

export default function AgencyDetails({ agencyId }: AgencyDetails) {
	const { t } = useTranslation();
	const { loading, data, error } = useQuery(getAgencyById, {
		variables: {
			query: "id:" + agencyId,
		},
		pollInterval: 120000,
	});
	const agency: Agency = data?.agencies?.content?.[0];

	if (loading) {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("agencies.agencies_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}
	console.log(error);

	return error || agency == null || agency == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.info.go_back")}
					goBack="/agencies"
				/>
			) : (
				<Error
					title={t("ui.error.record_not_found")}
					message={t("ui.info.record_unavailable")}
					description={t("ui.action.check_url")}
					action={t("ui.info.go_back")}
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
			>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_name")}
						</Typography>
						<RenderAttribute attribute={agency?.name} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_id")}
						</Typography>
						<RenderAttribute attribute={agency?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_code")}
						</Typography>
						<RenderAttribute attribute={agency?.code} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_hostlms")}
						</Typography>
						<RenderAttribute attribute={agency?.hostLms?.code} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.agency_auth")}
						</Typography>
						<RenderAttribute attribute={agency?.authProfile} />
					</Stack>
				</Grid>
			</Grid>
			<StyledAccordion variant="outlined" disableGutters>
				<StyledAccordionSummary
					aria-controls="agency_details_location_info"
					id="agency_details_location_info"
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
						<RenderAttribute attribute={agency?.longitude} />
					</Stack>
					<Stack direction={"row"} spacing={0.5}>
						<Typography variant="attributeTitle">{t("details.lat")}</Typography>
						<RenderAttribute attribute={agency?.latitude} />
					</Stack>
				</StyledAccordionDetails>
			</StyledAccordion>
		</AdminLayout>
	);
}

export async function getServerSideProps(ctx: any) {
	// Handles loading the translations on the server-side
	const { locale } = ctx;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	// We use ctx.params to extract the ID from the URL. Then we can use it to make the request.
	const agencyId = ctx.params.agencyId;
	// Then return all the relevant props ready for page load.
	return {
		props: {
			agencyId,
			...translations,
		},
	};
}
