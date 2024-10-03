import { AdminLayout } from "@layout";
import { useTranslation } from "next-i18next";
import { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import {
	deleteLibraryQuery,
	getLibraries,
	updateLibraryQuery,
} from "src/queries/queries";
import { getILS } from "src/helpers/getILS";
import Button from "@mui/material/Button";
import { useState } from "react";
import AddLibraryToGroup from "./AddLibraryToGroup";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { equalsOnly, standardFilters } from "src/helpers/filters";
import { useCustomColumns } from "src/helpers/useCustomColumns";
// import MasterDetail from "@components/MasterDetail/MasterDetail";

const Libraries: NextPage = () => {
	// State management for the adding library to group modal
	const [addToGroup, setAddToGroup] = useState(false);
	const openAddToGroup = () => {
		setAddToGroup(true);
	};
	const closeAddToGroup = () => {
		setAddToGroup(false);
	};
	const { t } = useTranslation();
	const customColumns = useCustomColumns();

	const router = useRouter();
	const { data, status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});
	// This is a test to see if the RefreshAccessToken Error is passed to the client properly.
	if (data?.error) {
		console.log("Error:" + data?.error);
	}

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.libraries").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.libraries")}>
			<Button
				data-tid="add-library-to-group"
				variant="contained"
				onClick={openAddToGroup}
			>
				{t("libraries.add_to_group")}
			</Button>
			<ServerPaginationGrid
				query={getLibraries}
				coreType="libraries"
				type="libraries"
				columnVisibilityModel={{
					id: false,
					clientConfigIngest: false,
					isSupplyingAgency: false,
					isBorrowingAgency: false,
					hostLmsCatalogue: false,
					hostLmsCirculation: false,
				}}
				columns={[
					...customColumns,
					{
						field: "abbreviatedName",
						headerName: "Abbreviated name",
						flex: 0.4,
						filterOperators: standardFilters,
						editable: true,
					},
					{
						field: "fullName",
						headerName: "Full name",
						flex: 0.6,
						filterOperators: standardFilters,
						editable: true,
					},
					{
						field: "ils",
						headerName: "ILS",
						flex: 0.5,
						filterable: false,
						sortable: false,
						valueGetter: (value, row) =>
							getILS(row?.agency?.hostLms?.lmsClientClass),
						// This defaults to the ILS of the first Host LMS
					},
					{
						field: "authProfile",
						headerName: "Auth profile",
						flex: 0.5,
						sortable: false,
						filterable: false,
						valueGetter: (value, row) => row?.agency?.authProfile,
					},
					{
						field: "id",
						headerName: "Library UUID",
						flex: 0.6,
						filterOperators: equalsOnly,
					},
					{
						field: "agencyCode",
						headerName: "Agency code",
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "clientConfigIngest",
						headerName: "Ingest enabled",
						minWidth: 50,
						flex: 0.3,
						filterable: false,
						sortable: false,
						valueGetter: (value, row) => {
							return row?.agency?.hostLms?.clientConfig?.ingest;
						},
					},
					{
						field: "isSupplyingAgency",
						headerName: "Supplying",
						flex: 0.25,
						filterable: false,
						sortable: false,
						valueGetter: (value, row) => {
							const agency = row?.agency;
							if (
								agency &&
								Object.prototype.hasOwnProperty.call(
									agency,
									"isSupplyingAgency",
								) &&
								agency?.isSupplyingAgency == null
							) {
								// Returns "Not set" only for libraries where an agency with the property exists, but is set to null
								// Does not return "Not set" for libraries without an agency
								return t("libraries.circulation.not_set");
							}

							return row?.agency?.isSupplyingAgency;
						},
					},
					{
						field: "isBorrowingAgency",
						headerName: "Borrowing",
						flex: 0.25,
						filterable: false,
						sortable: false,
						valueGetter: (value, row) => {
							const agency = row?.agency;
							if (
								agency &&
								Object.prototype.hasOwnProperty.call(
									agency,
									"isBorrowingAgency",
								) &&
								agency?.isBorrowingAgency == null
							) {
								// Returns "Not set" only for libraries where an agency with the property exists, but is set to null
								// Does not return "Not set" for libraries without an agency
								return t("libraries.circulation.not_set");
							}

							return row?.agency?.isBorrowingAgency;
						},
					},
					{
						field: "hostLmsCirculation",
						headerName: "Host LMS (circulation)",
						flex: 0.5,
						filterable: false,
						sortable: false,
						valueGetter: (value, row) => row?.agency?.hostLms?.code,
					},
					{
						field: "hostLmsCatalogue",
						headerName: "Host LMS (catalogue)",
						flex: 0.5,
						filterable: false,
						sortable: false,
						valueGetter: (value, row) => row?.secondHostLms?.code,
					},
				]}
				selectable={true}
				pageSize={200}
				noDataMessage={t("libraries.none_available")}
				noResultsMessage={t("libraries.none_found")}
				searchPlaceholder={t("libraries.search_placeholder")}
				sortDirection="ASC"
				sortAttribute="abbreviatedName"
				sortModel={[{ field: "abbreviatedName", sort: "asc" }]}
				deleteQuery={deleteLibraryQuery}
				editQuery={updateLibraryQuery}
				refetchQuery={["LoadLibraries"]}
				operationDataType={t("libraries.library")}
				// getDetailPanelContent={({ row }: any) => (
				// 	<MasterDetail row={row} type="libraries" />
				// )}
			/>
			{addToGroup ? (
				<AddLibraryToGroup show={addToGroup} onClose={closeAddToGroup} />
			) : null}
		</AdminLayout>
	);
};

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
				"application",
				"common",
				"validation",
			])),
		},
	};
}

export default Libraries;
