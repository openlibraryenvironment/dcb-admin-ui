import { AdminLayout } from "@layout";
import { useTranslation } from "next-i18next";
import {
	deleteLibraryQuery,
	getBibs,
	getLibraryBasicsLocation,
} from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { equalsOnly, standardFilters } from "src/helpers/DataGrid/filters";
// import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { Library } from "@models/Library";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import Error from "@components/Error/Error";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import { Grid, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { Delete } from "@mui/icons-material";
type LibraryDetails = {
	libraryId: string;
};
export default function LibraryBibs({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	const router = useRouter();
	const customColumns = useCustomColumns();
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const client = useApolloClient();

	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const [tabIndex, setTabIndex] = useState(8);

	const [deleteLibrary] = useMutation(deleteLibraryQuery);

	const theme = useTheme();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
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
	const { data, loading, error } = useQuery(getLibraryBasicsLocation, {
		variables: {
			query: "id:" + libraryId,
			pageno: 0,
			pagesize: 100,
			order: "fullName",
			orderBy: "DESC",
		},
		errorPolicy: "all",
		skip: !libraryId,
		// pollInterval: 120000,
	});
	const library: Library = data?.libraries?.content?.[0];

	const presetQueryVariables = library?.secondHostLms
		? `sourceSystemId: ${library?.agency?.hostLms?.id} OR sourceSystemId: ${library?.secondHostLms?.id}`
		: `sourceSystemId: ${library?.agency?.hostLms?.id}`;

	// Expose only the filters we have tested. The others need to be mapped to Lucene functionality.
	// See potential examples here https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description
	// Bear in mind that operations on bibs can be really expensive. So we have to be careful with what we allow
	if (loading || status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.bibs").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	const BibsDisplay = () => {
		return (
			<ServerPaginationGrid
				query={getBibs}
				type="libraryBibs"
				coreType="sourceBibs"
				presetQueryVariables={presetQueryVariables}
				selectable={true}
				pageSize={5}
				noDataMessage={t("bibRecords.no_rows")}
				noResultsMessage={t("bibRecords.no_results")}
				// Sorting is disabled on this page because of the expensive nature of sorting millions of records.
				// If we want to restore it, just remove the 'sortable' attributes.
				columns={[
					...customColumns,
					{
						field: "title",
						headerName: t("details.source_bib_title"),
						minWidth: 150,
						flex: 0.6,
						sortable: false,
						filterOperators: standardFilters,
					},
					{
						field: "clusterRecordId",
						headerName: t("details.cluster_record_uuid"),
						minWidth: 50,
						flex: 0.5,
						sortable: false,
						filterOperators: equalsOnly,
						filterable: false,
						valueGetter: (value: any, row: { contributesTo: { id: string } }) =>
							row?.contributesTo?.id,
					},
					{
						field: "sourceRecordId",
						headerName: t("details.source_record_id"),
						minWidth: 50,
						sortable: false,
						filterOperators: standardFilters,
						flex: 0.5,
					},
					{
						field: "sourceSystemId",
						headerName: t("details.source_system_id"),
						minWidth: 50,
						sortable: false,
						filterOperators: equalsOnly,
						flex: 0.5,
					},
					{
						field: "id",
						headerName: t("details.source_bib_uuid"),
						minWidth: 100,
						flex: 0.5,
						sortable: false,
						filterOperators: equalsOnly,
					},
				]}
				columnVisibilityModel={{
					clusterRecordId: false,
					sourceSystemId: false,
				}}
				searchPlaceholder={t("bibRecords.search_placeholder")}
				sortDirection="ASC"
				sortAttribute="sourceRecordId"
				// getDetailPanelContent={({ row }: any) => (
				// 	<MasterDetail row={row} type="bibs" />
				// )}
			/>
		);
	};
	return error || library == null || library == undefined ? (
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
			title={library?.fullName}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("reference.catalog_build")}
			pageActions={pageActions}
			mode={"view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
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
						<Tab label={t("nav.libraries.supplierRequests.name")} />
						<Tab label={t("nav.libraries.contacts")} />
						<Tab label={t("nav.locations")} />
						<Tab label={t("nav.bibs")} />
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" fontWeight={"bold"}>
						{t("nav.bibs")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<BibsDisplay />
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
