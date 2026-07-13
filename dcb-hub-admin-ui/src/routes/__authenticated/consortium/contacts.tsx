import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Tab, Tabs, Button, Stack } from "@mui/material";
import { Edit, Delete, Save, Cancel } from "@mui/icons-material";
import {
	GridRowModesModel,
	GridRowModes,
	GridRowModel,
	GridColDef,
	GridActionsCellItem,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Confirmation from "@components/Confirmation/Confirmation";
import NewContact from "@forms/NewContact/NewContact";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getConsortiumContacts } from "@queries/getConsortiumContacts";
import { updatePerson } from "@mutations/updatePerson";
import { deleteConsortiumContact } from "@mutations/deleteConsortiumContact";
import { computeMutation } from "@helpers/computeMutation";
import { CellEdit } from "@components/CellEdit/CellEdit";

export const Route = createFileRoute("/__authenticated/consortium/contacts")({
	component: Contacts,
});

function Contacts() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showNewContact, setShowNewContact] = useState(false);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [editRecord, setEditRecord] = useState<string | null>(null);
	const [deleteConfirmationId, setDeleteConfirmationId] = useState<
		string | null
	>(null);

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["LoadConsortiumContacts"],
		queryFn: () =>
			gqlClient.request<any>(getConsortiumContacts, {
				order: "id",
				orderBy: "DESC",
				pageno: 0,
				pagesize: 10,
			}),
	});

	const consortiumId = data?.consortia?.content?.[0]?.id;
	const contacts = data?.consortia?.content?.[0]?.contacts ?? [];

	const { mutateAsync: updateContact } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(updatePerson, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["LoadConsortiumContacts"] }),
	});

	const { mutate: deleteContact } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(deleteConsortiumContact, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["LoadConsortiumContacts"] }),
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
		if (promiseArguments) {
			const { resolve, reject, newRow, oldRow } = promiseArguments;
			const input: Record<string, any> = {
				id: newRow.id,
				reason,
				changeCategory,
				changeReferenceUrl,
			};

			Object.keys(newRow).forEach((key) => {
				if (newRow[key] !== oldRow[key]) {
					input[key] = key === "role" ? newRow[key].name : newRow[key];
				}
			});

			try {
				const result = await updateContact({ input });
				resolve(result.updatePerson);
			} catch (error) {
				reject(error);
			} finally {
				setPromiseArguments(null);
				setEditRecord(null);
			}
		} else if (deleteConfirmationId) {
			deleteContact(
				{
					input: {
						personId: deleteConfirmationId,
						consortiumId,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
				{
					onSettled: () => setDeleteConfirmationId(null),
				},
			);
		}
	};

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "role",
				headerName: t("libraries.contacts.role"),
				flex: 0.5,
				renderEditCell: (params) => <CellEdit {...params} />,
				editable: true,
				valueFormatter: (val: any) => val?.displayName ?? val?.name,
			},
			{
				field: "name",
				headerName: t("libraries.contacts.name"),
				flex: 0.7,
				editable: true,
				valueGetter: (val: any, row: any) =>
					`${row.firstName} ${row.lastName}`.trim(),
				valueSetter: (val: string, row: any) => {
					const [firstName, ...rest] = val.trim().split(/\s+/);
					return { ...row, firstName, lastName: rest.join(" ") };
				},
			},
			{
				field: "email",
				headerName: t("libraries.contacts.email"),
				flex: 0.7,
				editable: true,
				renderCell: (params: any) => (
					<RenderAttribute
						attribute={`mailto:${params.value ?? ""}`}
						title="email"
						type="url"
					/>
				),
			},
			{
				field: "isPrimaryContact",
				headerName: t("libraries.contacts.primary"),
				flex: 0.3,
				editable: true,
				type: "singleSelect",
				valueOptions: [
					{ value: true, label: t("ui.actions.yes") },
					{ value: false, label: t("ui.actions.no") },
				],
			},
			{
				field: "actions",
				type: "actions",
				headerName: t("ui.data_grid.actions"),
				width: 100,
				getActions: ({ id }) => {
					if (rowModesModel[id]?.mode === GridRowModes.Edit) {
						return [
							<GridActionsCellItem
								key="save"
								icon={<Save />}
								label={t("ui.data_grid.save")}
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
								label={t("ui.data_grid.cancel")}
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
							label={t("ui.data_grid.edit")}
							onClick={() =>
								setRowModesModel({
									...rowModesModel,
									[id]: { mode: GridRowModes.Edit },
								})
							}
							disabled={!isAnAdmin}
						/>,
						<GridActionsCellItem
							key="delete"
							icon={<Delete />}
							label={t("ui.data_grid.delete")}
							onClick={() => setDeleteConfirmationId(id as string)}
							disabled={!isAnAdmin}
						/>,
					];
				},
			},
		],
		[rowModesModel, isAnAdmin, t],
	);

	return (
		<PageContainer title={t("nav.consortium.contacts")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 3 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs
						value={3}
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
					<Stack direction="row" sx={{ mb: 2 }}>
						<Button
							variant="contained"
							onClick={() => setShowNewContact(true)}
							disabled={!isAnAdmin}
						>
							{t("consortium.new_contact.title")}
						</Button>
					</Stack>

					<DataGrid
						identifier="consortiumContacts"
						type="consortiumContact"
						columns={columns}
						rows={contacts}
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
						noResultsText={t("consortium.contacts.no_contacts")}
						searchText=""
					/>
				</Grid>
			</Grid>

			<Confirmation
				open={!!promiseArguments || !!deleteConfirmationId}
				onClose={() => {
					if (promiseArguments) {
						promiseArguments.resolve(promiseArguments.oldRow);
						setPromiseArguments(null);
						setEditRecord(null);
					}
					setDeleteConfirmationId(null);
				}}
				onConfirm={handleModalConfirm}
				action={promiseArguments ? "gridEdit" : "deletion"}
				entityName="Contact"
				editInformation={editRecord ?? undefined}
			/>

			{showNewContact && (
				<NewContact
					show={showNewContact}
					onClose={() => setShowNewContact(false)}
					id={consortiumId}
					name={data?.consortia?.content[0]?.displayName}
					entity="Consortium"
				/>
			)}
		</PageContainer>
	);
}
