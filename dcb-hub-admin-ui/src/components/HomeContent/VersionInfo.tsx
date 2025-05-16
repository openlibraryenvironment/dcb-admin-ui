import getConfig from "next/config";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import SimpleTable from "@components/SimpleTable/SimpleTable";
import Link from "@components/Link/Link";
import { useTranslation } from "next-i18next"; //localisation
import {
	REPO_LINKS,
	RELEASE_PAGE_LINKS,
	API_LINKS,
	LOCAL_VERSION_LINKS,
} from "../../../homeData/homeConfig";
import { InfoEndpointResponse } from "@models/GitResponseTypes";
import { isEmpty } from "lodash";

export default function VersionInfo() {
	const { publicRuntimeConfig } = getConfig();
	const { t } = useTranslation();
	const [serviceData, setServiceData] = useState<InfoEndpointResponse | null>(
		null,
	);

	const [githubServiceData, setGithubServiceData] = useState<any>(null);
	const [adminUiData, setAdminUiData] = useState<InfoEndpointResponse | null>(
		null,
	);

	const apiEndpoints = useMemo(
		() => [
			{ link: LOCAL_VERSION_LINKS.SERVICE_INFO, setter: setServiceData },
			{ link: API_LINKS.SERVICE, setter: setGithubServiceData },
			{ link: API_LINKS.ADMIN_UI, setter: setAdminUiData },
		],
		[],
	);

	useEffect(() => {
		const getServerInformation = async () => {
			try {
				// Perform multiple API calls at the same time using Promise.allSettled
				// Disabled because removing the unused var will necessitate re-working the page.
				// Which should be done separately.
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const responses = await Promise.allSettled(
					apiEndpoints.map(async ({ link, setter }) => {
						try {
							// Make API call and set the state with response data
							const response = await axios.get<InfoEndpointResponse>(link);
							setter(response.data);
							return { status: "fulfilled" }; // Return status for the response
						} catch (error) {
							// Log error if fetching data from an endpoint fails
							console.error(`Error fetching data from ${link}`, error);
							return { status: "rejected", reason: error };
						}
					}),
				);
			} catch (error) {
				// Catch any unhandled exceptions during the API calls
				console.error("Error fetching version information", error);
			}
		};

		getServerInformation();
	}, [apiEndpoints]);

	const renderVersionData = (data: any) => {
		if (typeof data === "string" && data.trim() !== "") {
			return data;
		}
		return "NA";
	};

	const VersionData = [
		[
			<Link key="dcb-service" href={REPO_LINKS.SERVICE}>
				{t("app.component.service")}
			</Link>,
			<Link key="dcb-service-version" href={RELEASE_PAGE_LINKS.SERVICE}>
				{githubServiceData
					? renderVersionData(githubServiceData?.[0]?.name)
					: t("environment.loading_release_info")}
			</Link>,
			serviceData
				? renderVersionData(
						isEmpty(serviceData?.git?.tags)
							? githubServiceData?.[0]?.name + " (Dev)"
							: githubServiceData?.[0]?.name,
					)
				: t("environment.loading_version_info"),
		],
		[
			<Link key="dcb-admin-ui" href={REPO_LINKS.ADMIN_UI}>
				{t("app.component.admin")}
			</Link>,
			<Link key="dcb-admin-ui-version" href={RELEASE_PAGE_LINKS.ADMIN_UI}>
				{adminUiData
					? renderVersionData(adminUiData?.tag_name)
					: t("environment.loading_release_info")}
			</Link>,
			publicRuntimeConfig?.version,
		],
	];

	return (
		<SimpleTable
			column_names={[
				t("environment.component"),
				t("environment.latest_version"),
				t("environment.your_version"),
			]}
			row_data={VersionData}
		/>
	);
}
