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
			<div>
				<Link className='text-decoration-none' href='https://www.k-int.com'>
					{t("footer.openRS")}{' '}
				</Link>{' '}
				/
				<Link className='text-decoration-none' href='https://www.k-int.com'>
					{' '}
					{t("footer.dcb")}
				</Link>
			</div>
			<div className='ms-md-auto'>{t('app.name')+'. '+t("app.version")+' '+publicRuntimeConfig?.version+'. '+
			t("app.released")+' '+formatDate(publicRuntimeConfig?.releaseDate)+'.'}</div>
		</footer>
	);
}
