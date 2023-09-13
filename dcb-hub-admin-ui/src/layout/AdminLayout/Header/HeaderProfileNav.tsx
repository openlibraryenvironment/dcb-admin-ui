import { Dropdown, Nav, NavItem } from 'react-bootstrap';
import {
	MdPerson, MdLogout
} from 'react-icons/md';
import Link from 'next/link';
import { signOut } from "next-auth/react"
import { useRouter } from 'next/router';
import { IconContext } from "react-icons";



export default function HeaderProfileNav() {
	const router = useRouter();

	return (
		<Nav>
			<Dropdown as={NavItem}>
				<Dropdown.Toggle
					variant='link'
					bsPrefix='shadow-none'
					className='py-0 px-2 rounded-0'
					id='dropdown-profile'
				>
					<div className='avatar position-relative'>
						<Nav.Item>
							<Nav.Link className='p-2'>
              <IconContext.Provider value={{ size: "2em"}}>
                  <div>
                      <MdPerson />
                  </div>
              </IconContext.Provider>;
							</Nav.Link>
						</Nav.Item>
					</div>
				</Dropdown.Toggle>
				<Dropdown.Menu className='pt-0'>
					<Dropdown.Header className='bg-light fw-bold rounded-top'>Account</Dropdown.Header>
					<Dropdown.Header className='bg-light fw-bold'>Settings</Dropdown.Header>
					<Link href='/profile' passHref legacyBehavior>
						<Dropdown.Item>
							<MdPerson/> Profile
						</Dropdown.Item>
					</Link>
					<Dropdown.Item onClick={()=>signOut()}>
						<MdLogout/> Logout
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
		</Nav>
	);
}
