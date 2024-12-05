import getConfig from "next/config";
import Link from "@components/Link/Link";
import EnvironmentHealth from "./EnvironmentHealth";
import SimpleTable from "@components/SimpleTable/SimpleTable";
import { Trans, useTranslation } from "next-i18next"; //localisation
import axios from "axios";
import {
	DCB_SERVICE_STATUS_LINKS,
	LOCAL_VERSION_LINKS,
	RELEASE_PAGE_LINKS,
} from "../../../homeData/homeConfig";
import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import VersionInfo from "./VersionInfo";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Environment } from "@models/Environment";

export default function EnvironmentDetails() {
	const [environmentDescription, setEnvironmentDescription] = useState<
		any | null
	>(null);

	const { publicRuntimeConfig } = getConfig();
	const { t } = useTranslation();

	useEffect(() => {
		const getEnvDescription = async () => {
			try {
				const responseDCBDescription = await axios.get(
					LOCAL_VERSION_LINKS.SERVICE_INFO,
				);
				setEnvironmentDescription(responseDCBDescription.data);
			} catch (error) {
				console.error("Error fetching environment description", error);
			}
		};
		getEnvDescription();
	}, []);

	const returnDCBEnvDescription = () =>
		environmentDescription
			? JSON.stringify(environmentDescription.env.description).replace(/"/g, "")
			: t("common.loading");

	const YourDCBEnvironment = [
		[
			"DCB Service",
			returnDCBEnvDescription(),
			<Link href={LOCAL_VERSION_LINKS.SERVICE_INFO} key={"serviceInfo"}>
				{LOCAL_VERSION_LINKS.SERVICE}
			</Link>,
			<Link key={"serviceHealthLink"} href={LOCAL_VERSION_LINKS.SERVICE_HEALTH}>
				{
					<EnvironmentHealth
						key={"serviceHealth"}
						apiLink={LOCAL_VERSION_LINKS.SERVICE_HEALTH}
						environment={Environment.DCB}
					/>
				}
			</Link>,
		],
		[
			"Keycloak",
			t("common.na"),
			<Link href={publicRuntimeConfig.KEYCLOAK_URL} key={"keycloakSite"}>
				{LOCAL_VERSION_LINKS.KEYCLOAK}
			</Link>,
			<Link
				href={LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH}
				key={"keycloakHealthLink"}
			>
				{
					<EnvironmentHealth
						key={"keycloakHealth"}
						apiLink={LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH}
						environment={Environment.Keycloak}
					/>
				}
			</Link>,
		],
	];

	return (
		<Box>
			<Typography variant="h2" sx={{ marginBottom: 1, fontSize: 32 }}>
				{t("environment.your")}
			</Typography>
			<Typography variant="homePageText">
				{t("environment.configured_for")}
			</Typography>
			<SimpleTable
				column_names={[
					t("service.name"),
					t("service.environment"),
					t("service.address"),
					t("service.status"),
				]}
				row_data={YourDCBEnvironment}
			/>
			<Stack direction="column" spacing={1}>
				<Typography variant="homePageText">
					<Trans
						i18nKey="environment.see_metrics_loggers"
						components={{
							loggersLink: <Link href={DCB_SERVICE_STATUS_LINKS.LOGGERS} />,
							metricsLink: <Link href={DCB_SERVICE_STATUS_LINKS.METRICS} />,
						}}
					></Trans>
				</Typography>
				<Typography variant="h2" sx={{ marginBottom: 1, fontSize: 32 }}>
					{t("environment.versions")}
				</Typography>
				<Typography variant="homePageText">
					{t("environment.compare_components")}
				</Typography>
			</Stack>
			<VersionInfo />
			<Typography variant="homePageText">
				<Trans
					i18nKey="environment.releases_link"
					components={{
						linkToReleases: <Link href={RELEASE_PAGE_LINKS.ALL_RELEASES} />,
					}}
				></Trans>
			</Typography>
		</Box>
	);
}
