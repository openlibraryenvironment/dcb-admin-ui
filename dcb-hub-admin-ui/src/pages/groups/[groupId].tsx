import { Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { getLibraryGroupById } from "src/queries/queries";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Group } from "@models/Group";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { useQuery } from "@apollo/client";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";

type GroupDetails = {
	groupId: string;
};

export default function GroupDetails({ groupId }: GroupDetails) {
	const { t } = useTranslation();
	const { loading, data } = useQuery(getLibraryGroupById, {
		variables: {
			query: "id:" + groupId,
		},
		pollInterval: 120000,
	});
	const group: Group = data?.libraryGroups?.content?.[0];

	return loading ? (
		<AdminLayout title={t("common.loading")} />
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
								{t("libraries.consortium.name")}
							</Typography>
							<RenderAttribute attribute={group?.consortium?.name} />
						</Stack>
					</Grid>
				) : null}
				{group?.type?.toLowerCase() === "consortium" ? (
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.consortium.id")}
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
				selectable={false}
				noDataTitle={t("groups.no_members")}
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
