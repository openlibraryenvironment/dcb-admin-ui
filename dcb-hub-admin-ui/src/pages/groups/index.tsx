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
import { getGridStringOperators } from "@mui/x-data-grid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";

// Groups Feature Page Structure
// This page shows the list of groups
// New Group is the (modal) form to add a group
// [groupId].tsx is the 'Details' page.
// Groups have been altered to take Libraries - no longer agencies

const Groups: NextPage = () => {
	const [showNewGroup, setShowNewGroup] = useState(false);
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
			// If user is not authenticated, push them to unauthorised page
			// At present, they will likely be kicked to the logout page first
			// However this is important for when we introduce RBAC.
			router.push("/unauthorised");
		},
	});
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);
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
				columns={[
					{
						field: "name",
						headerName: "Group name",
						minWidth: 150,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "id",
						headerName: "Group ID",
						minWidth: 100,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "code",
						headerName: "Group code",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "type",
						headerName: "Group type",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
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
