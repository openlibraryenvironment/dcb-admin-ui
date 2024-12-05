import { useQuery } from "@apollo/client";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { AdminLayout } from "@layout";
import { FunctionalSetting } from "@models/FunctionalSetting";
import { Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";
import {
	getConsortiaFunctionalSettings,
	updateFunctionalSettingQuery,
} from "src/queries/queries";

const FunctionalSettings: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(1);
	const router = useRouter();
	const { data } = useQuery(getConsortiaFunctionalSettings, {
		variables: {
			order: "id",
			orderBy: "DESC",
			pageno: 0,
			pagesize: 10,
		},
	});
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
				<Grid xs={4} sm={8} md={12}>
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
				<Grid xs={4} sm={8} md={12}>
					<Typography variant="attributeText">
						{t("consortium.settings.introduction")}
					</Typography>
				</Grid>
				<Grid xs={4} sm={8} md={12}>
					<ClientDataGrid
						columns={[
							{
								field: "name",
								headerName: t("consortium.settings.name"),
								minWidth: 75,
								editable: false,
								flex: 0.4,
							},
							{
								field: "description",
								headerName: t("consortium.settings.description"),
								minWidth: 100,
								editable: true,
								flex: 0.6,
								type: "string",
							},
							{
								field: "enabled",
								headerName: t("consortium.settings.enabled_header"),
								minWidth: 75,
								editable: true,
								flex: 0.6,
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
						selectable={false}
						sortModel={[{ field: "name", sort: "asc" }]}
						noDataTitle={t("consortium.settings.not_available")}
						disableHoverInteractions={true}
						editQuery={updateFunctionalSettingQuery}
						operationDataType="FunctionalSetting"
					/>
				</Grid>
			</Grid>
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
