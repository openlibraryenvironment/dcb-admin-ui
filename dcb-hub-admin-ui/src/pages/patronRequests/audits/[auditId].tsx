import { useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import { AuditItem } from "@models/AuditItem";
import { Button, CircularProgress, Stack, Tooltip } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import { getAuditById, getAuditsByPatronRequest } from "src/queries/queries";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useSession } from "next-auth/react";
import { isEmpty } from "lodash";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";

type AuditDetails = {
	auditId: string;
};

export default function AuditDetails({ auditId }: AuditDetails) {
	const { t } = useTranslation();
	const { loading, data, error } = useQuery(getAuditById, {
		variables: {
			query: "id:" + auditId,
		},
		pollInterval: 120000,
	});
	const audit: AuditItem = data?.audits?.content?.[0];
	// use patron request ID from audit to find the other audits known to it
	const patronRequestId =
		audit?.patronRequest.id ?? audit?.auditData.patronRequestId;

	const {
		loading: otherAuditsLoading,
		data: otherAuditsData,
		error: otherAuditsError,
		fetchMore,
	} = useQuery(getAuditsByPatronRequest, {
		variables: {
			query: "patronRequest:" + patronRequestId,
			order: "auditDate",
			orderBy: "DESC",
			pagesize: 100,
			pageno: 0,
		},
		skip: !patronRequestId, // if patron request ID is undefined, do not run this query
		onCompleted: (data) => {
			// Check if we have all the audits
			if (data.audits.content.length < data.audits.totalSize) {
				// Calculate how many pages we need to fetch - must match page size.
				const totalPages = Math.ceil(data.audits.totalSize / 100);

				// Create an array of promises for each additional page
				// This ensures we get all the pages - when using standard fetchmore we were only getting a max of 2 additional pages.
				const fetchPromises = Array.from(
					{ length: totalPages - 1 },
					(_, index) =>
						fetchMore({
							variables: {
								pageno: index + 1,
							},
							updateQuery: (prev, { fetchMoreResult }) => {
								if (!fetchMoreResult) return prev;
								return {
									audits: {
										...fetchMoreResult.audits,
										content: [
											...prev.audits.content,
											...fetchMoreResult.audits.content,
										],
									},
								};
							},
						}),
				);

				// Execute all fetch promises
				Promise.all(fetchPromises).catch((error) =>
					console.error("Error fetching additional audit pages:", error),
				);
			}
		},
	});
	// Figure out our position in the list of audits
	// We only need to understand 'next' and 'previous' and get their IDs so we can link.
	const otherAudits = otherAuditsData?.audits?.content ?? [];
	const currentAuditIndex = otherAudits.findIndex(
		(item: AuditItem) => item.id === auditId,
	);
	// Then grab previous and next audit entries.
	const previousAudit =
		currentAuditIndex > 0 ? otherAudits[currentAuditIndex - 1] : null;
	const nextAudit =
		currentAuditIndex < otherAudits.length - 1
			? otherAudits[currentAuditIndex + 1]
			: null;
	const previousAuditId =
		currentAuditIndex > 0 ? otherAudits[currentAuditIndex - 1]?.id : null;
	const nextAuditId =
		currentAuditIndex < otherAudits.length - 1
			? otherAudits[currentAuditIndex + 1]?.id
			: null;

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});
	// Link to the original patron request so users can get back
	const handleReturn = () => {
		router.push(`/patronRequests/${audit?.patronRequest?.id}` + `#auditlog`);
	};

	const handleNavigate = (auditId: string | null) => {
		if (auditId) {
			router.push(`/patronRequests/audits/${auditId}`);
		}
	};
	const goBackLink: string =
		`/patronRequests/${audit?.patronRequest?.id}` + `#auditlog`;
	if (loading || status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("details.audit").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || audit == null || audit == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack={goBackLink}
				/>
			) : (
				<Error
					title={t("ui.error.record_not_found")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack={goBackLink}
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={audit?.id}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 2, sm: 2, md: 2, lg: 2 }}
			>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_uuid")}
						</Typography>
						<RenderAttribute attribute={audit?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_date")}
						</Typography>
						<RenderAttribute attribute={audit?.auditDate} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_description")}
						</Typography>
						<RenderAttribute attribute={audit?.briefDescription} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_from_status")}
						</Typography>
						<RenderAttribute attribute={audit?.fromStatus} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_to_status")}
						</Typography>
						<RenderAttribute attribute={audit?.toStatus} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.patron_request_uuid")}
						</Typography>
						<RenderAttribute attribute={audit?.patronRequest?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Typography variant="attributeTitle">{t("details.audit")}</Typography>
					<pre>{JSON.stringify(audit?.auditData, null, 2)}</pre>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction="row" justifyContent="space-between" width="100%">
						{/* Left side */}
						<Button variant="contained" onClick={handleReturn}>
							{t("details.patron_request_return")}
						</Button>

						{/* Right side */}
						<Stack direction="row" spacing={2}>
							<Tooltip
								title={
									previousAuditId
										? t("ui.info.description", {
												description: previousAudit?.briefDescription,
											})
										: t("ui.info.no_previous_audit")
								}
							>
								<span>
									<Button
										variant="outlined"
										onClick={() => handleNavigate(previousAuditId)}
										disabled={!previousAuditId || !isEmpty(otherAuditsError)}
										startIcon={
											otherAuditsLoading ? (
												<CircularProgress size={20} />
											) : (
												<ArrowLeft />
											)
										}
									>
										{t("ui.action.previous")}
									</Button>
								</span>
							</Tooltip>
							<Tooltip
								title={
									nextAuditId
										? t("ui.info.description", {
												description: nextAudit?.briefDescription,
											})
										: t("ui.info.no_next_audit")
								}
							>
								<span>
									<Button
										variant="outlined"
										onClick={() => handleNavigate(nextAuditId)}
										disabled={!nextAuditId || !isEmpty(otherAuditsError)}
										endIcon={
											otherAuditsLoading ? (
												<CircularProgress size={20} />
											) : (
												<ArrowRight />
											)
										}
									>
										{t("ui.action.next")}
									</Button>
								</span>
							</Tooltip>
						</Stack>
					</Stack>
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
	const auditId = ctx.params.auditId;
	return {
		props: {
			auditId,
			...translations,
		},
	};
}
