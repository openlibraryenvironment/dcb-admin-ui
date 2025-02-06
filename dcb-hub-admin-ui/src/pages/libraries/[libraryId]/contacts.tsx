import { Library } from "@models/Library";
import { Tab, Tabs, useTheme } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
	deleteLibraryQuery,
	getLibraryContacts,
	updatePerson,
} from "src/queries/queries";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AdminLayout } from "@layout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useState } from "react";
import { Delete } from "@mui/icons-material";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { GridRenderCellParams } from "@mui/x-data-grid-premium";
import { Person } from "@models/Person";

type LibraryDetails = {
	libraryId: any;
};

export default function Contacts({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	const [tabIndex, setTabIndex] = useState(5);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const { data, loading, error } = useQuery(getLibraryContacts, {
		variables: {
			query: "id:" + libraryId,
			pageno: 0,
			pagesize: 100,
			order: "fullName",
			orderBy: "DESC",
		},
		pollInterval: 120000,
	});
	const [deleteLibrary] = useMutation(deleteLibraryQuery);

	const theme = useTheme();
	const router = useRouter();
	const client = useApolloClient();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
	// Will change when the query changes
	const library: Library = data?.libraries?.content?.[0];
	const contacts: Person[] = library?.contacts ?? [];

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("libraries.library").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	const pageActions = [
		{
			key: "delete",
			onClick: () => setConfirmationDeletion(true),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.delete_entity", {
				entity: t("libraries.library").toLowerCase(),
			}),
			startIcon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
		},
	];

	return error || contacts == null || contacts == undefined ? (
		<AdminLayout>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout
			title={t("libraries.contacts.title", { name: library?.fullName })}
			pageActions={pageActions}
			mode={"view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid xs={4} sm={8} md={12}>
					<Tabs
						value={tabIndex}
						onChange={(event, value) => {
							handleTabChange(event, value, router, setTabIndex, libraryId);
						}}
						aria-label="Library navigation"
					>
						<Tab label={t("nav.libraries.profile")} />
						<Tab label={t("nav.libraries.service")} />
						<Tab label={t("nav.libraries.settings")} />
						<Tab label={t("nav.mappings.name")} />
						<Tab label={t("nav.libraries.patronRequests.name")} />
						<Tab label={t("nav.libraries.contacts")} />
						<Tab label={t("nav.locations")} />
					</Tabs>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<ClientDataGrid
						columns={[
							{
								field: "role",
								headerName: t("libraries.contacts.role"),
								minWidth: 50,
								editable: true,
								flex: 0.5,
								valueFormatter: (value: {
									displayName: string;
									name: string;
								}) => {
									return value.displayName ?? value.name;
								},
							},
							{
								field: "name",
								headerName: t("libraries.contacts.name"),
								minWidth: 50,
								editable: true,
								flex: 0.7,
								valueGetter: (value: string, row: Person) => {
									return `${row.firstName} ${row.lastName}`.trim();
								},
								valueSetter: (value: string, row: Person) => {
									// if we can remove regex would be better
									const [firstName, ...rest] = value.trim().split(/\s+/); // Split by any whitespace
									const lastName = rest.join(" "); // Join the remaining parts as the last name
									return { ...row, firstName, lastName };
								},
							},
							{
								field: "email",
								headerName: t("libraries.contacts.email"),
								minWidth: 50,
								editable: true,
								flex: 0.7,
								renderCell: (params: GridRenderCellParams) => {
									const email = params.value ?? "";
									return (
										<RenderAttribute
											attribute={`mailto:${email}`}
											title="email"
											type="url"
										/>
									);
								},
							},
							{
								field: "isPrimaryContact",
								headerName: t("libraries.contacts.primary"),
								minWidth: 50,
								editable: true,
								flex: 0.3,
								type: "singleSelect",
								valueOptions: [
									{ value: true, label: t("ui.action.yes") },
									{ value: false, label: t("ui.action.no") },
								],
							},
						]}
						data={contacts}
						type="contact"
						// No need for click through on this grid - fix translation keys
						selectable={false}
						sortModel={[{ field: "isPrimaryContact", sort: "desc" }]}
						noDataTitle={"No contacts found for this library."}
						toolbarVisible="search-only"
						disableHoverInteractions={true}
						editQuery={updatePerson}
						operationDataType="Person"
					/>
				</Grid>
			</Grid>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title}
			/>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() =>
					closeConfirmation(setConfirmationDeletion, client, "LoadLibrary")
				}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					handleDeleteEntity(
						library.id,
						reason,
						changeCategory,
						changeReferenceUrl,
						setAlert,
						deleteLibrary,
						t,
						router,
						library?.fullName ?? "",
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				type={"deletelibraries"}
				entityName={library?.fullName}
				entity={t("libraries.library")}
				gridEdit={false}
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
	const libraryId = ctx.params.libraryId;
	return {
		props: {
			libraryId,
			...translations,
		},
	};
}
