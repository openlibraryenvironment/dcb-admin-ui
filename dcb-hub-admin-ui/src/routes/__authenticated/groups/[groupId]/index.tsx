import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Stack, Tab, Tabs, Typography } from "@mui/material";
import {
	GridPaginationModel,
	GridRowModesModel,
	GridSortModel,
} from "@mui/x-data-grid-premium";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import DataGrid from "@components/DataGrid/DataGrid";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getLibraryGroupById } from "@queries/getGroupById";
import { Group } from "@models/Group";

export const Route = createFileRoute("/__authenticated/groups/$groupId/")({
	component: GroupDetails,
});

function GroupDetails() {
	const { t } = useTranslation();
	const router = useRouter();
	const { groupId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: 20,
	});
	const [sortModel, setSortModel] = useState<GridSortModel>([
		{ field: "fullName", sort: "asc" },
	]);

	const { data, isLoading, error } = useQuery({
		queryKey: ["group", groupId],
		queryFn: () =>
			gqlClient.request<any>(getLibraryGroupById, { query: `id:${groupId}` }),
		refetchInterval: 120000,
	});

	const group: Group = data?.libraryGroups?.content?.[0];

	if (isLoading) {
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

	if (error || !group) {
		return (
			<AdminLayout hideBreadcrumbs>
				<Error
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
					goBack="/groups"
				/>
			</AdminLayout>
		);
	}

	const columns = [
		{
			field: "abbreviatedName",
			headerName: t("libraries.abbreviated_name"),
			minWidth: 25,
			flex: 0.5,
		},
		{
			field: "fullName",
			headerName: t("libraries.name"),
			minWidth: 100,
			flex: 1,
		},
		{
			field: "agencyCode",
			headerName: t("details.agency_code"),
			minWidth: 50,
			flex: 0.5,
		},
	];

	const members = group?.members?.map((item: any) => item.library) ?? [];

	return (
		<AdminLayout title={group?.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs
						value={0}
						onChange={(_, val) =>
							router.navigate({
								to: [
									`/groups/${groupId}`,
									`/groups/${groupId}/patronRequests`,
									`/groups/${groupId}/supplierRequests`,
									`/groups/${groupId}/settings`,
								][val],
							})
						}
					>
						<Tab label={t("nav.groups.profile")} />
						<Tab label={t("nav.groups.patronRequests")} />
						<Tab label={t("nav.groups.supplierRequests")} />
						<Tab label={t("nav.groups.settings")} />
					</Tabs>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" fontWeight="bold">
						{t("nav.groups.profile")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="accordionSummary">
						{t("nav.groups.info")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">{t("groups.name")}</Typography>
						<RenderAttribute attribute={group?.name} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">{t("groups.code")}</Typography>
						<RenderAttribute attribute={group?.code} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">{t("groups.type")}</Typography>
						<RenderAttribute attribute={group?.type} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">{t("groups.id")}</Typography>
						<RenderAttribute attribute={group?.id} />
					</Stack>
				</Grid>

				{group?.type?.toLowerCase() === "consortium" && (
					<>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("consortium.name")}
								</Typography>
								<RenderAttribute attribute={group?.consortium?.name} />
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("consortium.id")}
								</Typography>
								<RenderAttribute attribute={group?.consortium?.id} />
							</Stack>
						</Grid>
					</>
				)}

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="accordionSummary">
						{t("nav.groups.membership")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<DataGrid
						identifier="libraryGroupMembers"
						type="libraryGroupMembers"
						columns={columns}
						rows={members}
						rowCount={members.length}
						loading={false}
						paginationMode="client"
						sortingMode="client"
						filterMode="client"
						checkboxSelection={false}
						disableAggregation
						disableHoverInteractions={false}
						disableRowGrouping
						disablePivoting
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible={false}
						pagination
						paginationModel={paginationModel}
						onPaginationModelChange={setPaginationModel}
						sortModel={sortModel}
						onSortModelChange={setSortModel}
						scrollbarVisible={false}
						noResultsText={t("groups.no_members")}
						searchText=""
						rowModesModel={rowModesModel}
						onRowModesModelChange={setRowModesModel}
					/>
				</Grid>
			</Grid>
		</AdminLayout>
	);
}
