import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";

import PageContainer from "@layout/PageContainer/PageContainer";
import ErrorComponent from "@components/Error/Error";
import Link from "@components/Link/Link";
import PageLoading from "@components/Loading/PageLoading";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	importIngestDetailsQueryOptions,
	processingStateCount,
} from "@helpers/importIngestDetails";
import { hostlmsParamsSchema } from "@schemas/routeParams/hostlmsParams";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/catalogMetricsByHostLms/$hostlmsId",
)({
	params: {
		parse: (raw) => hostlmsParamsSchema.parse(raw),
	},
	component: CatalogMetricsForHostLms,
});

function CatalogMetricsForHostLms() {
	const { t } = useTranslation();
	const { hostlmsId } = useParams({
		from: "/__authenticated/serviceInfo/catalogMetricsByHostLms/$hostlmsId",
	});
	const client = useDcbRestClient();

	const {
		data: details,
		isLoading,
		error,
		isFetching,
		refetch,
	} = useQuery(importIngestDetailsQueryOptions(client, hostlmsId));

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<PageLoading
					title={t("ui.info.loading.document", {
						document_type:
							t("catalogMetricsByHostLms.name").charAt(0).toLowerCase() +
							t("catalogMetricsByHostLms.name").slice(1),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (error || !details) {
		const notFound =
			axios.isAxiosError(error) && error.response?.status === 404;
		return (
			<PageContainer hideBreadcrumbs>
				<ErrorComponent
					title={
						notFound
							? t("ui.error.cannot_find_record")
							: t("ui.error.cannot_retrieve_record")
					}
					message={
						notFound
							? t("ui.error.invalid_UUID")
							: t("ui.info.connection_issue")
					}
					description={
						notFound ? t("ui.info.check_address") : t("ui.info.try_later")
					}
					action={t("ui.actions.go_back")}
					goBack="/serviceInfo/catalogMetricsByHostLms"
				/>
			</PageContainer>
		);
	}

	const awaiting = processingStateCount(details, "PROCESSING_REQUIRED");
	const failed = processingStateCount(details, "FAILURE");
	const ingested = processingStateCount(details, "SUCCESS");
	const harvested = details.sourceRecordCount ?? 0;
	const bibs = details.bibRecordCount ?? 0;
	const hasCheckpoint =
		details.checkPoint != null && Object.keys(details.checkPoint).length > 0;

	return (
		<PageContainer
			title={t("catalogMetricsByHostLms.host_lms_title", {
				name: details.name,
			})}
		>
			<Stack spacing={3}>
				{/* A live region, so a Refresh that changes the answer is announced. */}
				<Stack spacing={1} role="status">
					<Alert severity={awaiting === 0 ? "success" : "info"} role="none">
						{awaiting === 0
							? t("catalogMetricsByHostLms.processing_complete")
							: t("catalogMetricsByHostLms.processing_waiting", {
									count: awaiting,
									formatted: awaiting.toLocaleString(),
								})}
					</Alert>
					{failed > 0 && (
						<Alert severity="warning" role="none">
							{t("catalogMetricsByHostLms.processing_failed", {
								count: failed,
								formatted: failed.toLocaleString(),
							})}
						</Alert>
					)}
				</Stack>

				<Stack
					direction="row"
					spacing={2}
					useFlexGap
					sx={{ alignItems: "center", flexWrap: "wrap" }}
				>
					<Button
						variant="outlined"
						startIcon={<Refresh />}
						onClick={() => refetch()}
						disabled={isFetching}
					>
						{t("catalogMetricsByHostLms.refresh")}
					</Button>
					{details.countedAt && (
						<Typography variant="attributeText">
							{t("catalogMetricsByHostLms.counted_at", {
								time: dayjs(details.countedAt).format("YYYY-MM-DD HH:mm:ss"),
							})}
						</Typography>
					)}
					<Link
						to="/hostlmss/$hostlmsId"
						params={{ hostlmsId: details.id }}
						underline="hover"
					>
						{t("catalogMetricsByHostLms.open_host_lms")}
					</Link>
				</Stack>

				<Grid
					container
					spacing={{ xs: 2, md: 3 }}
					columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				>
					<Metric
						title={t("catalogMetricsByHostLms.harvest_enabled")}
						value={
							details.ingestEnabled == null
								? undefined
								: t(details.ingestEnabled ? "ui.actions.yes" : "ui.actions.no")
						}
					/>
					<Metric
						title={t("catalogMetricsByHostLms.harvested")}
						value={harvested.toLocaleString()}
					/>
					<Metric
						title={t("catalogMetricsByHostLms.await")}
						value={awaiting.toLocaleString()}
					/>
					<Metric
						title={t("catalogMetricsByHostLms.failed")}
						value={failed.toLocaleString()}
					/>
					<Metric
						title={t("catalogMetricsByHostLms.ingested")}
						value={ingested.toLocaleString()}
					/>
					<Metric title={t("nav.bibs")} value={bibs.toLocaleString()} />
					<Metric
						title={t("catalogMetricsByHostLms.difference")}
						value={(harvested - bibs).toLocaleString()}
					/>
					<Metric
						title={t("catalogMetricsByHostLms.checkpoint_id")}
						value={details.checkPointId}
					/>
				</Grid>

				<Stack spacing={1}>
					<Typography variant="accordionSummary" component="h2">
						{t("catalogMetricsByHostLms.checkpoint")}
					</Typography>
					<Typography variant="attributeText">
						{t("catalogMetricsByHostLms.checkpoint_help")}
					</Typography>
					{hasCheckpoint ? (
						<Box
							component="pre"
							sx={{
								m: 0,
								p: 2,
								borderRadius: 1,
								bgcolor: "action.hover",
								fontFamily: "monospace",
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
							}}
						>
							{JSON.stringify(details.checkPoint, null, 2)}
						</Box>
					) : (
						<Typography variant="attributeText">
							{t("catalogMetricsByHostLms.no_checkpoint")}
						</Typography>
					)}
				</Stack>

				{details.errors && details.errors.length > 0 && (
					<Alert severity="warning">
						<AlertTitle>{t("catalogMetricsByHostLms.read_errors")}</AlertTitle>
						<Box component="ul" sx={{ m: 0, paddingInlineStart: 2 }}>
							{details.errors.map((readError) => (
								<li key={readError}>{readError}</li>
							))}
						</Box>
					</Alert>
				)}
			</Stack>
		</PageContainer>
	);
}

function Metric({ title, value }: { title: string; value?: string }) {
	if (value == null) return null;
	return (
		<Grid size={{ xs: 2, sm: 4, md: 4 }}>
			<Stack direction="column">
				<Typography variant="attributeTitle">{title}</Typography>
				<RenderAttribute attribute={value} />
			</Stack>
		</Grid>
	);
}
