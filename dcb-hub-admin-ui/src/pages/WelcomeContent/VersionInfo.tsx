import getConfig from "next/config";
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import SimpleTable from "@components/SimpleTable/SimpleTable";
import Link from '@components/Link/Link';
import { useTranslation } from 'next-i18next'; //localisation
import {
	REPO_LINKS,
	RELEASE_PAGE_LINKS,
	API_LINKS,
	LOCAL_VERSION_LINKS,
} from '../../../welcomeData/welcomeConfig';

interface InnerObject {
	tags: string;
	name: string;
}

interface ServerData {
	git: InnerObject;
	name: string;
	0: InnerObject;
}

export default function VersionInfo(){
    const { publicRuntimeConfig } = getConfig();
    const { t } = useTranslation();

	const [serviceData, setServiceData] = useState<ServerData | null>(null);
	const [githubServiceData, setGithubServiceData] = useState<ServerData | null>(null);
	const [devopsData, setDevOpsData] = useState<ServerData | null>(null);
	const [keycloakData, setKeycloakData] = useState<ServerData | null>(null);
	const [adminUiData, setAdminUiData] = useState<ServerData | null>(null);

	const apiEndpoints = useMemo(() => [
		{ link: LOCAL_VERSION_LINKS.SERVICE_INFO, setter: setServiceData },
		{ link: API_LINKS.SERVICE, setter: setGithubServiceData },
		{ link: API_LINKS.DEVOPS, setter: setDevOpsData },
		{ link: API_LINKS.KEYCLOAK, setter: setKeycloakData },
		{ link: API_LINKS.ADMIN_UI, setter: setAdminUiData },
	], [])

	useEffect(() => {
		const getServerInformation = async () => {
			try {
                // Perform multiple API calls at the same time using Promise.allSettled
				const responses = await Promise.allSettled(
					apiEndpoints.map(async ({ link, setter }) => {
						try {
                            // Make API call and set the state with response data
							const response = await axios.get<ServerData>(link);
							setter(response.data);
							return { status: 'fulfilled' }; // Return status for the response
						} catch (error) {
                            // Log error if fetching data from an endpoint fails
							console.error(`Error fetching data from ${link}`, error);
							return {status: 'rejected', reason: error};
						}
					})
				);
			} catch (error) {
                // Catch any unhandled exceptions during the API calls
				console.error('Error fetching version information', error);
			}
		};

		getServerInformation();
	}, [apiEndpoints]);

    const VersionData = [
		[<Link key="dcb-service" href={REPO_LINKS.SERVICE} target='_blank' rel="noreferrer">dcb-service</Link>, 
		<Link key="dcb-service-version" href={RELEASE_PAGE_LINKS.SERVICE} target='_blank' rel="noreferrer">
			{githubServiceData ? (JSON.stringify(githubServiceData.name).replace(/"/g, '')):('Loading release information...')}
		</Link>, serviceData ? (JSON.stringify(serviceData.git.tags).replace(/"/g, '')): ('Loading version information...')],

		[<Link key="dcb-locate" href={REPO_LINKS.LOCATE} target='_blank' rel="noreferrer">dcb-locate</Link>, 
		<Link key="dcb-locate-version" href={RELEASE_PAGE_LINKS.LOCATE} target='_blank' rel="noreferrer">
			2.2.3
		</Link>, 'NA'],

		[<Link key="dcb-admin-ui" href={REPO_LINKS.ADMIN_UI} target='_blank' rel="noreferrer">dcb-admin-ui</Link>, 
		<Link key="dcb-admin-ui-version" href={RELEASE_PAGE_LINKS.ADMIN_UI} target='_blank' rel="noreferrer">
			{adminUiData ? (JSON.stringify(adminUiData.name).replace(/"/g, '')):('Loading release information...')}
		</Link>, publicRuntimeConfig?.version],

		[<Link key="dcb-dev-ops" href={REPO_LINKS.DEVOPS} target='_blank' rel="noreferrer">dcb-devops</Link>,
		<Link key="dcb-dev-ops-version" href={RELEASE_PAGE_LINKS.DEVOPS} target='_blank' rel="noreferrer">
			{devopsData ? (JSON.stringify(devopsData.name).replace(/"/g, '')):('Loading release information...')}
		</Link>, 'NA'],

		[<Link key="gors-hub-keycloak" href={REPO_LINKS.KEYCLOAK} target='_blank' rel="noreferrer">gors-hub-keycloak</Link>,
		<Link key="gors=hub-keycloak-version" href={RELEASE_PAGE_LINKS.KEYCLOAK} target='_blank' rel="noreferrer">
			{keycloakData ? (JSON.stringify(keycloakData[0].name).replace(/"/g, '')):('Loading release information...')}
		</Link>, 'NA'],
	];	

    return(
        <>
            <SimpleTable column_names={[t('dashboard_version_data.column1_name', 'Component'), t('dashboard_version_data.column2_name', 'Latest Release'), t('dashboard_version_data.column3_name', 'Your Version')]} row_data={VersionData}/>
        </>
    )

};