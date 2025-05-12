import { useQuery } from "@apollo/client";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { AdminLayout } from "@layout";
import { FunctionalSetting } from "@models/FunctionalSetting";
import { Button, Grid, Tab, Tabs, Typography } from "@mui/material";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
import {
	getConsortiaFunctionalSettings,
	updateFunctionalSettingQuery,
} from "src/queries/queries";
import NewFunctionalSetting from "../../forms/NewFunctionalSetting/NewFunctionalSetting";

const FunctionalSettings: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(1);
	const [showNewFunctionalSetting, setShowNewFunctionalSetting] =
		useState(false);
	const openNewFunctionalSetting = () => {
		setShowNewFunctionalSetting(true);
	};
	const closeNewFunctionalSetting = () => {
		setShowNewFunctionalSetting(false);
	};
	const router = useRouter();
	const { data } = useQuery(getConsortiaFunctionalSettings, {
		variables: {
			order: "id",
			orderBy: "DESC",
			pageno: 0,
			pagesize: 10,
		},
	});
	const { data: session }: { data: any } = useSession();

	const isAnAdmin = session?.profile?.roles?.some(
		(role: string) => role === "ADMIN" || role === "CONSORTIUM_ADMIN",
	);
	const consortiumFunctionalSettings: FunctionalSetting[] =
		data?.consortia?.content[0]?.functionalSettings;
	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
		switch (newValue) {
			case 0:
				router.push("/consortium");
				break;
			case 1:
				router.push("/consortium/functionalSettings");
				break;
			case 2:
				router.push("/consortium/onboarding");
				break;
			case 3:
				router.push("/consortium/contacts");
				break;
		}
	};

	return (
		<AdminLayout title={t("nav.consortium.functionalSettings")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs
						value={tabIndex}
						onChange={handleTabChange}
						aria-label="Consortium Navigation"
					>
						<Tab label={t("nav.consortium.profile")} />
						<Tab label={t("nav.consortium.functionalSettings")} />
						<Tab label={t("nav.consortium.onboarding")} />
						<Tab label={t("nav.consortium.contacts")} />
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="attributeText">
						{t("consortium.settings.introduction")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					{isAnAdmin ? (
						<Button
							data-tid="new-functional-setting-button"
							variant="contained"
							onClick={openNewFunctionalSetting}
						>
							{t("consortium.new_functional_setting.title")}
						</Button>
					) : null}
					<ClientDataGrid
						columns={[
							{
								field: "name",
								headerName: t("consortium.settings.name"),
								minWidth: 75,
								editable: false,
								flex: 0.75,
							},
							{
								field: "description",
								headerName: t("consortium.settings.description"),
								minWidth: 150,
								editable: true,
								flex: 1,
								type: "string",
							},
							{
								field: "enabled",
								headerName: t("consortium.settings.enabled_header"),
								minWidth: 50,
								editable: true,
								flex: 0.4,
								valueFormatter: (value: boolean) => {
									if (value) {
										return t("consortium.settings.enabled");
									} else {
										return t("consortium.settings.disabled");
									}
								},
								type: "singleSelect",
								valueOptions: [
									{ value: true, label: t("ui.action.yes") },
									{ value: false, label: t("ui.action.no") },
								],
							},
						]}
						data={consortiumFunctionalSettings}
						type="consortiumFunctionalSettings"
						coreType="ConsortiumFunctionalSetting"
						selectable={false}
						sortModel={[{ field: "name", sort: "asc" }]}
						noDataTitle={t("consortium.settings.not_available")}
						disableHoverInteractions={true}
						editQuery={updateFunctionalSettingQuery}
						operationDataType="FunctionalSetting"
						disableAggregation={true}
						disableRowGrouping={true}
					/>
				</Grid>
			</Grid>
			{showNewFunctionalSetting ? (
				<NewFunctionalSetting
					show={showNewFunctionalSetting}
					onClose={closeNewFunctionalSetting}
					consortiumName={data?.consortia?.content[0]?.name}
					consortiumDisplayName={data?.consortia?.content[0]?.displayName}
				/>
			) : null}
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

export default FunctionalSettings;
