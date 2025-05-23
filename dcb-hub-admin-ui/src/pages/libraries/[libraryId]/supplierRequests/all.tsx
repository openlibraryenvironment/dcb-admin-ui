import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { Library } from "@models/Library";
import { Grid, Typography, useTheme } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import {
	deleteLibraryQuery,
	getLibraryBasicsPR,
	getPatronRequests,
	getSupplierRequests,
} from "src/queries/queries";
import {
	defaultSupplierRequestLibraryColumnVisibility,
	standardPatronRequestColumns,
} from "src/helpers/DataGrid/columns";
import { useCustomColumns } from "@hooks/useCustomColumns";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";
import { Delete } from "@mui/icons-material";
import { useCallback, useState } from "react";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import MultipleTabNavigation from "@components/Navigation/MultipleTabNavigation";
import MasterDetail from "@components/MasterDetail/MasterDetail";

// group by patron request ID?
type LibraryDetails = {
	libraryId: any;
};
export default function PatronRequests({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();
	const customColumns = useCustomColumns();
	const theme = useTheme();
	const router = useRouter();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const [tabIndex, setTabIndex] = useState(5);
	const [subTabIndex, setSubTabIndex] = useState(0);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const client = useApolloClient();
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
	const { data, loading, error } = useQuery(getLibraryBasicsPR, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000, // pollInterval is in ms - set to 2 mins
	});
	const [deleteLibrary] = useMutation(deleteLibraryQuery);
	const library: Library = data?.libraries?.content?.[0];
	const [totalSizes, setTotalSizes] = useState<{ [key: string]: number }>({});
	const agencyCode = library?.agencyCode;

	const supplierVariables = `localAgency: "${agencyCode}"`;
	// Query to get the supplier requests patron ids
	// which we then use to fill a patron request grid
	// because we can't filter normally on supplying agency

	const { data: supplierData } = useQuery(getSupplierRequests, {
		variables: {
			query: supplierVariables,
			pageno: 0,
			pagesize: 10000,
			order: "dateCreated",
			orderBy: "DESC",
		},
		skip: !agencyCode,
	});
	// Try and map the supplier request patron IDs

	const patronRequestIds = supplierData?.supplierRequests?.content
		?.map((request: any) => request.patronRequest?.id)
		.filter(Boolean);

	// Attempt to formulate a query
	const patronRequestQuery = patronRequestIds?.length
		? patronRequestIds.map((id: string) => `id:${id}`).join(" OR ")
		: "";

	console.log(patronRequestQuery);

	const handleTotalSizeChange = useCallback((type: string, size: number) => {
		setTotalSizes((prevTotalSizes) => ({
			...prevTotalSizes,
			[type]: size,
		}));
	}, []);

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

	return error || library == null || library == undefined ? (
		<AdminLayout hideBreadcrumbs>
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
			pageActions={pageActions}
			mode={"view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<MultipleTabNavigation
					tabIndex={tabIndex}
					subTabIndex={subTabIndex}
					setTabIndex={setTabIndex}
					setSubTabIndex={setSubTabIndex}
					hostLmsCode={library?.agency?.hostLms?.code}
					libraryId={libraryId}
					type="supplierRequests"
					agencyCode={library?.agencyCode}
					presetTotal={totalSizes["supplierRequestsLibrary"]}
				/>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.patronRequests.all", {
							number: totalSizes["supplierRequestsLibrary"],
						})}
					</Typography>
					<ServerPaginationGrid
						query={getPatronRequests}
						presetQueryVariables={"(" + patronRequestQuery + ")"}
						type="supplierRequestsLibrary"
						coreType="patronRequests"
						columns={[...customColumns, ...standardPatronRequestColumns]}
						selectable={true}
						pageSize={20}
						noDataMessage={t("patron_requests.no_rows")}
						noResultsMessage={t("patron_requests.no_results")}
						searchPlaceholder={t("patron_requests.search_placeholder_status")}
						columnVisibilityModel={
							defaultSupplierRequestLibraryColumnVisibility
						}
						scrollbarVisible={true}
						// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
						sortModel={[{ field: "dateCreated", sort: "desc" }]}
						sortDirection="DESC"
						sortAttribute="dateCreated"
						onTotalSizeChange={handleTotalSizeChange}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
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
