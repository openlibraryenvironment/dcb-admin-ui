import { createFileRoute } from "@tanstack/react-router";
import Loading from "@components/Loading/Loading";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { AdminLayout } from "@layout";
import dayjs from "dayjs";

import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";

import { equalsOnly } from "@queries/createFileRoute } from "@tanstack/react-router";
import Loading from "@components/Loading/Loading";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { AdminLayout } from "@layout";
import dayjs from "dayjs";

import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";

import { equalsOnly";
import { standardFilters } from "@helpers/dataGrid/filters";
import { getAlarms } from "@queries/standardFilters } from "@helpers/dataGrid/filters";
import { getAlarms";

const Alarms: NextPage = () => {
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");
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




