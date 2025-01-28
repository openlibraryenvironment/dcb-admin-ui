import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { AdminLayout } from "@layout";
import { Library } from "@models/Library";
import { Delete } from "@mui/icons-material";
import { Button, Tab, Tabs, useTheme } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";
import { equalsOnly, standardFilters } from "src/helpers/filters";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";
import {
	deleteLibraryQuery,
	deleteLocationQuery,
	getLibraryBasicsLocation,
	getLocations,
	updateLocationQuery,
} from "src/queries/queries";
import NewLocation from "./NewLocation";
import { getILS } from "src/helpers/getILS";
type LibraryDetails = {
	libraryId: string;
};

interface NewLocationData {
	show: boolean;
	hostLmsCode: string;
	agencyCode: string;
	libraryName: string;
	ils: string;
}
export default function Locations({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	const [tabIndex, setTabIndex] = useState(6);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	// First we need to get the library
	const { data, loading, error } = useQuery(getLibraryBasicsLocation, {
		variables: {
			query: "id:" + libraryId,
			pageno: 0,
			pagesize: 100,
			order: "fullName",
			orderBy: "DESC",
		},
		pollInterval: 120000,
	});
	const library: Library = data?.libraries?.content?.[0];

	const [deleteLibrary] = useMutation(deleteLibraryQuery);

	const theme = useTheme();
	const router = useRouter();
	const customColumns = useCustomColumns();

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

	const [newLocation, setNewLocation] = useState<NewLocationData>({
		show: false,
		hostLmsCode: "",
		agencyCode: "",
		libraryName: "",
		ils: "",
	});
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

	const presetQueryVariables = library?.secondHostLms
		? `hostSystem: ${library?.agency?.hostLms?.id} OR hostSystem: ${library?.secondHostLms?.id}`
		: `hostSystem: ${library?.agency?.hostLms?.id}`;

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.locations").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

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
			title={t("locations.new.page_title", { name: library?.fullName })}
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
					{isAnAdmin ? (
						<Button
							data-tid="new-location-button"
							variant="outlined"
							onClick={() => {
								setNewLocation({
									show: true,
									hostLmsCode: library?.agency?.hostLms?.code,
									agencyCode: library?.agencyCode,
									libraryName: library?.fullName,
									ils: library?.agency?.hostLms?.lmsClientClass
										? getILS(library?.agency?.hostLms?.lmsClientClass)
										: "",
								});
							}}
						>
							{t("locations.new.button")}
						</Button>
					) : null}
					<ServerPaginationGrid
						query={getLocations}
						type="libraryLocations"
						coreType="locations"
						presetQueryVariables={presetQueryVariables}
						operationDataType="Location"
						columns={[
							...customColumns,
							{
								field: "hostSystemName",
								headerName: "Host LMS name",
								minWidth: 150,
								flex: 0.6,
								filterable: false,
								sortable: false,
								valueGetter: (value, row: { hostSystem: { name: string } }) =>
									row?.hostSystem?.name,
							},
							{
								field: "name",
								headerName: "Location name",
								minWidth: 150,
								flex: 0.6,
								editable: true,
								filterOperators: standardFilters,
							},
							{
								field: "printLabel",
								headerName: "Print label",
								minWidth: 150,
								flex: 0.6,
								editable: true,
								filterOperators: standardFilters,
							},
							{
								field: "code",
								headerName: "Location code",
								minWidth: 50,
								flex: 0.4,
								filterOperators: standardFilters,
							},
							{
								field: "isPickup",
								headerName: t("locations.new.pickup_status"),
								minWidth: 50,
								flex: 0.4,
								filterOperators: equalsOnly,
								valueFormatter: (value: boolean) => {
									if (value == true) {
										return t("consortium.settings.enabled");
									} else if (value == false) {
										return t("consortium.settings.disabled");
									} else {
										return t("details.location_pickup_not_set");
									}
								},
							},
							{
								field: "id",
								headerName: "Location UUID",
								minWidth: 50,
								flex: 0.8,
								filterOperators: standardFilters,
							},
						]}
						selectable={true}
						pageSize={200}
						noDataMessage={t("locations.no_rows")}
						noResultsMessage={t("locations.no_results")}
						searchPlaceholder={t("locations.search_placeholder")}
						columnVisibilityModel={{
							id: false,
						}}
						sortModel={[{ field: "name", sort: "asc" }]}
						sortDirection="ASC"
						sortAttribute="name"
						refetchQuery={["LoadLocations"]}
						deleteQuery={deleteLocationQuery}
						editQuery={updateLocationQuery}
					/>
				</Grid>
			</Grid>
			{newLocation.show ? (
				<NewLocation
					show={newLocation.show}
					onClose={() => {
						setNewLocation({
							show: false,
							hostLmsCode: "",
							agencyCode: "",
							libraryName: "",
							ils: "",
						});
					}}
					hostLmsCode={newLocation.hostLmsCode}
					agencyCode={newLocation.agencyCode}
					libraryName={newLocation.libraryName}
					type={"Pickup"}
					ils={newLocation.ils}
				/>
			) : null}
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
