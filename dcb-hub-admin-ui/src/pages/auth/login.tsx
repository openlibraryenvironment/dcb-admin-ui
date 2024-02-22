import LoginLayout from '@layout/LoginLayout/LoginLayout';
import { Box, Button, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { signIn } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Trans, useTranslation } from 'next-i18next'; //localisation
import Link from '@components/Link/Link';
import LandingCard from '@components/LandingCard/LandingCard';

// This is the DCB Admin login page. It displays a clear call to action for 'Login', as well as three info cards held in the 'LandingCard' component.

export default function Login() {
  const theme = useTheme();
  const { t } = useTranslation();
  const handleSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl: "/" }); // Redirect to home page after sign-in
  };

  return (
    <LoginLayout>
        <Card variant='outlined' sx={{backgroundColor: theme.palette.primary.loginCard, p: 4, border: 'none'}}>
          <CardContent>
            <Stack direction={'column'} spacing={2} width='fit-content'>
          <Typography color={theme.palette.primary.loginText} variant='h2'>
            <span style={{ fontWeight: 'bold' }}>{t("loginout.login")} </span>
          </Typography>
          <Typography color={theme.palette.primary.loginText} variant='subheading'> 
            <Trans i18nKey={"loginout.keycloak"} t={t} components={{linkComponent: <Link key="keycloak-information-link" href="https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2817064969/"/>}} />
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
