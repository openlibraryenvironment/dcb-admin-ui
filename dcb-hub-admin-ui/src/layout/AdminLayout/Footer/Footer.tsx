import Link from '@components/Link/Link';
//localisation
import { useTranslation } from 'next-i18next';

export default function Footer() {
	const { t } = useTranslation();
	return (
		<footer className='footer flex-column flex-md-row border-top d-flex align-items-center justify-content-between px-4 py-2'>
			<div>
				<Link className='text-decoration-none' href='https://www.k-int.com'>
					{t("footer.openRS", "Project OpenRS")}{' '}
				</Link>{' '}
				/
				<Link className='text-decoration-none' href='https://www.k-int.com'>
					{' '}
					{t("footer.dcb", "Direct Consortial Borrowing")}
				</Link>
			</div>
			<div className='ms-md-auto'>{t("footer.version", "Version 1.0")}</div>
		</footer>
	);
}
