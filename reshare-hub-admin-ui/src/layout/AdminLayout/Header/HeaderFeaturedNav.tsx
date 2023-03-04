import Link from 'next/link'
import { Nav } from 'react-bootstrap'

export default function HeaderFeaturedNav() {
  return (
    <Nav>
      <Nav.Item>
        <Link href="/" passHref legacyBehavior>
          <Nav.Link className="p-2">Dashboard</Nav.Link>
        </Link>
      </Nav.Item>
      <Nav.Item>
        <Link href="/requests" passHref legacyBehavior>
          <Nav.Link className="p-2">Requests</Nav.Link>
        </Link>
      </Nav.Item>
    </Nav>
  )
}
