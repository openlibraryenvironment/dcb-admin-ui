import { Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { getDataChangeLogById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useQuery } from "@apollo/client";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import Link from "@components/Link/Link";
import {
	calculateEntityLink,
	tableNameToEntityName,
} from "src/helpers/dataChangeLogHelperFunctions";
import ChangesSummary from "@components/ChangesSummary/ChangesSummary";
import { capitaliseFirstCharacter } from "src/helpers/capitaliseFirstCharacter";

type DataChangeLogDetails = {
	dataChangeLogId: string;
};
// Coming in, we know the ID. So we need to query our GraphQL server to get the associated data.

export default function DataChangeLogDetails({
	dataChangeLogId,
}: DataChangeLogDetails) {
	const { t } = useTranslation();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	// Poll interval in ms
	const { loading, data, error } = useQuery(getDataChangeLogById, {
		variables: {
			query: "id:" + dataChangeLogId,
		},
		pollInterval: 120000,
	});
	const dataChangeLog: any = data?.dataChangeLog?.content?.[0]; // Add type

	// If GraphQL is loading or session fetching is loading
	if (loading || status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("data_change_log.loading_details"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || dataChangeLog == null || dataChangeLog == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/serviceInfo/dataChangeLogs"
				/>
			) : (
				<Error
					title={t("ui.error.record_not_found")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/serviceInfo/dataChangeLogs"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={dataChangeLog?.id}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
			>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.id")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.entity_id")}
						</Typography>
						{dataChangeLog?.entityType == "reference_value_mapping" ||
						dataChangeLog?.entityType == "numeric_range_mapping" ||
						dataChangeLog?.actionInfo == "DELETE" ? (
							<RenderAttribute attribute={dataChangeLog?.entityId} />
						) : (
							<Link
								href={`/${calculateEntityLink(dataChangeLog?.entityType)}/${dataChangeLog?.entityId}`}
							>
								<RenderAttribute attribute={dataChangeLog?.entityId} />
							</Link>
						)}
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.timestamp")}
						</Typography>
						<RenderAttribute
							attribute={dayjs(dataChangeLog?.timestampLogged).format(
								"YYYY-MM-DD HH:mm:ss",
							)}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.entity_type")}
						</Typography>
						<RenderAttribute
							attribute={capitaliseFirstCharacter(
								t(tableNameToEntityName(dataChangeLog?.entityType)),
							)}
						/>
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.table_name")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog?.entityType} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.user")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog?.lastEditedBy} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.reason")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog?.reason} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.category")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog?.changeCategory} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.reference_url")}
						</Typography>
						{dataChangeLog?.changeReferenceUrl ? (
							<Link href={dataChangeLog?.changeReferenceUrl ?? ""}>
								{dataChangeLog?.changeReferenceUrl}
							</Link>
						) : (
							<RenderAttribute attribute={dataChangeLog?.changeReferenceUrl} />
						)}
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("data_change_log.action")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog?.actionInfo} />
					</Stack>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<ChangesSummary
						changes={dataChangeLog?.changes}
						action={dataChangeLog?.actionInfo}
						context="dataChangeLog"
					/>
				</Grid>
			</Grid>
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
	const dataChangeLogId = ctx.params.dataChangeLogId;
	return {
		props: {
			dataChangeLogId,
			...translations,
		},
	};
}
