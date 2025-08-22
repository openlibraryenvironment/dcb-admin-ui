import { useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import { AuditItem } from "@models/AuditItem";
import {
	Button,
	CircularProgress,
	Grid,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { getAuditById, getAuditsByPatronRequest } from "src/queries/queries";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useSession } from "next-auth/react";
import { isEmpty } from "lodash";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import dayjs from "dayjs";

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
		errorPolicy: "all",
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
			orderBy: "ASC",
			pagesize: 100,
			pageno: 0,
		},
		skip: !patronRequestId,
		errorPolicy: "all",
		onCompleted: async (data) => {
			if (data.audits.content.length < data.audits.totalSize) {
				const totalPages = Math.ceil(data.audits.totalSize / 100);
				// Fetch pages in sequence to maintain the order - as order is key here
				for (let page = 1; page < totalPages; page++) {
					try {
						await fetchMore({
							variables: {
								pageno: page,
							},
							updateQuery: (prev, { fetchMoreResult }) => {
								if (!fetchMoreResult) return prev;
								// Let's combine and sort all additional items by auditdate
								const allContent = [
									...prev.audits.content,
									...fetchMoreResult.audits.content,
								];

								const sortedContent = allContent.sort((a, b) => {
									return (
										new Date(a.auditDate).getTime() -
										new Date(b.auditDate).getTime()
									);
								});

								return {
									audits: {
										...fetchMoreResult.audits,
										content: sortedContent,
									},
								};
							},
						});
					} catch (error) {
						console.error(`Error fetching page ${page}:`, error);
						break; // There's an error: stop fetching
					}
				}
			}
		},
	});
	// Figure out our position in the list of audits
	// We only need to understand 'next' and 'previous' and get their IDs so we can link.
	const otherAudits = otherAuditsData?.audits?.content ?? [];
	console.log(
		"Audit dates in order:",
		otherAudits.map((audit: { auditDate: any; id: any }) => ({
			date: audit.auditDate,
			id: audit.id,
		})),
	);

	const currentAuditIndex = otherAudits.findIndex(
		(item: AuditItem) => item.id === auditId,
	);
	console.log(currentAuditIndex);
	// Then grab previous and next audit entries.
	const previousAudit =
		currentAuditIndex > 0 ? otherAudits[currentAuditIndex - 1] : null;
	const nextAudit =
		currentAuditIndex < otherAudits.length - 1
			? otherAudits[currentAuditIndex + 1]
			: null;

	// previous is older
	const previousAuditId =
		currentAuditIndex > 0 ? otherAudits[currentAuditIndex - 1]?.id : null;

	// next is newer
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
			<AdminLayout hideBreadcrumbs>
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
					title={t("ui.error.cannot_find_record")}
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
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_uuid")}
						</Typography>
						<RenderAttribute attribute={audit?.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_date")}
						</Typography>
						<RenderAttribute
							attribute={dayjs(audit?.auditDate).format(
								"YYYY-MM-DD HH:mm:ss.SSS",
							)}
						/>
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_description")}
						</Typography>
						<RenderAttribute attribute={audit?.briefDescription} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_from_status")}
						</Typography>
						<RenderAttribute attribute={audit?.fromStatus} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.audit_to_status")}
						</Typography>
						<RenderAttribute attribute={audit?.toStatus} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.patron_request_uuid")}
						</Typography>
						<RenderAttribute attribute={audit?.patronRequest?.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Typography variant="attributeTitle">{t("details.audit")}</Typography>
					<pre>{JSON.stringify(audit?.auditData, null, 2)}</pre>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
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
										: t("ui.info.oldest_entry")
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
										{t("ui.action.older")}
									</Button>
								</span>
							</Tooltip>
							<Tooltip
								title={
									nextAuditId
										? t("ui.info.description", {
												description: nextAudit?.briefDescription,
											})
										: t("ui.info.newest_entry")
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
										{t("ui.action.newer")}
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
