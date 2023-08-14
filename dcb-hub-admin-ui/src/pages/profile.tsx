import * as React from 'react';
import { NextPage } from 'next';

import { Card, CardGroup } from 'react-bootstrap';

import { AdminLayout } from '@layout';

import { useSession } from 'next-auth/react';

type Props = {
	page: number;
	perPage: number;
	sort: string;
	order: string;
};

const Profile: NextPage<Props> = (props) => {
	const { data: session, status }: { data: any; status: any } = useSession();
	// eventually we should read this data in properly so we're not referring directly to session
	// we also want to make this look a lot nicer - it's there to help development at the minute
	// read roles in properly too and split it nicely
	// and figure out if we want any dev info there
	const emailVerified = (session?.profile?.email_verified) ?? "Cannot fetch verified email status." ;
	return (
		<AdminLayout>
					<CardGroup>
						<Card>
							<Card.Header>Profile</Card.Header>
							<Card.Body> Name: {session?.user?.name} </Card.Body>
							<Card.Body> Email: {session?.user?.email}</Card.Body>
							<Card.Body> Email Verified: {emailVerified.toString()}</Card.Body>
							<Card.Body> Preferred Username: {session?.profile?.preferred_username} </Card.Body>
							<Card.Body> Roles : {session?.profile?.roles}</Card.Body>


						</Card>	


		{/* <Card>
			<Card.Body>
					<pre>{JSON.stringify(session, null, 2)}</pre>
			</Card.Body>
			</Card> */}
		</CardGroup>

		</AdminLayout>

	);
};

export default Profile;
