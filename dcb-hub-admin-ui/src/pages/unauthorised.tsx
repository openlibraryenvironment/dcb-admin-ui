import Link from '@components/Link/Link';
import { AdminLayout } from '@layout';
import { Stack, Typography } from '@mui/material';
//localisation
import { Trans, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Unauthorised() {
	const { t } = useTranslation();
	return (
		<AdminLayout title={t("unauthorised.page_title")} hideTitleBox={true} hideBreadcrumbs={true}>
			<Stack direction="column" spacing={3} alignItems={"center"}>
				<Typography variant='notFoundTitle'>{t("unauthorised.page_title")}</Typography>
					<Typography variant='notFoundText'>{t("unauthorised.page_text_no_access")}</Typography>
					<Typography variant='notFoundText'>
						{t("unauthorised.page_text_contact_admin")}
					</Typography>
					<Typography variant='notFoundText'>
						<Trans i18nKey={"unauthorised.go_back_text"} t={t} components={{linkComponent: <Link key="return-to-dashboard-link-401"  href='/'/>}} />
					</Typography>
			</Stack>
		</AdminLayout>
	);
}

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
