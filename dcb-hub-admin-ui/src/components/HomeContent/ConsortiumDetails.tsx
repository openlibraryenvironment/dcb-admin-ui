import { useTranslation } from "next-i18next"; //localisation
import Link from "@components/Link/Link";
import { ONBOARDING_LINKS } from "homeData/homeConfig";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { ClientDataGrid } from "@components/ClientDataGrid";

export default function ConsortiumDetails() {
	const { t } = useTranslation();
	const { displayName } = useConsortiumInfoStore();

	//values in t() to be replaced by dynamic values
	const ConsortiumDetails = [
		[
			<Link
				href={ONBOARDING_LINKS.INTRODUCE_LIBRARIES}
				key="linkToHelpOnboardingIntroduce"
			>
				{t("onboarding.stage.introduce_libraries.name")}
			</Link>,
			t("onboarding.stage.introduce_libraries.action"),
			<>
				{t("onboarding.stage.introduce_libraries.status_known", {
					count: 81,
					consortium_name: displayName,
				})}
				<br />
				<br />
				{t("onboarding.stage.introduce_libraries.status_missing", {
					count: 73,
				})}
			</>,
		],

		[
			<Link
				href={ONBOARDING_LINKS.PROVISION_SYSTEMS}
				key="linkToHelpOnboardingProvision"
			>
				{t("onboarding.stage.provision_systems.name")}
			</Link>,
			t("onboarding.stage.provision_systems.action"),
			<>
				{t("onboarding.stage.provision_systems.status_known", {
					count: 51,
					consortium_name: displayName,
				})}
				<br />
				<br />
				{t("onboarding.stage.provision_systems.status_missing", { count: 41 })}
			</>,
		],

		[
			<Link
				href={ONBOARDING_LINKS.CONFIGURE_SERVICES}
				key="linkToHelpOnboardingConfigure"
			>
				{t("onboarding.stage.configure_services.name")}
			</Link>,
			t("onboarding.stage.configure_services.action"),
			<>
				{t("onboarding.stage.configure_services.status_config", { count: 73 })}
				<br />
				<br />
				{t("onboarding.stage.configure_services.status_testing", { count: 64 })}
			</>,
		],

		[
			<Link
				href={ONBOARDING_LINKS.MIGRATE_SERVICE}
				key="linkToHelpOnboardingMigrate"
			>
				{t("onboarding.stage.migrate_service.name")}
			</Link>,
			t("onboarding.stage.migrate_service.action"),
			<>
				{t("onboarding.stage.migrate_service.status_migration", { count: 81 })}
				<br />
				<br />
				{t("onboarding.stage.migrate_service.status_signoff", { count: 81 })}
			</>,
		],

		[
			<Link
				href={ONBOARDING_LINKS.OPERATE_DCB}
				key="linkToHelpOnboardingOperate"
			>
				{t("onboarding.stage.operate_dcb.name")}
			</Link>,
			t("onboarding.stage.operate_dcb.action"),
			t("onboarding.stage.operate_dcb.status_operators", { count: 0 }),
		],

		[
			<Link
				href={ONBOARDING_LINKS.MANAGE_SUPPORT}
				key="linkToHelpOnboardingSupport"
			>
				{t("onboarding.stage.manage_support.name")}
			</Link>,
			t("onboarding.stage.manage_support.action"),
			t("onboarding.stage.manage_support.status_support", { count: 0 }),
		],
	];

	return (
		<ClientDataGrid
			selectable={false}
			toolbarVisible="not-visible"
			disableAggregation
			disableRowGrouping
			coreType="consortiumDetails"
			operationDataType="consortiumDetails"
			type="consortiumDetails"
			columns={[
				{
					field: "stage",
					headerName: t("onboarding.summary.stage"),
					filterable: false,
					sortable: false,
					editable: false,
				},
				{
					field: "action",
					headerName: t("onboarding.summary.action"),
					filterable: false,
					sortable: false,
					editable: false,
				},
				{
					field: "status",
					headerName: t("onboarding.summary.status"),
					filterable: false,
					sortable: false,
					editable: false,
				},
			]}
			data={ConsortiumDetails}
		/>
	);
}
