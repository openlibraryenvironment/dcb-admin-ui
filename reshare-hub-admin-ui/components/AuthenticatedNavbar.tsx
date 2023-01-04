import type { NextPage } from 'next'
import Head from 'next/head'
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react"
import { useTranslation, Trans } from 'react-i18next';

interface AuthenticatedNavbarProps {
  session: any;
}

const AuthenticatedNavbar = ( {session} : AuthenticatedNavbarProps ) => {

  const { t, i18n } = useTranslation();

  const admin_menu = session.isAdmin == false ? null : (
    <NavDropdown title="Admin" id="basic-nav-dropdown">
      <Link href="/admin/zones" passHref><NavDropdown.Item>Zones</NavDropdown.Item></Link>
      <NavDropdown.Item href="#action/3.2">Admin Another action</NavDropdown.Item>
    </NavDropdown>
  );

  return (
    <Navbar id="navbarScroll" expand="lg" variant="dark" bg="dark">
      <Container>
        <Nav className="me-auto my-2 my-lg-0"
             style={{ maxHeight: '100px' }}
             navbarScroll >
          <Navbar.Brand href="/">{t('appname')} ({t('authenticated')})</Navbar.Brand>
          <Link href="/somelink" passHref>
            <Nav.Link>Somelink</Nav.Link>
          </Link>

          {admin_menu}
        </Nav>

        <Nav>
          <NavDropdown title="User" id="basic-nav-dropdown">
            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={() => signOut()}>Sign out</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  )
}


export default AuthenticatedNavbar;
