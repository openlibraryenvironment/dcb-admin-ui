import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import {
	Button,
	CircularProgress,
	Grid,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAuditById } from "@queries/getAuditById";
import { getAuditsByPatronRequest } from "@queries/getAuditByPatronRequest";
import { AuditItem } from "@models/AuditItem";

export const Route = createFileRoute(
	"/__authenticated/patronRequests/audits/$auditId/",
)({
	component: AuditDetails,
});

function AuditDetails() {
	const { t } = useTranslation();
	const router = useRouter();
	const { auditId } = Route.useParams();
	const gqlClient = useGraphQLClient();

	const { data, isLoading, error } = useQuery({
		queryKey: ["audit", auditId],
		queryFn: () =>
			gqlClient.request<any>(getAuditById, { query: `id:${auditId}` }),
		enabled: !!auditId,
		refetchInterval: 120000,
	});

	const audit: AuditItem = data?.audits?.content?.[0];
	const patronRequestId =
		audit?.patronRequest?.id ?? audit?.auditData?.patronRequestId;
	const auditDate = audit?.auditDate;

	// Fetch specifically the single NEXT (newer) audit entry
	const { data: nextAuditData, isLoading: nextLoading } = useQuery({
		queryKey: ["audit", "next", patronRequestId, auditDate],
		queryFn: () =>
			gqlClient.request<any>(getAuditsByPatronRequest, {
				query: `patronRequest:${patronRequestId} AND auditDate>${auditDate}`,
				order: "auditDate",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1,
			}),
		enabled: !!patronRequestId && !!auditDate,
	});

	// Fetch specifically the single PREVIOUS (older) audit entry
	const { data: prevAuditData, isLoading: prevLoading } = useQuery({
		queryKey: ["audit", "prev", patronRequestId, auditDate],
		queryFn: () =>
			gqlClient.request<any>(getAuditsByPatronRequest, {
				query: `patronRequest:${patronRequestId} AND auditDate<${auditDate}`,
				order: "auditDate",
				orderBy: "DESC", // Sort descending to get the most recent older entry
				pageno: 0,
				pagesize: 1,
			}),
		enabled: !!patronRequestId && !!auditDate,
	});

	const nextAudit = nextAuditData?.audits?.content?.[0];
	const previousAudit = prevAuditData?.audits?.content?.[0];

	const handleNavigate = (targetId: string | undefined) => {
		if (targetId) router.navigate({ to: `/patronRequests/audits/${targetId}` });
	};

	const goBackLink = `/patronRequests/${patronRequestId}#auditlog`;

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("audit_log.audit").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (error || !audit) {
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
					action={t("ui.actions.go_back")}
					goBack={goBackLink}
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={audit.id}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 2, sm: 2, md: 2, lg: 2 }}
			>
				<Grid size={{ xs: 2, sm: 2, md: 2 }}>
					<Stack
						direction="row"
						sx={{
							justifyContent: "space-between",
							width: "100%",
						}}
					>
						<Button
							variant="contained"
							onClick={() => router.navigate({ to: goBackLink })}
						>
							{t("patron_request.return")}
						</Button>

						<Stack direction="row" spacing={2}>
							<Tooltip
								title={
									previousAudit
										? t("ui.info.description", {
												description: previousAudit.briefDescription,
											})
										: t("ui.info.oldest_entry")
								}
							>
								<span>
									<Button
										variant="outlined"
										onClick={() => handleNavigate(previousAudit?.id)}
										disabled={!previousAudit}
										startIcon={
											prevLoading ? (
												<CircularProgress size={20} />
											) : (
												<ArrowLeft />
											)
										}
									>
										{t("ui.actions.older")}
									</Button>
								</span>
							</Tooltip>

							<Tooltip
								title={
									nextAudit
										? t("ui.info.description", {
												description: nextAudit.briefDescription,
											})
										: t("ui.info.newest_entry")
								}
							>
								<span>
									<Button
										variant="outlined"
										onClick={() => handleNavigate(nextAudit?.id)}
										disabled={!nextAudit}
										endIcon={
											nextLoading ? (
												<CircularProgress size={20} />
											) : (
												<ArrowRight />
											)
										}
									>
										{t("ui.actions.newer")}
									</Button>
								</span>
							</Tooltip>
						</Stack>
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 1, md: 1 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("audit_log.audit_uuid")}
						</Typography>
						<RenderAttribute attribute={audit.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 1, md: 1 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("audit_log.audit_date")}
						</Typography>
						<RenderAttribute
							attribute={dayjs(audit.auditDate).format(
								"YYYY-MM-DD HH:mm:ss.SSS",
							)}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 1, md: 1 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("audit_log.audit_description")}
						</Typography>
						<RenderAttribute attribute={audit.briefDescription} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 1, md: 1 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("audit_log.audit_from_status")}
						</Typography>
						<RenderAttribute attribute={audit.fromStatus} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 1, md: 1 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("audit_log.audit_to_status")}
						</Typography>
						<RenderAttribute attribute={audit.toStatus} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 1, md: 1 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("patron_request.uuid")}
						</Typography>
						<RenderAttribute attribute={audit.patronRequest?.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 2, md: 2 }}>
					<Typography variant="attributeTitle">
						{t("audit_log.audit_data")}
					</Typography>
					<pre
						style={{
							overflowX: "auto",
							padding: "1rem",
							backgroundColor: "#f5f5f5",
							borderRadius: "4px",
						}}
					>
						{JSON.stringify(audit.auditData, null, 2)}
					</pre>
				</Grid>
			</Grid>
		</PageContainer>
	);
}
