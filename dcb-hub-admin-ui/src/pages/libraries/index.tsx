import { AdminLayout } from "@layout";
import { getGridStringOperators } from "@mui/x-data-grid";
import { useTranslation } from "next-i18next";
import { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getLibraries } from "src/queries/queries";
import { getILS } from "src/helpers/getILS";
import Button from "@mui/material/Button";
import { useState } from "react";
import AddLibraryToGroup from "./AddLibraryToGroup";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

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
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// If user is not authenticated, push them to unauthorised page
			// At present, they will likely be kicked to the logout page first
			// However this is important for when we introduce RBAC.
			router.push("/unauthorised");
		},
	});

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
					hostLmsCatalogue: false,
					hostLmsCirculation: false,
				}}
				columns={[
					{
						field: "abbreviatedName",
						headerName: "Abbreviated name",
						flex: 0.5,
						filterOperators,
					},
					{
						field: "shortName",
						headerName: "Short name",
						flex: 0.5,
						filterOperators,
					},
					{
						field: "ils",
						headerName: "ILS",
						flex: 0.5,
						filterOperators,
						valueGetter: (params: {
							row: { agency: { hostLms: { lmsClientClass: string } } };
						}) => getILS(params?.row?.agency?.hostLms?.lmsClientClass),
						// This defaults to the ILS of the first Host LMS
					},
					{
						field: "authProfile",
						headerName: "Auth profile",
						flex: 0.5,
						filterOperators,
						valueGetter: (params: {
							row: { agency: { authProfile: string } };
						}) => params?.row?.agency?.authProfile,
					},
					{
						field: "id",
						headerName: "Library ID",
						flex: 0.5,
						filterOperators,
					},
					{
						field: "code",
						headerName: "Agency code",
						flex: 0.5,
						filterOperators,
						valueGetter: (params: { row: { agency: { code: string } } }) =>
							params?.row?.agency?.code,
					},
					{
						field: "hostLmsCirculation",
						headerName: "Host LMS (circulation)",
						flex: 0.5,
						filterOperators,
						valueGetter: (params: {
							row: { agency: { hostLms: { code: string } } };
						}) => params?.row?.agency?.hostLms?.code,
					},
					{
						field: "hostLmsCatalogue",
						headerName: "Host LMS (catalogue)",
						flex: 0.5,
						filterOperators,
						valueGetter: (params: {
							row: { secondHostLms: { code: string } };
						}) => params?.row?.secondHostLms?.code,
					},
				]}
				selectable={true}
				pageSize={10}
				noDataMessage={t("libraries.none_available")}
				noResultsMessage={t("libraries.none_found")}
				searchPlaceholder={t("libraries.search_placeholder")}
				sortDirection="ASC"
				sortAttribute="shortName"
				sortModel={[{ field: "shortName", sort: "ASC" }]}
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
