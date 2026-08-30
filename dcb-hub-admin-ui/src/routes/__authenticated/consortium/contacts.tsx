import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Button, Stack } from "@mui/material";
import { GridRowModesModel, GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import ConsortiumTabs from "@components/ConsortiumTabs/ConsortiumTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import NewContact from "@forms/NewContact/NewContact";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { getConsortiumContacts } from "@queries/getConsortiumContacts";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
import { CellEdit } from "@components/CellEdit/CellEdit";
import type { LoadConsortiumContactsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute("/__authenticated/consortium/contacts")({
	component: Contacts,
});

function Contacts() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const [showNewContact, setShowNewContact] = useState(false);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const contactMutation = useEntityMutation("consortiumContact");

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["LoadConsortiumContacts"],
		queryFn: () =>
			gqlClient.request<any, LoadConsortiumContactsQueryVariables>(
				getConsortiumContacts,
				{
					order: "id",
					orderBy: "DESC",
				},
			),
	});

	const consortiumId = data?.consortia?.content?.[0]?.id;
	const contacts = data?.consortia?.content?.[0]?.contacts ?? [];

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
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id, row) =>
					contactMutation.requestDelete({
						id: id as string,
						name: `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
						ownerId: consortiumId,
					}),
				canEdit: isAnAdmin,
			}),
		],
		[rowModesModel, isAnAdmin, t, consortiumId, contactMutation],
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
					<ConsortiumTabs current="contacts" />
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
						processRowUpdate={contactMutation.requestGridEdit}
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

			<EntityMutationDialogs {...contactMutation.dialogProps} />

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
