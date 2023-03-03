import type { NextPage } from 'next'
import Head from 'next/head'
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import Link from "next/link";
import { useSession, signIn, signOut, SignInOptions } from "next-auth/react"

// https://react-bootstrap.github.io/components/navbar/
// https://getbootstrap.com/docs/5.0/examples/

import { useTranslation, Trans } from 'react-i18next';

function AnonNavbar() {

  const { t, i18n } = useTranslation();

  const sign_in_options: SignInOptions = {};

  return (
    <Navbar id="navbarScroll" expand="lg" variant="dark" bg="dark">
      <Container>

        <Nav className="me-auto my-2 my-lg-0" style={{ maxHeight: '100px' }} navbarScroll >
          <Navbar.Brand href="/">{t('appname')}</Navbar.Brand>
        </Nav>

        <Nav>
          <Nav.Item onClick={() => signIn('keycloak', sign_in_options)} className="nav-link">{t('login')}</Nav.Item>
        </Nav>
      </Container>
    </Navbar>
  )
}

/*
          <Nav.Item onClick={() => signIn('keycloak', null, { "kc_idp_hint": "folio-snapshot" } )} className="nav-link">{t('login')}</Nav.Item>
          <NavDropdown title="User" id="basic-nav-dropdown" menuVariant="light">
            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
            <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={() => signIn('keycloak')}>{t('login')}</NavDropdown.Item>
          </NavDropdown>
*/
export default AnonNavbar
