import * as React from 'react';
import { NextPage } from 'next';

import { Card, CardGroup, ListGroupItem } from 'react-bootstrap';

import { ListGroup } from 'react-bootstrap';
import { MdPersonOutline } from 'react-icons/md';
import { MdOutlineMail } from 'react-icons/md';
import { MdOutlineMarkEmailRead } from 'react-icons/md';
import { MdThumbUpOffAlt } from 'react-icons/md';
import { MdOutlineSupervisorAccount } from 'react-icons/md';

import { AdminLayout } from '@layout';

import { useSession } from 'next-auth/react';

// import SignOutIfInactive from './useAutoSignout';

type Props = {
	page: number;
	perPage: number;
	sort: string;
	order: string;
};

const Profile: NextPage<Props> = (props) => {
	const { data: session, status }: { data: any; status: any } = useSession();
	const emailVerified = session?.profile?.email_verified ?? 'Cannot fetch verified email status.';
	const renderListOfRoles = (roles: string[]) => {
		return roles?.map((role) => <li key={roles.indexOf(role)}>{role}</li>);
	};
	// SignOutIfInactive();

	return (
		<AdminLayout>
			<CardGroup>
				<Card style={{ width: '30rem' }}>
					{/*use <Card.Img for profile pictures if needed in the future*/}
					<Card.Body>
						<Card.Title>Profile</Card.Title>
						<Card.Text>Your details</Card.Text>
					</Card.Body>
					<ListGroup className='list-group-flush'>
						<ListGroup.Item>
							<MdPersonOutline /> <span style={{ fontWeight: 'bold' }}>Name: </span>{' '}
							{session?.user?.name}
						</ListGroup.Item>
						<ListGroupItem>
							<MdOutlineMail /> <span style={{ fontWeight: 'bold' }}>Email: </span>
							{session?.user?.email}
						</ListGroupItem>
						<ListGroupItem>
							<MdOutlineMarkEmailRead />
							<span style={{ fontWeight: 'bold' }}> Email Verified: </span>
							{emailVerified.toString()}
						</ListGroupItem>
						<ListGroupItem>
							<MdThumbUpOffAlt /> <span style={{ fontWeight: 'bold' }}>Preferred Username: </span>
							{session?.profile?.preferred_username}
						</ListGroupItem>
						<ListGroupItem>
							<MdOutlineSupervisorAccount />
							<span style={{ fontWeight: 'bold' }}>Roles: </span>
							{renderListOfRoles(session?.profile?.roles)}
						</ListGroupItem>
					</ListGroup>
				</Card>
			</CardGroup>
		</AdminLayout>
	);
};

export default Profile;
