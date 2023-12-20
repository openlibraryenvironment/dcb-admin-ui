import Link from '@components/Link/Link';
//localisation
import { useTranslation } from 'next-i18next';
import getConfig from "next/config";
import { formatDate } from 'src/helpers/formatDate';


export default function Footer() {
	const { t } = useTranslation();
	const { publicRuntimeConfig } = getConfig();

	return (
		<footer className='footer flex-column flex-md-row border-top d-flex align-items-center justify-content-between px-4 py-2'>
			<div className='ms-md-auto'>
			{<Link className='text-decoration-none' href={'https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/'} target='_blank' rel="noreferrer">
				{t('app.name')}
			</Link>}
			{'. '+t("app.version")+' '+publicRuntimeConfig?.version+'. '+t("app.released")+' '+formatDate(publicRuntimeConfig?.releaseDate)+'.'}
			</div>
		</footer>
	);
}
