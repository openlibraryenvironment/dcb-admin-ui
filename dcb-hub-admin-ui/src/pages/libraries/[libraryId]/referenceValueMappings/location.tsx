import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { Library } from "@models/Library";
import { Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import {
	deleteLibraryQuery,
	deleteReferenceValueMapping,
	getLibraryById,
	getMappings,
	updateReferenceValueMapping,
} from "src/queries/queries";
import { refValueMappingColumnsNoCategoryFilter } from "src/helpers/columns";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";
import { Delete } from "@mui/icons-material";
import { useState } from "react";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import MultipleTabNavigation from "@components/Navigation/MultipleTabNavigation";

type LibraryDetails = {
	libraryId: any;
};
export default function Location({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	const theme = useTheme();
	const router = useRouter();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const [tabIndex, setTabIndex] = useState(3);
	const [subTabIndex, setSubTabIndex] = useState(2);
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

	const { data, loading, error } = useQuery(getLibraryById, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000, // pollInterval is in ms - set to 2 mins
	});
	const [deleteLibrary] = useMutation(deleteLibraryQuery);

	const library: Library = data?.libraries?.content?.[0];
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

	const refValueLocationVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "Location" OR fromCategory: "Location") AND (NOT deleted:true)`;
	const refValueLocationForLibrarySecondHostLmsVariables = `(toContext:"${library?.secondHostLms?.code}" OR fromContext:${library?.secondHostLms?.code}) AND (toCategory: "Location" OR fromCategory: "Location") AND (NOT deleted:true)`;

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
			title={t("libraries.config.data.mappings.title", {
				libraryName: library?.fullName,
			})}
			pageActions={pageActions}
			mode={"view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid xs={4} sm={8} md={12}>
					<MultipleTabNavigation
						tabIndex={tabIndex}
						subTabIndex={subTabIndex}
						setTabIndex={setTabIndex}
						setSubTabIndex={setSubTabIndex}
						hostLmsCode={library?.agency?.hostLms?.code}
						libraryId={libraryId}
						type="mappings"
					/>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.config.data.mappings.location", {
							hostLms: library?.agency?.hostLms?.code,
						})}
					</Typography>
					<ServerPaginationGrid
						query={getMappings}
						editQuery={updateReferenceValueMapping}
						deleteQuery={deleteReferenceValueMapping}
						refetchQuery={["LoadMappings"]}
						presetQueryVariables={refValueLocationVariables}
						type="referenceValueMappingsForLibraryLocation"
						coreType="referenceValueMappings"
						operationDataType="ReferenceValueMapping"
						columns={refValueMappingColumnsNoCategoryFilter}
						noDataMessage={t("mappings.import_no_data")}
						noResultsMessage={t("mappings.no_results")}
						selectable={false}
						// This is how to set the default sort order
						sortModel={[{ field: "fromContext", sort: "asc" }]}
						sortDirection="ASC"
						sortAttribute="fromContext"
						pageSize={200}
						columnVisibilityModel={{
							fromCategory: false,
							lastImported: false,
							toCategory: false,
						}}
					/>
				</Grid>
				{library?.secondHostLms ? (
					<Grid xs={4} sm={8} md={12}>
						<Typography variant="h3" fontWeight={"bold"}>
							{t("libraries.config.data.mappings.location", {
								hostLms: library?.secondHostLms?.code,
							})}
						</Typography>
						<ServerPaginationGrid
							query={getMappings}
							editQuery={updateReferenceValueMapping}
							deleteQuery={deleteReferenceValueMapping}
							refetchQuery={["LoadMappings"]}
							presetQueryVariables={
								refValueLocationForLibrarySecondHostLmsVariables
							}
							type="referenceValueMappingsForLibraryLocationSecondHostLMS"
							coreType="referenceValueMappings"
							operationDataType="ReferenceValueMapping"
							columns={refValueMappingColumnsNoCategoryFilter}
							noDataMessage={t("mappings.import_no_data")}
							noResultsMessage={t("mappings.no_results")}
							selectable={false}
							// This is how to set the default sort order
							sortModel={[{ field: "fromContext", sort: "asc" }]}
							sortDirection="ASC"
							sortAttribute="fromContext"
							pageSize={20}
							columnVisibilityModel={{
								fromCategory: false,
								lastImported: false,
								toCategory: false,
							}}
						/>
					</Grid>
				) : null}
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