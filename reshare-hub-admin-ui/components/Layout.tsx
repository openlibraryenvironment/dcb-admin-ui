import { useSession, signIn, signOut } from "next-auth/react"
import AuthenticatedNavbar from  "../components/AuthenticatedNavbar"
import AnonNavbar from  "../components/AnonNavbar"
import Container from 'react-bootstrap/Container';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ( {children} : LayoutProps ) => {

  const { data: session, status } = useSession()
  const navbar_component = session != null ? ( <AuthenticatedNavbar session={session} /> ) : ( <AnonNavbar/> )

  return (
    <Container fluid>
      {navbar_component}
      {children}
    </Container>
  )
}

export default Layout

