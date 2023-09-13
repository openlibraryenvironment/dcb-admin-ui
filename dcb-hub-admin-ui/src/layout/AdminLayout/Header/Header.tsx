import { MdMenu } from 'react-icons/md';
import Link from 'next/link';
import Breadcrumb from '@layout/AdminLayout/Breadcrumb/Breadcrumb';
import HeaderProfileNav from '@layout/AdminLayout/Header/HeaderProfileNav';
import { Button, Container } from 'react-bootstrap';
import { IconContext } from 'react-icons';

type HeaderProps = {
	toggleSidebar: () => void;
	toggleSidebarMd: () => void;
};

// This component, along with HeaderProfileNav, will be replaced with an AppBar that will have profile and logout buttons on it
// instead of being in a drop-down
// This will be implemented in DCB-305, removing the react-bootstrap components and replacing them with MUI ones.
// Once this is complete, please delete this comment.

// We will also need an adaptor for the MUI Next Link component, as seen here https://mui.com/material-ui/guides/routing/#next-js-pages-router .
// This should be implemented either with the sidebar, or with the menu bar.
export default function Header(props: HeaderProps) {
	const { toggleSidebar, toggleSidebarMd } = props;

	return (
		<header className='header sticky-top mb-4 p-2 border-bottom'>
			<Container fluid className='header-navbar d-flex align-items-center'>
				<Button
					variant='link'
					className='header-toggler d-md-none px-md-0 me-md-3 rounded-0 shadow-none'
					type='button'
					onClick={toggleSidebar}
				>
				<IconContext.Provider value={{ size: "2em"}}>
					<div>
						<MdMenu />
					</div>
				</IconContext.Provider>
				</Button>
				<Button
					variant='link'
					className='header-toggler d-none d-md-inline-block px-md-0 me-md-3 rounded-0 shadow-none'
					type='button'
					onClick={toggleSidebarMd}
				>
				<IconContext.Provider value={{ size: "2em"}}>
					<div>
						<MdMenu />
					</div>
				</IconContext.Provider>
				</Button>
				<Link href='/' className='header-brand d-md-none'>
					<svg width='118' height='46'>
						<title>DCB</title>
					</svg>
				</Link>
				<div className='header-nav ms-auto'>
					<HeaderProfileNav />
				</div>
			</Container>
			<div className='header-divider border-top my-2 ms-n2 me-n2' />
			<Container fluid>
				<Breadcrumb />
			</Container>
		</header>
	);
}
