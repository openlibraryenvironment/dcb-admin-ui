import { createColumnHelper } from '@tanstack/react-table'
import * as React from 'react';
import { useState } from 'react';
import { Group } from '@models/Group';
import { AdminLayout } from '@layout';
import { useSession } from 'next-auth/react';
import getConfig from 'next/config';
import { Button, Card } from 'react-bootstrap';
import NewGroup from './NewGroup';
import { Table } from '@components/Table';
import request, { GraphQLClient } from 'graphql-request';
import { useMutation, useQuery, useQueryClient  } from '@tanstack/react-query';
import Details from '@components/Details/Details';
import { groupsQueryDocument } from 'src/queries/queries';
// import axios from 'axios';
// import KeycloakProvider from 'next-auth/providers/keycloak';



// Groups Feature Page Structure
// This page shows the list of groups
// New Group is the (modal) form to add a group
// View Group will be a Details page with type 'Group'
// In /agencies, there is the Add Agencies to Group form.
// Our GraphQL client decision is still under review, as it's glitchy.

// Commented-out code in this file is for the experimental method of refreshing access tokens
// this is aimed at fixing the graphQL issues ^^

// const keycloak = KeycloakProvider({
//     clientId: process.env.KEYCLOAK_ID!,
//     clientSecret: process.env.KEYCLOAK_SECRET!,
//     issuer: process.env.KEYCLOAK_ISSUER,
// });

export default function Groups() {
	const graphQLClient = new GraphQLClient('https://dcb-uat.sph.k-int.com/graphql');
	// const refreshUrl = React.useMemo(() => {
	// 	const { publicRuntimeConfig } = getConfig();
	// 	return publicRuntimeConfig.KEYCLOAK_REFRESH + '/protocol/openid-connect/token';
	// }, []);
	// console.log("The refresh URL is", refreshUrl); 
	const queryClient = useQueryClient();
	const { data: session, status } = useSession();
	const [showNewGroup, setShowNewGroup] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const [idClicked, setIdClicked] = useState(42);

	const openNewGroup = ( {id} : {id: number}) =>
	{
		setShowNewGroup(true);
		setIdClicked(id);
	}
	const closeNewGroup = () => {
		setShowNewGroup(false);
		queryClient.invalidateQueries(['findGroups']);
		// forces the query to refresh once a new group is added		
	};
	
	const openDetails = ( {id} : {id: number}) =>
	{
		setShowDetails(true);
		setIdClicked(id);
	}
	const closeDetails = () => {
		setShowDetails(false);
	};

	// // experimental RAT method
	// console.log("Session data:", session);
	// const newAccessToken = session?.accessToken;

	// const details = {
	// 	client_id: process.env.KEYCLOAK_CLIENT_ID!,
	// 	client_secret: process.env.KEYCLOAK_SECRET!,
	// 	grant_type: ['refresh_token'],
	// 	refresh_token: session?.refreshToken,
	//   };
	//   console.log(details);
	//   const formBody: string[] = [];
	//   Object.entries(details).forEach(([key, value]: [string, any]) => {
	// 	const encodedKey = encodeURIComponent(key);
	// 	const encodedValue = encodeURIComponent(value);
	// 	formBody.push(encodedKey + '=' + encodedValue);
	//   });
	//   const formData = formBody.join('&');
	// const refreshToken = async () => {
	// 	// This is where we hit Keycloak for the refreshing of our access token
	// 	const response = await axios.post(refreshUrl, formData, { headers: {
	// 		'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'}})
	// 	return response.data.access_token;
	//   };

	//   const { mutate: refreshAccessTokenMutation } = useMutation(refreshToken, {
	// 	onSuccess: (newAccessToken) => {
	// 	  // Update the session with the new access token
	// 	  console.log("Token refreshed and is now:", newAccessToken);
	// 	  queryClient.setQueryData(['session'], { ...session, accessToken: newAccessToken });
	// 	  console.log("Updated session.accessToken:", session?.accessToken);
	// 	  loadGroups();
	// 	  queryClient.invalidateQueries(['findGroups']);
	// 	},
	//   });
	//   // async/ await causing this not to work correctly

	const url = React.useMemo(() => {
		const { publicRuntimeConfig } = getConfig();
		return publicRuntimeConfig.DCB_API_BASE + '/graphql';
	}, []);

	const columns = React.useMemo(() => {
		const columnHelper = createColumnHelper<Group>();

		return [
			columnHelper.accessor('id', {
				cell: (info) => <Button
				variant='link'
				type='button'
				onClick={() => openDetails({ id: info.getValue() })}>
				{info.getValue()}
			</Button>,
				header: '#',
				id: 'id',
				enableSorting: true
			}),
			columnHelper.accessor('code', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Code',
				id: 'groupId'
			}),
			columnHelper.accessor('name', {
				cell: (info) => <span>{info.getValue()}</span>,
				header: 'Name',
				id: 'groupCode'
			}),
		];
	}, []);
	const headers = { Authorization: `Bearer ${session?.accessToken}` }
	const queryVariables = {};
	const loadGroups = () => request(url, groupsQueryDocument, queryVariables, headers);

	// const loadGroups = async () => {
	// 	try {
	// 	  // Axios happy path
	// 	  console.log("Happy path attempt.");
	// 	  const response = await axios.post(
	// 		url,
	// 		{ query: groupsQueryDocument, variables: queryVariables },
	// 		{
	// 		  headers: {
	// 			Authorization: `Bearer ${session?.accessToken}`, // Use the updated access token
	// 			'Content-Type': 'application/json', // You can adjust the content type as needed
	// 		  },
	// 		}
	// 	  );
	// 	  console.log("Response received", response);
	// 	  console.log(response.status);
	// 	  return response.data;
	// 	} catch (error) {
	// 		console.log(error);
	// 		if (error?.response.status === 401) {
	// 			// If the status is 401, refresh the access token
	// 			console.log("401");
	// 			await refreshAccessTokenMutation();
	// 			console.log("New token ", session?.accessToken);
	// 			// Retry the GraphQL request with the new access token
	// 			const newResponse = await axios.post(
	// 				url,
	// 				{ query: groupsQueryDocument },
	// 				{
	// 				  headers: {
	// 					Authorization: `Bearer ${session?.accessToken}`, // Use the updated access token
	// 					'Content-Type': 'application/json', // You can adjust the content type as needed
	// 				  },
	// 				}
	// 			  );				
	// 			  return newResponse.data;
	// 		  }
	// 	  // Handle other errors here
	// 	  throw error;
	// 	}
	//   };
	


	const { data, error, isLoading }: any = useQuery(['findGroups'], loadGroups);
	// console.log("Data",data?.data?.agencyGroups);
	// fix authorisation issues on GQL pages
	// need to be able to pick up an error - doesn't come down on the GQL response

	return (
		<AdminLayout>
			<Card>
				<Card.Header>Groups</Card.Header>
				<Card.Body>
					{/* TODO: Implement GraphQL error + loading behaviour here */}
					<Table
						data={data?.agencyGroups ?? []}
						columns={columns}
						type = "Groups"
					/>
					<Button onClick={() => openNewGroup({ id: 42 })} > New Group</Button>
				</Card.Body>
			</Card>
			<div>
			{ showNewGroup ? <NewGroup show={showNewGroup}  onClose={closeNewGroup}/> : null }
			{ showDetails ? <Details i={idClicked} content = {data?.agencyGroups ?? []} show={showDetails}  onClose={closeDetails} type={"Group"} /> : null }
    		</div>
		</AdminLayout>
	);
  }
