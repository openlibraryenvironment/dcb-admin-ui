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
import {
	containsOnly,
	equalsOnly,
	standardFilters,
} from "src/helpers/DataGrid/filters";
// import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "@hooks/useCustomColumns";
import dayjs from "dayjs";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import {
	calculateEntityLink,
	tableNameToEntityName,
} from "src/helpers/dataChangeLogHelperFunctions";
import { capitaliseFirstCharacter } from "src/helpers/capitaliseFirstCharacter";
import Link from "@components/Link/Link";
import { GridRenderCellParams } from "@mui/x-data-grid-premium";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";

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
			<AdminLayout hideBreadcrumbs>
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
						minWidth: 100,
						flex: 0.5,
						filterable: false,
						valueGetter: (value: any, row: { timestampLogged: string }) => {
							const timestampLogged = row.timestampLogged;
							return dayjs(timestampLogged).format("YYYY-MM-DD HH:mm:ss");
						},
					},
					{
						field: "entityType",
						headerName: "Entity",
						minWidth: 50,
						flex: 0.5,
						filterOperators: containsOnly,
						valueGetter: (value: any, row: { entityType: string }) => {
							const formattedEntity = capitaliseFirstCharacter(
								t(tableNameToEntityName(row?.entityType)),
							);
							return formattedEntity;
						},
					},

					{
						field: "entityId",
						headerName: t("data_change_log.entity_id"),
						minWidth: 100,
						flex: 0.4,
						filterOperators: equalsOnly,
						renderCell: (params: any) => {
							const row = params.row;
							if (
								row?.entityType == "reference_value_mapping" ||
								row?.entityType == "numeric_range_mapping" ||
								row?.entityType == "person" ||
								row?.actionInfo == "DELETE" ||
								row?.changeCategory == "Membership ended"
							) {
								return params.value;
							} else {
								return (
									<Link
										href={`/${calculateEntityLink(row?.entityType)}/${row?.entityId}`}
									>
										{params.value}
									</Link>
								);
							}
						},
					},
					{
						field: "actionInfo",
						headerName: t("data_change_log.action"),
						minWidth: 50,
						flex: 0.25,
						filterOperators: standardFilters,
					},
					{
						field: "changeCategory",
						headerName: t("data_change_log.category"),
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "reason",
						headerName: t("data_change_log.reason"),
						minWidth: 50,
						flex: 0.6,
						filterOperators: standardFilters,
					},
					{
						field: "lastEditedBy",
						headerName: t("data_change_log.user"),
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					// Hidden by default
					{
						field: "changeReferenceUrl",
						headerName: t("data_change_log.reference_url"),
						minWidth: 50,
						flex: 0.6,
						filterOperators: standardFilters,
						renderCell: (params: GridRenderCellParams) => {
							const changeReferenceUrl = params.value;
							return (
								<RenderAttribute
									attribute={changeReferenceUrl}
									type="url"
									title={changeReferenceUrl}
								/>
							);
						},
					},
					{
						field: "id",
						headerName: t("data_change_log.id"),
						minWidth: 50,
						flex: 0.4,
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
					changeReferenceUrl: false,
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
