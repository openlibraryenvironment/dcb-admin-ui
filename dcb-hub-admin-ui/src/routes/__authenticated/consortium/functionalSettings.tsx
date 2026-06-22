import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Tab, Tabs, Typography, Button, Stack } from "@mui/material";
import { Edit, Save, Cancel } from "@mui/icons-material";
import {
	GridRowModesModel,
	GridRowModes,
	GridRowModel,
	GridColDef,
	GridActionsCellItem,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Confirmation from "@components/Confirmation/Confirmation";
import NewFunctionalSetting from "@forms/NewFunctionalSetting/NewFunctionalSetting";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getConsortiumFunctionalSettings } from "@queries/getConsortiumFunctionalSettings";
import { updateFunctionalSettingQuery } from "@mutations/updateFunctionalSetting";
import { computeMutation } from "@helpers/computeMutation";

export const Route = createFileRoute(
	"/__authenticated/consortium/functionalSettings",
)({
	component: FunctionalSettings,
});

function FunctionalSettings() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showNewFunctionalSetting, setShowNewFunctionalSetting] =
		useState(false);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [editRecord, setEditRecord] = useState<string | null>(null);

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["LoadConsortiumFunctionalSettings"],
		queryFn: () =>
			gqlClient.request<any>(getConsortiumFunctionalSettings, {
				order: "id",
				orderBy: "DESC",
				pageno: 0,
				pagesize: 10,
			}),
	});

	const consortium = data?.consortia?.content?.[0];
	const settings = consortium?.functionalSettings ?? [];

	const { mutateAsync: updateSetting } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(updateFunctionalSettingQuery, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["LoadConsortiumFunctionalSettings"],
			}),
	});

	const processRowUpdate = useCallback(
		(newRow: GridRowModel, oldRow: GridRowModel) =>
			new Promise<GridRowModel>((resolve, reject) => {
				const changes = computeMutation(newRow, oldRow);
				if (!changes) return resolve(oldRow);
				setEditRecord(changes);
				setPromiseArguments({ resolve, reject, newRow, oldRow });
			}),
		[],
	);

	const handleModalConfirm = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		if (!promiseArguments) return;
		const { resolve, reject, newRow, oldRow } = promiseArguments;
		const input: Record<string, any> = {
			id: newRow.id,
			reason,
			changeCategory,
			changeReferenceUrl,
		};

		Object.keys(newRow).forEach((key) => {
			if (newRow[key] !== oldRow[key]) input[key] = newRow[key];
		});

		try {
			const result = await updateSetting({ input });
			resolve(result.updateFunctionalSetting);
		} catch (error) {
			reject(error);
		} finally {
			setPromiseArguments(null);
			setEditRecord(null);
		}
	};

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
					{ value: true, label: t("ui.action.yes") },
					{ value: false, label: t("ui.action.no") },
				],
				valueFormatter: (val: boolean) =>
					val
						? t("consortium.settings.enabled")
						: t("consortium.settings.disabled"),
			},
			{
				field: "actions",
				type: "actions",
				headerName: t("ui.actions"),
				width: 100,
				getActions: ({ id }) => {
					if (rowModesModel[id]?.mode === GridRowModes.Edit) {
						return [
							<GridActionsCellItem
								key="save"
								icon={<Save />}
								label={t("ui.save")}
								onClick={() =>
									setRowModesModel({
										...rowModesModel,
										[id]: { mode: GridRowModes.View },
									})
								}
							/>,
							<GridActionsCellItem
								key="cancel"
								icon={<Cancel />}
								label={t("ui.cancel")}
								onClick={() =>
									setRowModesModel({
										...rowModesModel,
										[id]: {
											mode: GridRowModes.View,
											ignoreModifications: true,
										},
									})
								}
							/>,
						];
					}
					return [
						<GridActionsCellItem
							key="edit"
							icon={<Edit />}
							label={t("ui.edit")}
							onClick={() =>
								setRowModesModel({
									...rowModesModel,
									[id]: { mode: GridRowModes.Edit },
								})
							}
							disabled={!isAnAdmin}
						/>,
					];
				},
			},
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
					<Tabs
						value={1}
						onChange={(_, val) =>
							router.navigate({
								to: [
									"/consortium",
									"/consortium/functionalSettings",
									"/consortium/onboarding",
									"/consortium/contacts",
								][val],
							})
						}
					>
						<Tab label={t("nav.consortium.profile")} />
						<Tab label={t("nav.consortium.functionalSettings")} />
						<Tab label={t("nav.consortium.onboarding")} />
						<Tab label={t("nav.consortium.contacts")} />
					</Tabs>
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
						processRowUpdate={processRowUpdate}
						checkboxSelection={false}
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

			<Confirmation
				open={!!promiseArguments}
				onClose={() => {
					promiseArguments?.resolve(promiseArguments.oldRow);
					setPromiseArguments(null);
					setEditRecord(null);
				}}
				onConfirm={handleModalConfirm}
				action="gridEdit"
				entityName="Functional Setting"
				editInformation={editRecord ?? undefined}
			/>

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
