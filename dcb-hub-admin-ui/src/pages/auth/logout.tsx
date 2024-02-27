import LoginLayout from '@layout/LoginLayout/LoginLayout';
import { Box, Button, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { signIn } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Trans, useTranslation } from 'next-i18next'; //localisation
import Link from '@components/Link/Link';
import Alert from '@components/Alert/Alert';
import { useState } from 'react';
import LandingCard from '@components/LandingCard/LandingCard';

// This is the page shown after logout in DCB Admin. It is very similar to login, but has the logout alert and other logout-specific behaviours.
// Shared UI elements have been refactored into the LandingCard component.

export default function Logout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [alertDisplayed, setAlertDisplayed] = useState(true);
  
  const handleSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl: '/' }); // Redirect to home page after sign-in
  };

  return (
    <LoginLayout>
        <Card variant='outlined' sx={{backgroundColor: theme.palette.primary.loginCard, p: 4, border: 'none'}}>
          {alertDisplayed ? 
            <Box ml={2} mb={2}> 
                <Alert severityType="info" variant={"filled"} onCloseFunc={() => setAlertDisplayed(false)}
                  alertText={<Typography variant = "loginCardText" color={theme.palette.common.white}> 
                              <Trans i18nKey={"loginout.logged_out"} t={t} components={{bold: <strong />, break: <br />}} values={{appName: "DCB Admin", consortium: "MOBIUS"}}/>
                            </Typography>} 
                  textColor={theme.palette.common.white} titleShown={false}>
                </Alert> 
            </Box>
          : null}
          <CardContent>
            <Stack direction={'column'} spacing={2} width='fit-content'>
            <Typography color={theme.palette.primary.loginText} variant='loginHeader'>
                {t("loginout.login")}
              </Typography>
              <Typography color={theme.palette.primary.loginText} variant='subheading'> 
                <Trans i18nKey={"loginout.keycloak"} t={t} components={{linkComponent: <Link key="keycloak-link" href="https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2817064969/"/>}} />
              </Typography>
            </Stack>
            <Box sx={{mt: 3.5}}>
              <Button variant='contained' color='primary' size="xlarge" onClick={() => handleSignIn('keycloak')}>{t("nav.login")}</Button>
            </Box>
          </CardContent>
        </Card>
        <LandingCard/>
    </LoginLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
	translations = await serverSideTranslations(locale as string, ['common', 'application', 'validation']);
	}
	return {
		props: {
			...translations,
		}
	};
};
