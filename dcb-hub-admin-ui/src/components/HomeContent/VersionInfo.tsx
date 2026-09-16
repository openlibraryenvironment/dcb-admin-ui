import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
} from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";

import { ServiceInfoGit, VersionRow } from "@models/VersionInfoTypes";
import {
	releaseStatus,
	serviceVersionFrom,
} from "@constants/serviceCapabilities";
import {
	LatestRelease,
	latestReleaseQuery,
} from "@/queryOptions/latestRelease";
import { RELEASE_PAGE_LINKS } from "@/homeData/homeConfig";

type VersionInfoProps = {
	/** dcb-service's `/info` payload, or null when it could not be fetched. */
	serviceInfo: unknown;
};

type RunningRow = Omit<
	VersionRow,
	"latestVersion" | "releaseStatus" | "latestReleaseDate" | "latestReleaseUrl"
>;

type LatestReleaseState = { data?: LatestRelease; isPending: boolean };

const serviceRow = (serviceInfo: unknown, unknownLabel: string): RunningRow => {
	const git = (serviceInfo as { git?: ServiceInfoGit } | null)?.git;
	const commitsSinceTag = Number.parseInt(
		git?.closest?.tag?.commit?.count ?? "",
		10,
	);

	return {
		id: "dcb-service",
		version: serviceVersionFrom(serviceInfo) ?? unknownLabel,
		releasesUrl: RELEASE_PAGE_LINKS.SERVICE,
		commitId: git?.commit?.id,
		commitTime: git?.commit?.time,
		closestTag: git?.closest?.tag?.name || undefined,
		commitsSinceTag: Number.isNaN(commitsSinceTag)
			? undefined
			: commitsSinceTag,
	};
};

export default function VersionInfo({ serviceInfo }: VersionInfoProps) {
	const { t } = useTranslation();

	const adminLatest = useQuery(latestReleaseQuery("dcb-admin-ui"));
	const serviceLatest = useQuery(latestReleaseQuery("dcb-service"));

	const rows = useMemo<VersionRow[]>(() => {
		const withLatest = (
			row: RunningRow,
			running: string | null,
			latest: LatestReleaseState,
		): VersionRow => {
			if (!latest.data) {
				const label = latest.isPending
					? t("environment.checking")
					: t("environment.cannot_check");
				return {
					...row,
					latestVersion: label,
					releaseStatus: latest.isPending
						? label
						: t("environment.release_status.unknown"),
				};
			}

			return {
				...row,
				latestVersion: latest.data.tag,
				releaseStatus: t(
					`environment.release_status.${releaseStatus(running, latest.data.tag)}`,
				),
				latestReleaseDate: latest.data.publishedAt,
				latestReleaseUrl: `${row.releasesUrl}/tag/${encodeURIComponent(latest.data.tag)}`,
			};
		};

		return [
			withLatest(
				{
					id: "dcb-admin-ui",
					version: __APP_VERSION__,
					releasesUrl: RELEASE_PAGE_LINKS.ADMIN_UI,
					releaseDate: __APP_RELEASE_DATE__ || undefined,
				},
				__APP_VERSION__,
				{ data: adminLatest.data, isPending: adminLatest.isPending },
			),
			withLatest(
				serviceRow(serviceInfo, t("common.unknown")),
				serviceVersionFrom(serviceInfo),
				{ data: serviceLatest.data, isPending: serviceLatest.isPending },
			),
		];
	}, [
		serviceInfo,
		t,
		adminLatest.data,
		adminLatest.isPending,
		serviceLatest.data,
		serviceLatest.isPending,
	]);

	const columns: GridColDef[] = useMemo(
		() => [
			{
				...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
				headerName: t("ui.data_grid.master_detail"),
				renderCell: (params) => <DetailPanelToggle id={params.id} />,
				renderHeader: () => <DetailPanelHeader />,
			},
			{
				field: "id",
				headerName: t("environment.component"),
				flex: 1,
				sortable: false,
			},
			{
				field: "version",
				headerName: t("environment.your_version"),
				flex: 1,
				sortable: false,
			},
			{
				field: "latestVersion",
				headerName: t("environment.latest_version"),
				flex: 1,
				sortable: false,
			},
			{
				field: "releaseStatus",
				headerName: t("service.status"),
				flex: 1,
				sortable: false,
			},
		],
		[t],
	);

	return (
		<DataGrid
			identifier="versionInfoGrid"
			type="versionInfo"
			columns={columns}
			rows={rows}
			loading={false}
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
			noResultsText={t("ui.data_grid.no_results")}
			searchText=""
			paginationModel={{ page: 0, pageSize: 20 }}
			getDetailPanelContent={({ row }: { row: VersionRow }) => (
				<MasterDetail row={row} type="versionInfo" />
			)}
		/>
	);
}
