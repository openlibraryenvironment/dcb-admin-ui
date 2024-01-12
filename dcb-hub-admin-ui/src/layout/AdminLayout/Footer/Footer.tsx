import Link from '@components/Link/Link';
import { Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
//localisation
import { useTranslation } from 'next-i18next';
import getConfig from "next/config";
import dayjs from 'dayjs';

export default function Footer() {
	const { t } = useTranslation();
	const { publicRuntimeConfig } = getConfig();
	const theme = useTheme();

	return (
		<footer className='footer flex-column flex-md-row border-top d-flex align-items-center justify-content-between px-4 py-2'>
			<div className='ms-md-auto'>
			<Stack direction="row" spacing={2} alignItems="flex-start"
			justifyContent="space-between">
			<Typography data-tid="footer-information" color={theme.palette.primary.headerText}>
			{<Link sx={{color: theme.palette.primary.link}} className='text-decoration-none' href={'https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/'} target='_blank' rel="noreferrer">
				{t('app.name')}
			</Link>}
			{'. '+t("app.version")+' '+publicRuntimeConfig?.version+'. '+t("app.released")+' '+dayjs(publicRuntimeConfig?.releaseDate).format('YYYY-MM-DD')+'.'}
			</Typography>
			<Typography color={theme.palette.primary.headerText}>
				Layout area two (Testing)
			</Typography>
			<Typography color={theme.palette.primary.headerText}>
				Layout area three (Testing)
			</Typography>
			</Stack>
			</div>
		</footer>
	);
}
