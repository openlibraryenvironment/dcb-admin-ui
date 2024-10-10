import { useState } from "react";
import { AdminLayout } from "@layout";
import { Button } from "@mui/material";
import NewGroup from "./NewGroup";
import { getLibraryGroups } from "src/queries/queries";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";
import { standardFilters } from "src/helpers/filters";
// import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "@hooks/useCustomColumns";
// Groups Feature Page Structure
// This page shows the list of groups
// New Group is the (modal) form to add a group
// [groupId].tsx is the 'Details' page.
// Groups have been altered to take Libraries - no longer agencies

const Groups: NextPage = () => {
	const [showNewGroup, setShowNewGroup] = useState(false);
	const customColumns = useCustomColumns();
	const openNewGroup = () => {
		setShowNewGroup(true);
	};
	const closeNewGroup = () => {
		setShowNewGroup(false);
	};
	const { t } = useTranslation();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});
	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.groups").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout data-tid="groups-title" title={t("nav.groups")}>
			<Button
				data-tid="new-group-button"
				variant="contained"
				onClick={openNewGroup}
			>
				{t("groups.type_new")}
			</Button>
			<ServerPaginationGrid
				query={getLibraryGroups}
				coreType="libraryGroups"
				type="groups"
				columnVisibilityModel={{
					id: false,
				}}
				columns={[
					...customColumns,
					{
						field: "name",
						headerName: "Group name",
						minWidth: 150,
						flex: 0.6,
						filterOperators: standardFilters,
					},
					{
						field: "code",
						headerName: "Group code",
						minWidth: 50,
						flex: 0.6,
						filterOperators: standardFilters,
					},
					{
						field: "type",
						headerName: "Group type",
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "id",
						headerName: "Group UUID",
						minWidth: 100,
						flex: 0.8,
						filterOperators: standardFilters,
					},
				]}
				selectable={true}
				pageSize={10}
				noDataMessage={t("groups.no_rows")}
				noResultsMessage={t("groups.no_results")}
				searchPlaceholder={t("groups.search_placeholder")}
				// This is how to set the default sort order
				sortModel={[{ field: "name", sort: "asc" }]}
				sortDirection="ASC"
				sortAttribute="name"
				// getDetailPanelContent={({ row }: any) => (
				// 	<MasterDetail row={row} type="groups" />
				// )}
			/>
			<div>
				{showNewGroup ? (
					<NewGroup show={showNewGroup} onClose={closeNewGroup} />
				) : null}
			</div>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
};

export default Groups;
