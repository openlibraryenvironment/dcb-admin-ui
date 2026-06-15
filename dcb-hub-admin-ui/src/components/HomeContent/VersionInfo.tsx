import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
} from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";

import {
	Release,
	ServiceInfo,
	Tag,
	VersionData,
} from "@models/VersionInfoTypes";
import { LOCAL_VERSION_LINKS } from "@/homeData/homeConfig";

const VersionInfo: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [versionData, setVersionData] = useState<VersionData[]>([]);
	const { t } = useTranslation();

	// FIX: Migrated from legacy getConfig() to standard Vite environment variable string mappings
	const appVersion = import.meta.env.VITE_APP_VERSION || "unknown";

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				setVersionData([
					{
						id: 1,
						repository: "dcb-service",
						latestVersion: "Loading...",
						currentVersion: "Loading...",
						status: "loading",
						detailType: "tag",
					},
					{
						id: 2,
						repository: "dcb-admin-ui",
						latestVersion: "Loading...",
						currentVersion: "Loading...",
						status: "loading",
						detailType: "release",
					},
				]);

				const [serviceTags, serviceInfo, adminRelease] = await Promise.all([
					axios.get<Tag[]>(
						"https://api.github.com/repos/openlibraryenvironment/dcb-service/tags",
					),
					axios.get<ServiceInfo>(LOCAL_VERSION_LINKS.SERVICE_INFO),
					axios.get<Release>(
						"https://api.github.com/repos/openlibraryenvironment/dcb-admin-ui/releases/latest",
					),
				]);

				const newVersionData: VersionData[] = [
					{
						id: 1,
						repository: "dcb-service",
						latestVersion: serviceTags.data[0]?.name || "Unknown",
						currentVersion: serviceInfo.data?.git?.closest?.tag?.name
							? serviceInfo.data?.git?.closest?.tag?.name
							: serviceInfo.data?.git?.tags || "Unknown",
						status:
							serviceTags.data[0]?.name === serviceInfo.data?.app?.version
								? "current"
								: "outdated",
						latestData: serviceTags.data[0],
						currentData: serviceInfo?.data,
						detailType: "tag",
					},
					{
						id: 2,
						repository: "dcb-admin-ui",
						latestVersion: adminRelease.data?.tag_name || "Unknown",
						currentVersion: appVersion,
						status:
							adminRelease.data?.tag_name === appVersion
								? "current"
								: "outdated",
						latestData: adminRelease.data,
						currentData: appVersion,
						detailType: "release",
					},
				];

				if (
					!serviceTags.data ||
					serviceTags.data.length === 0 ||
					!serviceInfo.data?.git?.closest
				) {
					if (serviceInfo.data?.git?.branch === "main") {
						newVersionData[0].currentVersion = serviceTags.data[0]?.name
							? `${serviceTags.data[0].name}-Dev`
							: `${adminRelease.data?.tag_name || "Unknown"}-Dev`;
					}
				}
				setVersionData(newVersionData);
			} catch (err) {
				console.error("Error fetching version information:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [appVersion]);

	const columns: GridColDef[] = [
		{
			...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
			headerName: t("ui.data_grid.master_detail"),
			renderCell: (params) => (
				<DetailPanelToggle id={params.id} value={params.value} />
			),
			renderHeader: () => <DetailPanelHeader />,
		},
		{ field: "repository", headerName: "Repository", flex: 1, sortable: false },
		{
			field: "latestVersion",
			headerName: "Latest Version",
			flex: 1,
			sortable: false,
		},
		{
			field: "currentVersion",
			headerName: "Current Version",
			flex: 1,
			sortable: false,
		},
	];

	return (
		<DataGrid
			identifier="versionInfoGrid"
			type="versionInfo"
			columns={columns}
			rows={versionData}
			loading={loading}
			checkboxSelection={false}
			disableAggregation
			disableRowGrouping
			disablePivoting
			disableHoverInteractions={false}
			pagination={false}
			paginationMode="client"
			sortingMode="client"
			filterMode="client"
			rowModesModel={{}}
			listViewEnabled={false}
			pivotingEnabled={false}
			toolbarVisible={false}
			scrollbarVisible={true}
			noResultsText={t("ui.data_grid.no_rows")}
			searchText=""
			paginationModel={{ page: 0, pageSize: 20 }}
			getDetailPanelContent={({ row }: any) => (
				<MasterDetail row={row} type="versionInfo" />
			)}
		/>
	);
};

export default VersionInfo;
