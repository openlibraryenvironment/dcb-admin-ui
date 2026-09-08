import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Typography, Button, Stack } from "@mui/material";
import { GridRowModesModel, GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import ConsortiumTabs from "@components/ConsortiumTabs/ConsortiumTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import NewFunctionalSetting from "@forms/NewFunctionalSetting/NewFunctionalSetting";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { getConsortiumFunctionalSettings } from "@queries/getConsortiumFunctionalSettings";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
import type { LoadConsortiumFsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/consortium/functionalSettings",
)({
	component: FunctionalSettings,
});

function FunctionalSettings() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showNewFunctionalSetting, setShowNewFunctionalSetting] =
		useState(false);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const settingMutation = useEntityMutation("functionalSetting");

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["LoadConsortiumFunctionalSettings"],
		queryFn: () =>
			gqlClient.request<any, LoadConsortiumFsQueryVariables>(
				getConsortiumFunctionalSettings,
				{
					order: "id",
					orderBy: "DESC",
				},
			),
	});

	const consortium = data?.consortia?.content?.[0];
	const settings = consortium?.functionalSettings ?? [];

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "name",
				headerName: t("consortium.settings.name"),
				minWidth: 75,
				flex: 0.75,
				editable: false,
			},
			{
				field: "description",
				headerName: t("consortium.settings.description"),
				minWidth: 150,
				flex: 1,
				editable: true,
			},
			{
				field: "enabled",
				headerName: t("consortium.settings.enabled_header"),
				minWidth: 50,
				flex: 0.4,
				editable: true,
				type: "singleSelect",
				valueOptions: [
					{ value: true, label: t("ui.actions.yes") },
					{ value: false, label: t("ui.actions.no") },
				],
				valueFormatter: (val: boolean) =>
					val
						? t("consortium.settings.enabled")
						: t("consortium.settings.disabled"),
			},
			// No onDelete: functional settings are created and toggled, never deleted.
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				canEdit: isAnAdmin,
			}),
		],
		[rowModesModel, isAnAdmin, t],
	);

	return (
		<PageContainer title={t("nav.consortium.functionalSettings")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 3 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<ConsortiumTabs current="functionalSettings" />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="body1" sx={{ mb: 3 }}>
						{t("consortium.settings.introduction")}
					</Typography>

					<Stack direction="row" sx={{ mb: 2 }}>
						<Button
							variant="contained"
							onClick={() => setShowNewFunctionalSetting(true)}
							disabled={!isAnAdmin}
						>
							{t("consortium.new_functional_setting.title")}
						</Button>
					</Stack>

					<DataGrid
						identifier="consortiumFunctionalSettings"
						type="consortiumFunctionalSettings"
						columns={columns}
						rows={settings}
						loading={isLoading || isFetching}
						paginationMode="client"
						sortingMode="client"
						filterMode="client"
						editMode="row"
						rowModesModel={rowModesModel}
						onRowModesModelChange={setRowModesModel}
						processRowUpdate={settingMutation.requestGridEdit}
						disableAggregation
						disableHoverInteractions={false}
						disableRowGrouping
						disablePivoting
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible={false}
						pagination
						paginationModel={{ page: 0, pageSize: 20 }}
						scrollbarVisible={false}
						noResultsText={t("consortium.settings.not_available")}
						searchText=""
					/>
				</Grid>
			</Grid>

			<EntityMutationDialogs {...settingMutation.dialogProps} />

			{showNewFunctionalSetting && (
				<NewFunctionalSetting
					show={showNewFunctionalSetting}
					onClose={() => setShowNewFunctionalSetting(false)}
					consortiumName={consortium?.name}
					consortiumDisplayName={consortium?.displayName}
				/>
			)}
		</PageContainer>
	);
}
