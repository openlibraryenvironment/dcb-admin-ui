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
import EnvironmentHealth from './WelcomeContent/EnvironmentHealth';
import VersionInfo from './WelcomeContent/VersionInfo';
import {
	LOCAL_VERSION_LINKS,
	RELEASE_PAGE_LINKS,
} from '../../welcomeData/welcomeConfig'

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
		[t('dashboard_consortium_details.row1_col1', '1. Introduce libraries'), t('dashboard_consortium_details.row1_col2', 'Tell us about the members in your consortium that we need to onboard and migrate'), 
		<Trans key={"introduceLibraries"} i18nKey={'dashboard_consortium_details.row1_col3'}>We know about <abbr title='placeholder content'>81</abbr> library agencies in MOBIUS.<br/><br/> We are missing basic details for <abbr title='placeholder content'>75</abbr> of these.</Trans>],
		[t('dashboard_consortium_details.row2_col1', '2. Provision systems'), t('dashboard_consortium_details.row2_col2', 'Provide technical details we need to set up your DCB services'), 
		<Trans key={'provisionSystems'} i18nKey={'dashboard_consortium_details.row2_col3'}>We know about <abbr title='placeholder content'>51</abbr> Host LMS instances that are needed for MOBIUS.<br/><br/> We are missing essential details for <abbr title='placeholder content'>41</abbr> of these.</Trans>],
		[t('dashboard_consortium_details.row3_col1', '3. Configure services'), t('dashboard_consortium_details.row3_col2', 'Share configuration mappings and test record details we need to check that DCB services work as you expect'), 
		<Trans key={'configureServices'} i18nKey={'dashboard_consortium_details.row3_col3'}>We are missing mapping configurations and patron authentication details for <abbr title='placeholder content'>73</abbr> libraries.<br/><br/> We are missing test records or accounts for <abbr title='placeholder content'>64</abbr> libraries.</Trans>],
		[t('dashboard_consortium_details.row4_col1', '4. Migrate service'), t('dashboard_consortium_details.row4_col2', 'Share key dates and contacts so we can plan for your service migration'),
		<Trans key={'migrateServices'} i18nKey={'dashboard_consortium_details.row4_col3'}>We are missing expected migration details for <abbr title='placeholder content'>81</abbr> libraries.<br/><br/> We are missing a migration sign-off authority contact for <abbr title='placeholder content'>81</abbr> libraries.</Trans>],
		[t('dashboard_consortium_details.row5_col1', '5. Operate DCB'), t('dashboard_consortium_details.row5_col2', 'Authorise who can manage your live DCB services'), 
		<Trans key={'operateDCB'} i18nKey={'dashboard_consortium_details.row5_col3'}>There are <abbr title='placeholder content'>0</abbr> library services administrators authorised to operate DCB services. </Trans>],
		[t('dashboard_consortium_details.row6_col1', '6. Manage support'), t('dashboard_consortium_details.row6_col2', 'Maintain current authorised support contacts so we can deal with any help you need'),
		<Trans key={'manageSupport'} i18nKey={' dashboard_consortium_details.row6_col3'}>We have <abbr title='placeholder content'>0</abbr> library services administrators authorised to operate DCB services.</Trans>]
		];
	const YourDCBEnvironment = [
		['DCB Service', 'EBSCO Integrated Environment', <Link href={LOCAL_VERSION_LINKS.SERVICE_INFO} key={'serviceInfo'} target='_blank' rel="noreferrer">{LOCAL_VERSION_LINKS.SERVICE}</Link>, <Link key={'serviceHealthLink'} href={LOCAL_VERSION_LINKS.SERVICE_HEALTH} target='_blank' rel="noreferrer">{<EnvironmentHealth key={'serviceHealth'} apiLink={LOCAL_VERSION_LINKS.SERVICE_HEALTH} environment='dcb'/>}</Link>],
		['Keycloak', 'K-Int Dev Keycloak', <Link href={publicRuntimeConfig.KEYCLOAK_REFRESH} key={'keycloakSite'} target='_blank' rel="noreferrer">{LOCAL_VERSION_LINKS.KEYCLOAK}</Link>, <Link href={''} key={'keycloackHealthLink'} target='_blank' rel="noreferrer">{<EnvironmentHealth key={'keycloakHealth'} apiLink={LOCAL_VERSION_LINKS.KEYCLOAK_HEALTH} environment='keycloak'/>}</Link>],
	];

	return (
		<AdminLayout>
			<Card>
				<CardContent>
					<Typography variant="h1" fontSize={'300%'} sx={{marginBottom: 1}}> {t('dashboard.app_title', 'Welcome ')+getUserName()} </Typography>
					<Typography variant='body1' sx={{marginBottom:2}} fontSize={'1.3rem'}>{t('dashboard.body_message', 'You are using DCB Admin to manage the Direct Consortial Borrowing configuration for the MOBIUS consortium.')}</Typography>
					<Typography variant='h2' fontSize={'200%'} sx={{marginBottom:1}}>{t('dashboard.your_consortium_title', 'Your Consortium')}</Typography>
					<Typography variant='body1' fontSize={'1.1rem'}> {t('dashboard.placeholder_text','Note: All numbers displayed below are placeholders only')} </Typography>
					<SimpleTable column_names={[t('dashboard_consortium_details.column1_name', 'Onboarding stage'), t('dashboard_consortium_details.column2_name', 'What you need to do'), t('dashboard_consortium_details.column3_name', "How it's going")]} row_data={ConsortiumDetails}/>
					<Typography variant='h2' fontSize={'200%'} sx={{marginBottom:1}}>{t('dashboard.your_dcb_environment', 'Your DCB environment')}</Typography>
					<Typography variant='body1' fontSize={'1.1rem'}>{t('dashboard.configured_for', 'This installation of DCB Admin is configured for')}</Typography>
					<SimpleTable column_names={[t('dashboard_your_dcb_environment.column1', 'Service'), t('dashboard_your_dcb_environment.column2', 'Environment'), t('dashboard_your_dcb_environment.column3', 'Address'), t('dashboard_your_dcb_environment.column4', 'Status')]} row_data={YourDCBEnvironment} />
					<Typography variant='body1' fontSize={'1.1rem'}>{t("dashboard.latest_version_text", 'The latest versions of DCB system components are')}</Typography>
					<VersionInfo/>
					<Typography variant='body1' fontSize={'1.1rem'}>
						<Trans i18nKey="see_the_releases">
							See the <Link href={RELEASE_PAGE_LINKS.ALL_RELEASES} target='_blank' rel="noreferrer">Releases hub</Link> for more details and previous versions.
						</Trans>
					</Typography>
				</CardContent>
			</Card>
		</AdminLayout>
	);
};

export default Home;
