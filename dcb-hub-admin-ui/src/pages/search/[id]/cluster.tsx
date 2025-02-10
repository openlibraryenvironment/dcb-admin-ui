import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import { getClusters, getClustersLegacy } from "src/queries/queries";
import { Tooltip, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Cancel } from "@mui/icons-material";
import {
	DataGridPremium,
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
	GridRenderCellParams,
} from "@mui/x-data-grid-premium";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Error from "@components/Error/Error";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";
import { useEffect, useState } from "react";
import getConfig from "next/config";
import axios from "axios";

const Clusters: NextPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const theme = useTheme();
	const { publicRuntimeConfig } = getConfig();
	const [serviceVersion, setServiceVersion] = useState<string | null>(null);
	const [isDev, setIsDev] = useState<boolean>(false);

	// This page uses separate queries depending on whether the dcb-service version equals or exceeds 7.3.0
	// This determines whether the matchpoints aspect of this page is rendered.
	useEffect(() => {
		const fetchDcbVersion = async () => {
			try {
				// Get the DCB version
				const response = await axios.get(
					`${publicRuntimeConfig?.DCB_API_BASE}/info`,
				);
				const version = response.data.git?.tags || null;
				const systemType = response.data.env.code || "";
				const branch = response.data.git?.branch || "";
				// Tells us the version, the system type (DEV/PROD/etc) and the branch name
				console.log(
					"dcb-service version: " +
						version +
						" on system of type: " +
						systemType +
						" deployed from branch: " +
						branch,
				);
				// branch name is used to spot DEV systems that don't tell us they're DEV
				// as all other systems are deployed from a release (so HEAD not main)
				if (systemType.includes("DEV") || branch.toLowerCase() == "main") {
					// DEV systems will always be >7.3.0 so they're safe.
					setIsDev(true);
				}
				setServiceVersion(version);
			} catch (error) {
				console.error("Error fetching DCB Service version:", error);
				setServiceVersion(null);
			}
		};

		fetchDcbVersion();
	}, [publicRuntimeConfig.DCB_API_BASE]);

	const determineAcceptableVersion = (version: string | null) => {
		if (version) {
			const numericVersion = version.substring(1); // takes the v out of version so we can get major, minor
			const [major, minor] = numericVersion.split(".").map(Number);
			console.log(
				"Major: " + major + ", minor: " + minor + ", dev system?",
				isDev,
			);
			return major > 7 || (major == 7 && minor >= 3) || isDev;
		} else {
			// If dev, this is acceptable (as dev won't have a standard version, but will always be ahead of release.)
			return isDev;
		}
	};
	const useVersionAppropriateQuery = determineAcceptableVersion(serviceVersion)
		? getClusters
		: getClustersLegacy;

	const { loading, error, data } = useQuery(useVersionAppropriateQuery, {
		variables: { query: `id: ${id}` },
	});

	const theCluster = data?.instanceClusters?.content?.[0] ?? null;
	const extractMatchpoints = (clusterRecord: { members: any[] }): string[] => {
		if (!determineAcceptableVersion(serviceVersion)) return [];

		const matchPointSet = new Set<string>();
		clusterRecord.members.forEach((member) => {
			member.matchPoints.forEach((matchPoint: any) => {
				matchPointSet.add(matchPoint.value);
			});
		});
		return Array.from(matchPointSet);
	};

	const matchpoints = theCluster ? extractMatchpoints(theCluster) : [];

	const hasMatchpoint = (mp: string, instance: any) => {
		if (!determineAcceptableVersion(serviceVersion)) return null;
		const present = instance.matchPoints.some((obj: any) => obj.value === mp);
		return present ? (
			<Tooltip
				sx={{ justifyContent: "center" }}
				title={
					"Matchpoint " + mp + " is present for the title " + instance?.title
				}
				aria-labelledby={
					"Matchpoint " + mp + " is present for the title " + instance?.title
				}
			>
				<CheckCircleIcon
					sx={{ mt: 1.75 }}
					htmlColor={theme.palette.success.main}
				/>
			</Tooltip>
		) : (
			<Tooltip
				title={
					"Matchpoint " +
					mp +
					" is not present for the title " +
					instance?.title
				}
				aria-labelledby={
					"Matchpoint " +
					mp +
					" is not present for the title " +
					instance?.title
				}
			>
				<Cancel sx={{ mt: 1.75 }} htmlColor={theme.palette.error.main} />
			</Tooltip>
		);
	};

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
			field: "title",
			headerName: t("ui.data_grid.title"),
			minWidth: 300,
			flex: 0.5,
		},
		...matchpoints.map((mp) => ({
			field: mp,
			headerName: mp,
			minWidth: 100,
			flex: 0.5,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams) =>
				hasMatchpoint(mp, params.row),
			valueGetter: (value: any, row: { matchPoints: any[] }) =>
				row.matchPoints.some((obj: any) => obj.value === mp) ? "Yes" : "No",
		})),
	];

	const legacyColumns: GridColDef[] = [
		{
			...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
			headerName: t("ui.data_grid.master_detail"),
			renderCell: (params) => (
				<DetailPanelToggle id={params.id} value={params.value} />
			),
			renderHeader: () => <DetailPanelHeader />,
		},
		{
			field: "title",
			headerName: t("ui.data_grid.title"),
			minWidth: 300,
			flex: 0.5,
		},
	];

	const rows = theCluster?.members ?? [];

	return error ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/search"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/search"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout
			title={t("search.cluster_title", { record: theCluster?.title })}
		>
			<DataGridPremium
				loading={loading}
				rows={rows ?? []}
				columns={
					determineAcceptableVersion(serviceVersion) ? columns : legacyColumns
				}
				getDetailPanelContent={({ row }: any) => (
					<MasterDetail row={row} type="cluster" />
				)}
				getDetailPanelHeight={() => "auto"}
				autoHeight
				sx={{
					"& .MuiDataGrid-detailPanel": {
						overflow: "hidden", // Prevent scrollbars in the detail panel
						height: "auto", // Adjust height automatically
					},
					border: "0",
				}}
				slots={{
					detailPanelExpandIcon: MdExpandMore,
					detailPanelCollapseIcon: MdExpandLess,
				}}
				disableAggregation={true}
				disableRowGrouping={true}
			/>
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

export default Clusters;
