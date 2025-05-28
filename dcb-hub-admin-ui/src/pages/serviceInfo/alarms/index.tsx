import Loading from "@components/Loading/Loading";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { AdminLayout } from "@layout";
import dayjs from "dayjs";
import { GetServerSideProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { equalsOnly, standardFilters } from "src/helpers/DataGrid/filters";
import { getAlarms } from "src/queries/queries";

const Alarms: NextPage = () => {
	const { status } = useSession();
	const { t } = useTranslation();

	const customColumns = useCustomColumns();
	const columns = [
		{
			field: "id",
			headerName: t("alarms.id"),
			minWidth: 100,
			flex: 0.5,
			filterOperators: equalsOnly,
		},
		{
			field: "code",
			headerName: t("alarms.code"),
			minWidth: 100,
			flex: 0.8,
			filterOperators: standardFilters,
		},
		{
			field: "created",
			headerName: t("alarms.created"),
			minWidth: 50,
			flex: 0.3,
			filterable: false,
			valueGetter: (value: any, row: { created: string }) => {
				const created = row?.created;
				return dayjs(created).format("YYYY-MM-DD HH:mm");
			},
		},
		{
			field: "lastSeen",
			headerName: t("alarms.last_seen"),
			minWidth: 50,
			flex: 0.3,
			filterable: false,
			valueGetter: (value: any, row: { lastSeen: string }) => {
				const lastSeen = row?.lastSeen;
				return dayjs(lastSeen).format("YYYY-MM-DD HH:mm");
			},
		},
		{
			field: "repeatCount",
			headerName: t("alarms.repeat_count"),
			flex: 0.2,
			filterable: false,
		},
		{
			field: "expires",
			headerName: t("alarms.expires"),
			minWidth: 50,
			flex: 0.3,
			filterable: false,
			valueGetter: (value: any, row: { expires: string }) => {
				const expires = row?.expires;
				return dayjs(expires).format("YYYY-MM-DD HH:mm");
			},
		},
	];

	const alarmColumns = [...customColumns, ...columns];

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.serviceInfo.serviceStatus").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.serviceInfo.alarms.name")}>
			<ServerPaginationGrid
				query={getAlarms}
				type="alarms"
				coreType="alarms"
				operationDataType="alarms"
				selectable={false}
				pageSize={20}
				sortAttribute="created"
				sortDirection="ASC"
				sortModel={[{ field: "created", sort: "asc" }]}
				columns={alarmColumns}
				columnVisibilityModel={{
					expires: false,
				}}
				getDetailPanelContent={({ row }: any) => (
					<MasterDetail row={row} type="alarms" />
				)}
			></ServerPaginationGrid>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
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

export default Alarms;
