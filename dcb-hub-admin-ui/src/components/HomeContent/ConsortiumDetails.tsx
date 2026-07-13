import { useTranslation } from "react-i18next";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Typography } from "@mui/material";

import Link from "@components/Link/Link";
import DataGrid from "@components/DataGrid/DataGrid";
import { ONBOARDING_LINKS } from "@/homeData/homeConfig";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";

interface ConsortiumStageRow {
	id: number;
	stageName: string;
	stageHref: string;
	action: string;
	statusKnownCount?: number;
	statusMissingCount?: number;
	statusConfigCount?: number;
	statusTestingCount?: number;
	statusMigrationCount?: number;
	statusSignoffCount?: number;
	statusOperatorsCount?: number;
	statusSupportCount?: number;
	translationTemplate:
		"introduce" | "provision" | "configure" | "migrate" | "operate" | "support";
}

export default function ConsortiumDetails() {
	const { t } = useTranslation();
	const { displayName } = useConsortiumInfoStore();

	// FIX: Replaced raw JSX multi-dimensional layouts with typed objects for consistent state mapping
	const rows: ConsortiumStageRow[] = [
		{
			id: 1,
			stageName: t("onboarding.stage.introduce_libraries.name"),
			stageHref: ONBOARDING_LINKS.INTRODUCE_LIBRARIES,
			action: t("onboarding.stage.introduce_libraries.action"),
			statusKnownCount: 81,
			statusMissingCount: 73,
			translationTemplate: "introduce",
		},
		{
			id: 2,
			stageName: t("onboarding.stage.provision_systems.name"),
			stageHref: ONBOARDING_LINKS.PROVISION_SYSTEMS,
			action: t("onboarding.stage.provision_systems.action"),
			statusKnownCount: 51,
			statusMissingCount: 41,
			translationTemplate: "provision",
		},
		{
			id: 3,
			stageName: t("onboarding.stage.configure_services.name"),
			stageHref: ONBOARDING_LINKS.CONFIGURE_SERVICES,
			action: t("onboarding.stage.configure_services.action"),
			statusConfigCount: 73,
			statusTestingCount: 64,
			translationTemplate: "configure",
		},
		{
			id: 4,
			stageName: t("onboarding.stage.migrate_service.name"),
			stageHref: ONBOARDING_LINKS.MIGRATE_SERVICE,
			action: t("onboarding.stage.migrate_service.action"),
			statusMigrationCount: 81,
			statusSignoffCount: 81,
			translationTemplate: "migrate",
		},
		{
			id: 5,
			stageName: t("onboarding.stage.operate_dcb.name"),
			stageHref: ONBOARDING_LINKS.OPERATE_DCB,
			action: t("onboarding.stage.operate_dcb.action"),
			statusOperatorsCount: 0,
			translationTemplate: "operate",
		},
		{
			id: 6,
			stageName: t("onboarding.stage.manage_support.name"),
			stageHref: ONBOARDING_LINKS.MANAGE_SUPPORT,
			action: t("onboarding.stage.manage_support.action"),
			statusSupportCount: 0,
			translationTemplate: "support",
		},
	];

	const columns: GridColDef<ConsortiumStageRow>[] = [
		{
			field: "stageName",
			headerName: t("onboarding.summary.stage"),
			flex: 1,
			filterable: false,
			sortable: false,
			renderCell: (params) => (
				<Link href={params.row.stageHref}>{params.row.stageName}</Link>
			),
		},
		{
			field: "action",
			headerName: t("onboarding.summary.action"),
			flex: 1.2,
			filterable: false,
			sortable: false,
		},
		{
			field: "translationTemplate",
			headerName: t("onboarding.summary.status"),
			flex: 1.5,
			filterable: false,
			sortable: false,
			renderCell: (params) => {
				const { row } = params;
				switch (row.translationTemplate) {
					case "introduce":
						return (
							<Typography variant="body2" sx={{ whiteSpace: "normal" }}>
								{t("onboarding.stage.introduce_libraries.status_known", {
									count: row.statusKnownCount,
									consortium_name: displayName,
								})}
								<br />
								{t("onboarding.stage.introduce_libraries.status_missing", {
									count: row.statusMissingCount,
								})}
							</Typography>
						);
					case "provision":
						return (
							<Typography variant="body2" sx={{ whiteSpace: "normal" }}>
								{t("onboarding.stage.provision_systems.status_known", {
									count: row.statusKnownCount,
									consortium_name: displayName,
								})}
								<br />
								{t("onboarding.stage.provision_systems.status_missing", {
									count: row.statusMissingCount,
								})}
							</Typography>
						);
					case "configure":
						return (
							<Typography variant="body2" sx={{ whiteSpace: "normal" }}>
								{t("onboarding.stage.configure_services.status_config", {
									count: row.statusConfigCount,
								})}
								<br />
								{t("onboarding.stage.configure_services.status_testing", {
									count: row.statusTestingCount,
								})}
							</Typography>
						);
					case "migrate":
						return (
							<Typography variant="body2" sx={{ whiteSpace: "normal" }}>
								{t("onboarding.stage.migrate_service.status_migration", {
									count: row.statusMigrationCount,
								})}
								<br />
								{t("onboarding.stage.migrate_service.status_signoff", {
									count: row.statusSignoffCount,
								})}
							</Typography>
						);
					case "operate":
						return (
							<Typography variant="body2">
								{t("onboarding.stage.operate_dcb.status_operators", {
									count: row.statusOperatorsCount,
								})}
							</Typography>
						);
					case "support":
						return (
							<Typography variant="body2">
								{t("onboarding.stage.manage_support.status_support", {
									count: row.statusSupportCount,
								})}
							</Typography>
						);
					default:
						return null;
				}
			},
		},
	];

	return (
		<DataGrid
			identifier="consortiumDetailsGrid"
			type="consortiumDetails"
			columns={columns}
			rows={rows}
			loading={false}
			checkboxSelection={false}
			disableAggregation
			disableRowGrouping
			disablePivoting
			disableHoverInteractions={true}
			pagination={false}
			paginationMode="client"
			paginationModel={{ page: 0, pageSize: 25 }}
			sortingMode="client"
			filterMode="client"
			rowModesModel={{}}
			listViewEnabled={false}
			pivotingEnabled={false}
			toolbarVisible={false}
			scrollbarVisible={true}
			noResultsText=""
			searchText=""
		/>
	);
}
