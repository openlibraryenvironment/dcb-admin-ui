import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { getDataChangeLog } from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { equalsOnly, standardFilters } from "src/helpers/filters";
// import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "src/helpers/useCustomColumns";
import dayjs from "dayjs";
import MasterDetail from "@components/MasterDetail/MasterDetail";

const DataChangeLog: NextPage = () => {
	const { t } = useTranslation();

	const router = useRouter();
	const customColumns = useCustomColumns();
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
						document_type: t("nav.serviceInfo.dataChangeLog").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.serviceInfo.dataChangeLog")}>
			<ServerPaginationGrid
				query={getDataChangeLog}
				type="dataChangeLog"
				coreType="dataChangeLog"
				columns={[
					...customColumns,
					{
						field: "timestampLogged",
						headerName: "Timestamp",
						minWidth: 150,
						flex: 0.6,
						filterable: false,
						valueGetter: (value: any, row: { timestampLogged: string }) => {
							const timestampLogged = row.timestampLogged;
							return dayjs(timestampLogged).format("YYYY-MM-DD HH:mm");
						},
					},
					{
						field: "lastEditedBy",
						headerName: "Last edited by",
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "entityId",
						headerName: "Entity ID",
						minWidth: 150,
						flex: 0.6,
						filterOperators: equalsOnly,
					},
					{
						field: "entityType",
						headerName: "Entity type",
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "actionInfo",
						headerName: "Action info",
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "reason",
						headerName: "Reason",
						minWidth: 50,
						flex: 0.6,
						filterOperators: standardFilters,
					},
					{
						field: "changes",
						headerName: "Changes",
						minWidth: 50,
						flex: 0.4,
						filterOperators: equalsOnly, // May want to filter by changes attributes - complex
					},
					{
						field: "id",
						headerName: "Data change log UUID",
						minWidth: 50,
						flex: 0.8,
						filterOperators: equalsOnly,
					},
				]}
				selectable={true}
				pageSize={10}
				noDataMessage={t("data_change_log.no_rows")}
				noResultsMessage={t("data_change_log.no_results")}
				columnVisibilityModel={{
					id: false,
					changes: false,
				}}
				// This is how to set the default sort order
				sortModel={[{ field: "timestampLogged", sort: "desc" }]}
				sortDirection="DESC"
				sortAttribute="timestampLogged"
				getDetailPanelContent={({ row }: any) => (
					<MasterDetail row={row} type="dataChangeLog" />
				)}
			/>
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

export default DataChangeLog;
