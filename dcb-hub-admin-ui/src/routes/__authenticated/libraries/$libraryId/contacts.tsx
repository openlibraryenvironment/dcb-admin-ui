import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import {
	Grid,
	Tab,
	Tabs,
	Button,
	Typography,
	Stack,
	useTheme,
} from "@mui/material";
import { Edit, Delete, Save, Cancel } from "@mui/icons-material";
import {
	GridRowModesModel,
	GridRowModes,
	GridRowModel,
	GridColDef,
	GridActionsCellItem,
	GridRenderCellParams,
} from "@mui/x-data-grid-premium";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import DataGrid from "@components/DataGrid/DataGrid";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import NewContact from "@forms/NewContact/NewContact";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { computeMutation } from "@helpers/computeMutation";
import { handleDeleteEntity } from "@helpers/actions/editAndDeleteActions";
import { getLibraryContacts } from "@queries/getLibraryContacts";
import { updatePerson } from "@mutations/updatePerson";
import { deleteLibraryContact } from "@mutations/deleteLibraryContact";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/contacts",
)({
	component: LibraryContacts,
});

function LibraryContacts() {
	const { t } = useTranslation();
	const router = useRouter();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
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

	const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["library", "contacts", libraryId],
		queryFn: () =>
			gqlClient.request<any>(getLibraryContacts, {
				query: `id:${libraryId}`,
				pageno: 0,
				pagesize: 100,
				order: "fullName",
				orderBy: "DESC",
			}),
		enabled: !!libraryId,
	});

	const library = data?.libraries?.content?.[0];
	const contacts = library?.contacts ?? [];

	const { mutateAsync: updateContact } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(updatePerson, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["library", "contacts", libraryId],
			}),
	});
	const { mutate: deleteContact } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryContact, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["library", "contacts", libraryId],
			}),
	});
	const { mutateAsync: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryMutation, variables),
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
				if (newRow[key] !== oldRow[key])
					input[key] = key === "role" ? newRow[key].name : newRow[key];
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
		} else if (deleteContactId) {
			deleteContact(
				{
					input: {
						personId: deleteContactId,
						libraryId,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
				{ onSettled: () => setDeleteContactId(null) },
			);
		}
	};

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "role",
				headerName: t("libraries.contacts.role"),
				flex: 0.5,
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
				renderCell: (params: GridRenderCellParams) => (
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
					{ value: true, label: t("ui.action.yes") },
					{ value: false, label: t("ui.action.no") },
				],
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
						<GridActionsCellItem
							key="delete"
							icon={<Delete />}
							label={t("ui.delete")}
							onClick={() => setDeleteContactId(id as string)}
							disabled={!isAnAdmin}
						/>,
					];
				},
			},
		],
		[rowModesModel, isAnAdmin, t],
	);

	return (
		<AdminLayout
			title={library?.fullName}
			pageActions={[
				{
					key: "delete",
					onClick: () => setConfirmationDeletion(true),
					disabled: !isAnAdmin,
					label: t("ui.data_grid.delete_entity", {
						entity: t("libraries.library").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
			]}
		>
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
									`/libraries/${libraryId}`,
									`/libraries/${libraryId}/contacts`,
									`/libraries/${libraryId}/patronRequests`,
								][val],
							})
						}
					>
						<Tab label={t("nav.libraries.profile")} />
						<Tab label={t("nav.libraries.contacts")} />
						<Tab label={t("nav.libraries.patronRequests")} />
					</Tabs>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" fontWeight="bold">
						{t("nav.libraries.contacts")}
					</Typography>
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
						identifier="libraryContacts"
						type="contact"
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
						disableRowGrouping
						toolbarVisible={false}
						pagination
						scrollbarVisible={false}
						noResultsText="No contacts found for this library."
						searchText=""
						disableHoverInteractions
						disablePivoting
						listViewEnabled={false}
						paginationModel={{ page: 0, pageSize: 25 }}
						pivotingEnabled={false}
					/>
				</Grid>
			</Grid>

			<Confirmation
				open={!!promiseArguments || !!deleteContactId}
				onClose={() => {
					if (promiseArguments) {
						promiseArguments.resolve(promiseArguments.oldRow);
						setPromiseArguments(null);
						setEditRecord(null);
					}
					setDeleteContactId(null);
				}}
				onConfirm={handleModalConfirm}
				action={promiseArguments ? "gridEdit" : "deletion"}
				entityName="Contact"
				editInformation={editRecord ?? undefined}
			/>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(r, c, u) => {
					handleDeleteEntity(
						libraryId,
						r,
						c,
						u,
						setAlert,
						deleteLibrary,
						t,
						router,
						library?.fullName,
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={library?.fullName}
			/>
			{showNewContact && (
				<NewContact
					show={showNewContact}
					onClose={() => setShowNewContact(false)}
					id={libraryId}
					name={library?.fullName}
					entity="Library"
				/>
			)}
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</AdminLayout>
	);
}
