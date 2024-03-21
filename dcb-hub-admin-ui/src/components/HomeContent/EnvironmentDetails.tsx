import getConfig from "next/config";
import Link from '@components/Link/Link';
import EnvironmentHealth from "./EnvironmentHealth";
import SimpleTable from "@components/SimpleTable/SimpleTable";
import { useTranslation } from 'next-i18next'; //localisation
import axios from 'axios';
import {
	LOCAL_VERSION_LINKS,
} from '../../../homeData/homeConfig';
import { useEffect, useState } from "react";

export default function EnvironmentDetails(){
    const [environmentDescription, setEnvironmentDescription] = useState<any | null>(null);

    const { publicRuntimeConfig } = getConfig();
    const { t } = useTranslation();

    useEffect(() => {
        const getEnvDescription = async () => {
            try {
                const responseDCBDescription = await axios.get(LOCAL_VERSION_LINKS.SERVICE_INFO);
                setEnvironmentDescription(responseDCBDescription.data)
            } catch (error) {
                console.error('Error fetching environment description', error);
            }
        };
        getEnvDescription();
    }, [])

    const returnDCBEnvDescription = () => environmentDescription ? (JSON.stringify(environmentDescription.env.description).replace(/"/g, '')):(t("common.loading"))

    const YourDCBEnvironment = [
		['DCB Service', returnDCBEnvDescription() , <Link href={LOCAL_VERSION_LINKS.SERVICE_INFO} key={'serviceInfo'} target='_blank' rel="noreferrer">{LOCAL_VERSION_LINKS.SERVICE}</Link>, <Link key={'serviceHealthLink'} href={LOCAL_VERSION_LINKS.SERVICE_HEALTH} target='_blank' rel="noreferrer">{<EnvironmentHealth key={'serviceHealth'} apiLink={LOCAL_VERSION_LINKS.SERVICE_HEALTH} environment='dcb'/>}</Link>],
		['Keycloak', t('common.na'), <Link href={publicRuntimeConfig.KEYCLOAK_URL} key={'keycloakSite'} target='_blank' rel="noreferrer">{LOCAL_VERSION_LINKS.KEYCLOAK}</Link>, <Link href={LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH} key={'keycloackHealthLink'} target='_blank' rel="noreferrer">{<EnvironmentHealth key={'keycloakHealth'} apiLink={LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH} environment='keycloak'/>}</Link>],
	];

    return(
        <>
            <SimpleTable column_names={[t('service.name'), t('service.environment'), t('service.address'), t('service.status')]} row_data={YourDCBEnvironment} />
        </>
    )
}