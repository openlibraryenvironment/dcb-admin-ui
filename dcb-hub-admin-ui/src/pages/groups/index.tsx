import {
	createColumnHelper } from '@tanstack/react-table'
import * as React from 'react';
import { useState, useReducer } from 'react';
import { Group } from '@models/Group';
import { useResource } from '@hooks';
import { AdminLayout } from '@layout';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';
import { Button, Card } from 'react-bootstrap';
import NewGroup from './NewGroup';
import { Table } from '@components/Table';

// Groups Feature Page Structure
// This page shows the list of groups
// New Group is the (modal) form to add a group
// View Group will be a Details page with type 'Group'
// In /agencies, there is the Add Agencies to Group form

  export default function Groups() {
	const { data, status } = useSession();
	const [showNewGroup, setShowNewGroup] = useState(false);
	const [idClicked, setIdClicked] = useState(42);

	const openNewGroup = ( {id} : {id: number}) =>
	{
		setShowNewGroup(true);
		setIdClicked(id);
	}
	const closeNewGroup = () => {
		setShowNewGroup(false);
	};
	


	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/groups';
	}, []);

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<Group>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => <Button
				variant='link'
				type='button'
				onClick={() => openNewGroup({ id: info.getValue() })}>
				{info.getValue()}
			</Button>,				header: '#',
				id: 'id',
				enableSorting: false
			}),
			columnHelper.accessor('code', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Code',
				id: 'groupId' // Used as the unique property in the sorting state (See React-Query dev tools)
			}),
			columnHelper.accessor('name', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Name',
				id: 'groupCode' // Used as the unique property in the sorting state (See React-Query dev tools)
			})
		];
	}, []);

	const {
		resource,
		status: resourceFetchStatus,
		state
	} = useResource<Group>({
		isQueryEnabled: status === 'authenticated',
		accessToken: data?.accessToken ?? null,
		baseQueryKey: 'groups',
		url: url,
	});
	

  
	return (
		<AdminLayout>
			<Card>
				<Card.Header>Groups</Card.Header>
				<Card.Body>
					{resourceFetchStatus === 'loading' && (
						<p className='text-center mb-0'>Loading groups.....</p>
					)}

					{resourceFetchStatus === 'error' && (
						<p className='text-center mb-0'>Failed to fetch groups, will retry</p>
					)}

					{resourceFetchStatus === 'success' && (
						<>			
							<Table
							// This will not work until we have data coming from groups - so don't worry if you see 401s coming from here, it's expected.
								data={resource?.content ?? []}
								columns={columns}
								type = "Groups"
							/>
						</>
					)}
				</Card.Body>
			</Card>
			<div>
			<Button onClick={() => openNewGroup({ id: 42 })} > New Group</Button>
	{ showNewGroup ? <NewGroup show={showNewGroup}  onClose={closeNewGroup}/> : null }
    		</div>
		</AdminLayout>
	);
  }

  // you also need the equivalent of a Group Details page, but editable