import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import PageContainer from "@layout/PageContainer/PageContainer";
import Link from "@components/Link/Link";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";
import ChangesSummary from "@components/ChangesSummary/ChangesSummary";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getDataChangeLogById } from "@queries/getDataChangeLogById";
import {
	calculateEntityLink,
	tableNameToEntityName,
} from "@helpers/dataChangeLogHelperFunctions";
import { capitaliseFirstCharacter } from "@helpers/capitaliseFirstCharacter";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/dataChangeLog/$dataChangeLogId",
)({
	component: DataChangeLogDetails,
});

function DataChangeLogDetails() {
	const { t } = useTranslation();
	const { dataChangeLogId } = Route.useParams();
	const gqlClient = useGraphQLClient();

	const { data, isLoading, error } = useQuery({
		queryKey: ["dataChangeLog", dataChangeLogId],
		queryFn: () =>
			gqlClient.request<any>(getDataChangeLogById, {
				query: `id:${dataChangeLogId}`,
			}),
		enabled: !!dataChangeLogId,
		refetchInterval: 120000,
	});

	const dataChangeLog = data?.dataChangeLog?.content?.[0];

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("data_change_log.loading_details"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (error || !dataChangeLog) {
		return (
			<PageContainer hideBreadcrumbs>
				<ErrorComponent
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
					goBack="/serviceInfo/dataChangeLogs"
				/>
			</PageContainer>
		);
	}

	const isNonLinkableEntity =
		dataChangeLog.entityType === "reference_value_mapping" ||
		dataChangeLog.entityType === "numeric_range_mapping" ||
		dataChangeLog.actionInfo === "DELETE";

	return (
		<PageContainer title={dataChangeLog.id}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: "5px" }}
			>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.id")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog.id} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.entity_id")}
						</Typography>
						{isNonLinkableEntity ? (
							<RenderAttribute attribute={dataChangeLog.entityId} />
						) : (
							<Link
								href={`/${calculateEntityLink(dataChangeLog.entityType)}/${dataChangeLog.entityId}`}
								underline="hover"
							>
								<RenderAttribute attribute={dataChangeLog.entityId} />
							</Link>
						)}
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.timestamp")}
						</Typography>
						<RenderAttribute
							attribute={dayjs(dataChangeLog.timestampLogged).format(
								"YYYY-MM-DD HH:mm:ss",
							)}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.entity_type")}
						</Typography>
						<RenderAttribute
							attribute={capitaliseFirstCharacter(
								t(tableNameToEntityName(dataChangeLog.entityType)),
							)}
						/>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.table_name")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog.entityType} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.user")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog.lastEditedBy} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.reason")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog.reason} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.category")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog.changeCategory} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.reference_url")}
						</Typography>
						{dataChangeLog.changeReferenceUrl ? (
							<RenderAttribute
								attribute={dataChangeLog.changeReferenceUrl}
								title={dataChangeLog.changeReferenceUrl}
								type="url"
							/>
						) : (
							<RenderAttribute attribute={dataChangeLog.changeReferenceUrl} />
						)}
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("data_change_log.action")}
						</Typography>
						<RenderAttribute attribute={dataChangeLog.actionInfo} />
					</Stack>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<ChangesSummary
						changes={dataChangeLog.changes}
						action={dataChangeLog.actionInfo}
						context="dataChangeLog"
					/>
				</Grid>
			</Grid>
		</PageContainer>
	);
}
