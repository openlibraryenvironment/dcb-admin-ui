import { AdminLayout } from "@layout";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import { getClusters } from "src/queries/queries";
import { Tooltip, useTheme } from "@mui/material";
import { Cancel, CheckCircle } from "@mui/icons-material";
import {
	GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
	GridColDef,
	GridRenderCellParams,
} from "@mui/x-data-grid-premium";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Error from "@components/Error/Error";
import { DetailPanelToggle } from "@components/MasterDetail/components/DetailPanelToggle/DetailPanelToggle";
import DetailPanelHeader from "@components/MasterDetail/components/DetailPanelHeader/DetailPanelHeader";
import { useState } from "react";
import { useSession } from "next-auth/react";
import StaffRequest from "../../../forms/StaffRequest/StaffRequest";
import ExpeditedCheckout from "src/forms/ExpeditedCheckout/ExpeditedCheckout";
import { ClientDataGrid } from "@components/ClientDataGrid";

const Clusters: NextPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = router.query;
	const theme = useTheme();
	const [showStaffRequest, setShowStaffRequest] = useState(false);
	const [showExpeditedCheckout, setShowExpeditedCheckout] = useState(false);

	const { loading, error, data } = useQuery(getClusters, {
		variables: { query: `id: ${id}` },
		skip: !id,
	});

	const theCluster = data?.instanceClusters?.content?.[0] ?? null;
	const extractMatchpoints = (clusterRecord: { members: any[] }): string[] => {
		const matchPointSet = new Set<string>();
		clusterRecord.members.forEach((member) => {
			member.matchPoints.forEach((matchPoint: any) => {
				matchPointSet.add(matchPoint.value);
			});
		});
		return Array.from(matchPointSet);
	};
	const { data: session }: { data: any } = useSession();

	const isAnAdmin = session?.profile?.roles?.some(
		(role: string) => role === "ADMIN" || role === "CONSORTIUM_ADMIN",
	);

	const matchpoints = theCluster ? extractMatchpoints(theCluster) : [];
	const pageActions = [
		{
			key: "staffRequest",
			onClick: () => setShowStaffRequest(true),
			disabled: !isAnAdmin,
			label: t("staff_request.actions.place"),
		},
		{
			key: "expeditedCheckout",
			onClick: () => setShowExpeditedCheckout(true),
			disabled: !isAnAdmin,
			label: t("expedited_checkout.steps.checkout"),
		},
	];

	const hasMatchpoint = (mp: string, instance: any) => {
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
				<CheckCircle sx={{ mt: 1.75 }} htmlColor={theme.palette.success.main} />
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
			pageActions={pageActions}
		>
			<div>
				{showStaffRequest ? (
					<StaffRequest
						show={showStaffRequest}
						onClose={() => setShowStaffRequest(false)}
						bibClusterId={id as string} // fix this, typing is weird
					/>
				) : null}
			</div>
			<div>
				{showExpeditedCheckout ? (
					<ExpeditedCheckout
						show={showExpeditedCheckout}
						onClose={() => setShowExpeditedCheckout(false)}
						bibClusterId={id as string}
					/>
				) : null}
			</div>
			<ClientDataGrid
				loading={loading}
				data={rows ?? []}
				columns={columns}
				getDetailPanelContent={({ row }: any) => (
					<MasterDetail row={row} type="cluster" />
				)}
				disableAggregation={true}
				disableRowGrouping={true}
				type="Cluster"
				coreType="Cluster"
				operationDataType="Cluster"
				selectable={false}
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
