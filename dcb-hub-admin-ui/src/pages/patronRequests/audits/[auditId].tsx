import { useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import { AuditItem } from "@models/AuditItem";
import { Button, Stack } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import { getAuditById } from "src/queries/queries";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useSession } from "next-auth/react";

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
	// Link to the original patron request so users can get back
	const handleReturn = () => {
		router.push(
			`/patronRequests/${audit?.patronRequest?.id}` +
				`#${t("details.audit_log")}`,
		);
	};
	const goBackLink: string =
		`/patronRequests/${audit?.patronRequest?.id}` +
		`#${t("details.audit_log")}`;
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
					action={t("ui.info.go_back")}
					goBack={goBackLink}
				/>
			) : (
				<Error
					title={t("ui.error.record_not_found")}
					message={t("ui.info.record_unavailable")}
					description={t("ui.action.check_url")}
					action={t("ui.info.go_back")}
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
							{t("details.audit_id")}
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
							{t("details.patron_request_id")}
						</Typography>
						<RenderAttribute attribute={audit?.patronRequest?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Typography variant="attributeTitle">{t("details.audit")}</Typography>
					<pre>{JSON.stringify(audit?.auditData, null, 2)}</pre>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Button variant="contained" onClick={handleReturn}>
						{t("details.patron_request_return")}
					</Button>
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
