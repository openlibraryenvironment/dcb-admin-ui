import type { NextPage } from 'next';
import { AdminLayout } from '@layout';
// import SignOutIfInactive from './useAutoSignout';
import { CardContent, Typography, Card } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next'; //localisation
import getConfig from "next/config";
import { Trans } from 'next-i18next';
import Link from '@components/Link/Link';
import VersionInfo from '@components/HomeContent/VersionInfo';
import ConsortiumDetails from '@components/HomeContent/ConsortiumDetails';
import {
	RELEASE_PAGE_LINKS,
} from '../../homeData/homeConfig'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import EnvironmentDetails from '@components/HomeContent/EnvironmentDetails';


const Home: NextPage = () => {
	const { data: session, status }: { data: any; status: any } = useSession();
	const { publicRuntimeConfig } = getConfig();

	const getUserName = () => {
		const nameOfUser = session?.profile?.given_name;
		if (nameOfUser == undefined) {
			return t('app.guest_user');
		}
		else{
			return nameOfUser;
		}
	}

	// line below currently does not work as expected, will need to be redone in the future
	// SignOutIfInactive();
	const { t } = useTranslation();

	return (
		<AdminLayout>
			<Card>
				<CardContent>
					<Typography variant="h1" fontSize={'300%'} sx={{marginBottom: 1}}> {t('welcome.greeting')+' '+getUserName()} </Typography>
					<Typography variant='body1' sx={{marginBottom:2}} fontSize={'1.3rem'}>{t('welcome.context', {consortium_name: 'MOBIUS'})}</Typography>
					<Typography variant='h2' fontSize={'200%'} sx={{marginBottom:1}}>{t('consortium.your')}</Typography>
					<Typography variant='body1' fontSize={'1.1rem'}> {t('common.placeholder_text')} </Typography>
					<ConsortiumDetails/>
					<Typography variant='h2' fontSize={'200%'} sx={{marginBottom:1}}>{t('environment.your')}</Typography>
					<Typography variant='body1' fontSize={'1.1rem'}>{t('environment.configured_for')}</Typography>
					<EnvironmentDetails/>
					<Typography variant='body1' fontSize={'1.1rem'}>{t("environment.compare_components")}</Typography>
					<VersionInfo/>
					<Typography variant='body1' fontSize={'1.1rem'}>
						<Trans
						i18nKey="environment.releases_link"
						components={{linkToReleases: <Link href={RELEASE_PAGE_LINKS.ALL_RELEASES} target='_blank' rel="noreferrer"/>}}
						>
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
