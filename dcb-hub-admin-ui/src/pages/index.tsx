import type { NextPage } from 'next';
import { AdminLayout } from '@layout';
// import SignOutIfInactive from './useAutoSignout';
import { CardContent, Typography, Card } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next'; //localisation
import getConfig from "next/config";
import SimpleTable from '@components/SimpleTable/SimpleTable';
import { Trans } from 'next-i18next';
import Link from '@components/Link/Link';
import EnvironmentHealth from '../components/WelcomeContent/EnvironmentHealth';
import VersionInfo from '../components/WelcomeContent/VersionInfo';
import {
	LOCAL_VERSION_LINKS,
	RELEASE_PAGE_LINKS,
} from '../../welcomeData/welcomeConfig'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';


const Home: NextPage = () => {
	const { data: session, status }: { data: any; status: any } = useSession();
	const { publicRuntimeConfig } = getConfig();

	const getUserName = () => {
		const nameOfUser = session?.profile?.given_name;
		if (nameOfUser == undefined) {
			return '(please log in)';
		}
		else{
			return nameOfUser;
		}
	}

	// line below currently does not work as expected, will need to be redone in the future
	// SignOutIfInactive();
	const { t } = useTranslation();
	const ConsortiumDetails = [
		[t('onboarding.stage.introduce_libraries.name'), t('onboarding.stage.introduce_libraries.action'), 
		<Trans key={"introduceLibraries"} i18nKey={'dashboard_consortium_details.row1_col3'}>We know about <abbr title='placeholder content'>81</abbr> library agencies in MOBIUS.<br/><br/> We are missing basic details for <abbr title='placeholder content'>75</abbr> of these.</Trans>],
		[t('onboarding.stage.provision_systems.name'), t('onboarding.stage.provision_systems.action'), 
		<Trans key={'provisionSystems'} i18nKey={'dashboard_consortium_details.row2_col3'}>We know about <abbr title='placeholder content'>51</abbr> Host LMS instances that are needed for MOBIUS.<br/><br/> We are missing essential details for <abbr title='placeholder content'>41</abbr> of these.</Trans>],
		[t('onboarding.stage.configure_services.name'), t('onboarding.stage.configure_services.action'), 
		<Trans key={'configureServices'} i18nKey={'dashboard_consortium_details.row3_col3'}>We are missing mapping configurations and patron authentication details for <abbr title='placeholder content'>73</abbr> libraries.<br/><br/> We are missing test records or accounts for <abbr title='placeholder content'>64</abbr> libraries.</Trans>],
		[t('onboarding.stage.migrate_service.name'), t('onboarding.stage.migrate_services.action'),
		<Trans key={'migrateServices'} i18nKey={'dashboard_consortium_details.row4_col3'}>We are missing expected migration details for <abbr title='placeholder content'>81</abbr> libraries.<br/><br/> We are missing a migration sign-off authority contact for <abbr title='placeholder content'>81</abbr> libraries.</Trans>],
		[t('onboarding.stage.operate_dcb.name'), t('onboarding.stage.operate_dcb.action'), 
		<Trans key={'operateDCB'} i18nKey={'dashboard_consortium_details.row5_col3'}>There are <abbr title='placeholder content'>0</abbr> library services administrators authorised to operate DCB services. </Trans>],
		[t('onboarding.stage.manage_support.name'), t('onboarding.stage.manage_support.action'),
		<Trans key={'manageSupport'} i18nKey={'dashboard_consortium_details.row6_col3'}>We have <abbr title='placeholder content'>0</abbr> library services administrators authorised to operate DCB services.</Trans>]
		];
	const YourDCBEnvironment = [
		['DCB Service', 'EBSCO Integrated Environment', <Link href={LOCAL_VERSION_LINKS.SERVICE_INFO} key={'serviceInfo'} target='_blank' rel="noreferrer">{LOCAL_VERSION_LINKS.SERVICE}</Link>, <Link key={'serviceHealthLink'} href={LOCAL_VERSION_LINKS.SERVICE_HEALTH} target='_blank' rel="noreferrer">{<EnvironmentHealth key={'serviceHealth'} apiLink={LOCAL_VERSION_LINKS.SERVICE_HEALTH} environment='dcb'/>}</Link>],
		['Keycloak', 'K-Int Dev Keycloak', <Link href={publicRuntimeConfig.KEYCLOAK_REFRESH} key={'keycloakSite'} target='_blank' rel="noreferrer">{LOCAL_VERSION_LINKS.KEYCLOAK}</Link>, <Link href={''} key={'keycloackHealthLink'} target='_blank' rel="noreferrer">{<EnvironmentHealth key={'keycloakHealth'} apiLink={LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH} environment='keycloak'/>}</Link>],
	];

	return (
		<AdminLayout>
			<Card>
				<CardContent>
					<Typography variant="h1" fontSize={'300%'} sx={{marginBottom: 1}}> {t('welcome.greeting')+' '+getUserName()} </Typography>
					<Typography variant='body1' sx={{marginBottom:2}} fontSize={'1.3rem'}>{t('dashboard.body_message')}</Typography>
					<Typography variant='h2' fontSize={'200%'} sx={{marginBottom:1}}>{t('dashboard.your_consortium_title')}</Typography>
					<Typography variant='body1' fontSize={'1.1rem'}> {t('dashboard.placeholder_text')} </Typography>
					<SimpleTable column_names={[t('dashboard_consortium_details.column1_name'), t('dashboard_consortium_details.column2_name'), t('dashboard_consortium_details.column3_name')]} row_data={ConsortiumDetails}/>
					<Typography variant='h2' fontSize={'200%'} sx={{marginBottom:1}}>{t('dashboard.your_dcb_envrionment')}</Typography>
					<Typography variant='body1' fontSize={'1.1rem'}>{t('dashboard.configured_for')}</Typography>
					<SimpleTable column_names={[t('dashboard_your_dcb_environment.column1_name'), t('dashboard_your_dcb_environment.column2_name'), t('dashboard_your_dcb_environment.column3_name'), t('dashboard_your_dcb_environment.column4_name')]} row_data={YourDCBEnvironment} />
					<Typography variant='body1' fontSize={'1.1rem'}>{t("dashboard.latest_version_text")}</Typography>
					<VersionInfo/>
					<Typography variant='body1' fontSize={'1.1rem'}>
						<Trans i18nKey="see_the_releases">
							See the <Link href={RELEASE_PAGE_LINKS.ALL_RELEASES} target='_blank' rel="noreferrer">Releases</Link> hub for more details and previous versions.
						</Trans>
					</Typography>
				</CardContent>
			</Card>
		</AdminLayout>
	);
};

export async function getStaticProps({ locale }: {locale: any}) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
			'application',
			'common',
			'validation'
			])),
		},
	}
};

export default Home;
