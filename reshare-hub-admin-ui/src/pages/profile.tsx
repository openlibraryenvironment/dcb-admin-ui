import * as React from 'react';
import { NextPage } from 'next';

import { Card } from 'react-bootstrap';

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

	return (
		<AdminLayout>
			<Card>
				<Card.Header>Profile</Card.Header>
				<Card.Body>
					<pre>{JSON.stringify(session, null, 2)}</pre>
				</Card.Body>
			</Card>
		</AdminLayout>
	);
};

export default Profile;
