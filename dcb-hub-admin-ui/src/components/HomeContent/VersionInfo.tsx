import React, { useEffect, useState } from "react";
import axios from "axios";
import getConfig from "next/config";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
} from "@mui/x-data-grid-premium";
import { LOCAL_VERSION_LINKS } from "homeData/homeConfig";
import { ClientDataGrid } from "@components/ClientDataGrid";
import {
	Release,
	ServiceInfo,
	Tag,
	VersionData,
} from "@models/VersionInfoTypes";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";
import { useTranslation } from "next-i18next";

const VersionInfo: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [versionData, setVersionData] = useState<VersionData[]>([]);
	const { t } = useTranslation();

	const { publicRuntimeConfig } = getConfig() || {
		publicRuntimeConfig: { version: "unknown" },
	};

	// Fetch data from all sources
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				// Initialize data array with loading state
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

				// Fetch all the required data in parallel
				const [serviceTags, serviceInfo, adminRelease] = await Promise.all([
					axios.get<Tag[]>(
						"https://api.github.com/repos/openlibraryenvironment/dcb-service/tags",
					),
					axios.get<ServiceInfo>(LOCAL_VERSION_LINKS.SERVICE_INFO),
					axios.get<Release>(
						"https://api.github.com/repos/openlibraryenvironment/dcb-admin-ui/releases/latest",
					),
				]);

				// Update with actual data
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
						currentVersion: publicRuntimeConfig?.version || "Unknown",
						status:
							adminRelease.data?.tag_name === publicRuntimeConfig?.version
								? "current"
								: "outdated",
						latestData: adminRelease.data,
						currentData: publicRuntimeConfig?.version,
						detailType: "release",
					},
				];
				if (
					!serviceTags.data ||
					serviceTags.data.length === 0 ||
					serviceInfo.data?.git?.closest === "" ||
					!serviceInfo.data?.git?.closest
				) {
					// Check branch information
					if (serviceInfo.data?.git?.branch === "main") {
						// Default to latest version with "-Dev" suffix
						newVersionData[0].currentVersion = serviceTags.data[0]?.name
							? `${serviceTags.data[0].name}-Dev`
							: `${adminRelease.data?.tag_name || "Unknown"}-Dev`;
					}
				}
				setVersionData(newVersionData);
				setLoading(false);
			} catch (err) {
				console.error("Error fetching version information:", err);

				setLoading(false);
			}
		};

		fetchData();
	}, [publicRuntimeConfig?.version]);

	// Column definitions for the data grid
	const columns: GridColDef[] = [
		{
			...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
			headerName: t("ui.data_grid.master_detail"),
			renderCell: (params) => (
				<DetailPanelToggle id={params.id} value={params.value} />
			),
			renderHeader: () => <DetailPanelHeader />,
		},
		{
			field: "repository",
			headerName: "Repository",
			flex: 1,
			sortable: false,
		},
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
		<ClientDataGrid
			data={versionData ?? []}
			columns={columns}
			loading={loading}
			selectable={false}
			type="versionInfo"
			coreType="versionInfo"
			operationDataType="versionInfo"
			disableAggregation
			disableRowGrouping
			getDetailPanelContent={({ row }: any) => (
				<MasterDetail row={row} type="versionInfo" />
			)}
			toolbarVisible="not-visible"
		/>
	);
};

export default VersionInfo;
