import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Button, Typography, Stack, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";
import {
	GridRowModesModel,
	GridColDef,
	GridRenderCellParams,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import NewContact from "@forms/NewContact/NewContact";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
import { getLibraryContacts } from "@queries/getLibraryContacts";
import type { LoadLibraryContactsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/contacts",
)({
	component: LibraryContacts,
});

function LibraryContacts() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showNewContact, setShowNewContact] = useState(false);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	// Two entities are mutable from this page: the contacts in the grid, and the
	// library itself via the page's delete action. Separate registry entries, so
	// separate hooks - each invalidates only what its own entity affects.
	const contactMutation = useEntityMutation("libraryContact");
	const libraryMutation = useEntityMutation("library");

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["library", "contacts", libraryId],
		queryFn: () =>
			gqlClient.request<any, LoadLibraryContactsQueryVariables>(
				getLibraryContacts,
				{
					query: `id:${libraryId}`,
					pageno: 0,
					pagesize: 100,
					order: "fullName",
					orderBy: "DESC",
				},
			),
		enabled: !!libraryId,
	});

	const library = data?.libraries?.content?.[0];
	const contacts = library?.contacts ?? [];

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
					{ value: true, label: t("ui.actions.yes") },
					{ value: false, label: t("ui.actions.no") },
				],
			},
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id, row) =>
					contactMutation.requestDelete({
						id: id as string,
						name: `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
						ownerId: libraryId,
					}),
				canEdit: isAnAdmin,
			}),
		],
		[rowModesModel, isAnAdmin, t, libraryId, contactMutation],
	);

	return (
		<PageContainer
			title={library?.fullName}
			pageActions={[
				libraryMutation.buildDeleteAction({
					id: libraryId,
					name: library?.fullName,
					redirect: "/libraries",
					disabled: !isAnAdmin,
					icon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
				}),
			]}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 3 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={6} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
						}}
					>
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
						processRowUpdate={contactMutation.requestGridEdit}
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
			<EntityMutationDialogs {...contactMutation.dialogProps} />
			<EntityMutationDialogs {...libraryMutation.dialogProps} />
			{showNewContact && (
				<NewContact
					show={showNewContact}
					onClose={() => setShowNewContact(false)}
					id={libraryId}
					name={library?.fullName}
					entity="Library"
				/>
			)}
		</PageContainer>
	);
}
