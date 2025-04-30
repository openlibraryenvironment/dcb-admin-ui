import { Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { getLibraryGroupById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Group } from "@models/Group";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { useQuery } from "@apollo/client";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

type GroupDetails = {
	groupId: string;
};

export default function GroupDetails({ groupId }: GroupDetails) {
	const { t } = useTranslation();
	const { loading, data, error } = useQuery(getLibraryGroupById, {
		variables: {
			query: "id:" + groupId,
		},
		pollInterval: 120000,
	});
	const group: Group = data?.libraryGroups?.content?.[0];

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("groups.groups_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || group == null || group == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/groups"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/groups"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={group?.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">{t("groups.name")}</Typography>
						<RenderAttribute attribute={group?.name} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">{t("groups.code")}</Typography>
						<RenderAttribute attribute={group?.code} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">{t("groups.type")}</Typography>
						<RenderAttribute attribute={group?.type} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">{t("groups.id")}</Typography>
						<RenderAttribute attribute={group?.id} />
					</Stack>
				</Grid>
				{group?.type?.toLowerCase() === "consortium" ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("consortium.name")}
							</Typography>
							<RenderAttribute attribute={group?.consortium?.name} />
						</Stack>
					</Grid>
				) : null}
				{group?.type?.toLowerCase() === "consortium" ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("consortium.id")}
							</Typography>
							<RenderAttribute attribute={group?.consortium?.id} />
						</Stack>
					</Grid>
				) : null}
			</Grid>
			<ClientDataGrid
				data={
					group?.members.map((item: { library: any }) => item.library) ?? []
				}
				columns={[
					{
						field: "abbreviatedName",
						headerName: t("libraries.abbreviated_name"),
						minWidth: 50,
						flex: 1,
					},
					{
						field: "fullName",
						headerName: t("libraries.name"),
						minWidth: 100,
						flex: 0.5,
					},
					{
						field: "agencyCode",
						headerName: t("details.agency_code"),
						minWidth: 50,
						flex: 0.5,
					},
				]}
				type="libraryGroupMembers"
				coreType="LibraryGroupMember"
				selectable={true}
				noDataTitle={t("groups.no_members")}
				// This is how to set the default sort order
				sortModel={[{ field: "fullName", sort: "asc" }]}
				operationDataType="Library"
				disableAggregation={true}
				disableRowGrouping={true}
			/>
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
	const groupId = ctx.params.groupId;
	return {
		props: {
			groupId,
			...translations,
		},
	};
}
