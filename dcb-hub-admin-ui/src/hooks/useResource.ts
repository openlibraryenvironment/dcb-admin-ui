import * as React from 'react';

import { useQuery, QueryKey } from '@tanstack/react-query';
import axios, { AxiosRequestHeaders } from 'axios';
import { newGraphQLResource, newResource, Resource } from '@models/resource';
import { PaginationState, SortingState } from '@tanstack/react-table';
// If we keep using this, implement access token refresh here
// Remove remaining react-table stuff when we fully implement server side pagination
const INITIAL_STATE: { pagination: PaginationState; sort: SortingState } = {
	pagination: {
		pageIndex: 0,
		pageSize: 20
	},
	sort: []
};

type ACTION_TYPE =
	| { type: 'CHANGE_PAGE_NUMBER'; payload: { newIncomingPageNumberState: number } }
	| { type: 'CHANGE_SORT'; payload: { newIncomingSortState: SortingState } }
	| { type: 'CHANGE_ITEMS_PER_PAGE'; payload: { newNumberOfItemsPerPage: number } };

type APP_STATE = {
	pagination: PaginationState;
	sort: SortingState;
};

type AxiosResponse<TData> = {
	content: TData[];
	pageable: {
		size: number;
		number: number;
		sort: Object;
	};
	totalSize: number;
};
// may need GraphQL response type

type UseResourceParams<T> = {
	isQueryEnabled?: boolean;
	baseQueryKey: string;
	defaultValues?: {
		pagination: PaginationState;
		sort: SortingState;
	};
	initialData?: Resource<T>;
	url: string;
	accessToken?: string | null;
	refreshToken?: string | null;
	useClientSideSorting?: boolean;
	useClientSidePaging?: boolean;
	externalState?: {
		pagination: PaginationState;
		sort: SortingState;
	};
	type?: string;
	graphQLQuery?: any;
	graphQLVariables?: any
};

const reducer = (state: APP_STATE, action: ACTION_TYPE) => {
	switch (action.type) {
		case 'CHANGE_PAGE_NUMBER': {
			const { newIncomingPageNumberState } = action.payload;

			return {
				...state,
				pagination: {
					...state.pagination,
					pageIndex: newIncomingPageNumberState
				}
			};
		}

		case 'CHANGE_SORT': {
			const { newIncomingSortState } = action.payload;

			return {
				...state,
				sort: newIncomingSortState
			};
		}

		case 'CHANGE_ITEMS_PER_PAGE': {
			const { newNumberOfItemsPerPage } = action.payload;

			return {
				...state,
				pagination: {
					...state.pagination,
					pageSize: newNumberOfItemsPerPage,
					pageIndex: 0
				}
			};
		}

		default: {
			return { ...state };
		}
	}
};

const useResource = <T>({
	isQueryEnabled = false,
	baseQueryKey,
	defaultValues,
	initialData,
	url,
	accessToken = null,
	useClientSideSorting = false,
	useClientSidePaging = false,
	externalState,
	type,
	graphQLQuery,
	graphQLVariables
}: UseResourceParams<T> & { [key: string]: unknown }) => {
	// Used to update the useResource state e.g. page number, current sort, number of items per page etc
	const [state, dispatch] = React.useReducer(
		// Reducer for managing state
		reducer,

		// Inital state
		{
			// Copy the initial state, could contain additional values
			...INITIAL_STATE,

			pagination: {
				pageSize: defaultValues?.pagination.pageSize ?? INITIAL_STATE.pagination.pageSize,
				pageIndex: defaultValues?.pagination?.pageIndex ?? INITIAL_STATE.pagination.pageIndex
			},

			sort: defaultValues?.sort ?? INITIAL_STATE.sort
		},
		// A callback incase you want to do additional with the state or whatever
		(existingState) => ({ ...existingState })
	);

	// Creates the dependencies for the TanStack query, whenever these change a request will be performed.

	// This also needs GraphQL specific behaviour 
	// And fixing so that server side pagination actually works
	const dependencies = React.useMemo(
		() => ({
			// Page number (Pagination state)
			pageIndex:
				useClientSidePaging === true
					? state.pagination.pageIndex
					: externalState?.pagination?.pageIndex ?? INITIAL_STATE?.pagination.pageIndex,

			// Number of items per page  (Pagination state)
			pageSize:
				useClientSidePaging === true
					? state.pagination.pageSize
					: externalState?.pagination?.pageSize ?? INITIAL_STATE?.pagination.pageSize,

			// Current sort/s applied (Sorting state)
			sort: useClientSideSorting === true ? state.sort : externalState?.sort ?? INITIAL_STATE?.sort
		}),
		[
			externalState?.pagination?.pageIndex,
			externalState?.pagination?.pageSize,
			externalState?.sort,
			state.pagination.pageIndex,
			state.pagination.pageSize,
			state.sort,
			useClientSidePaging,
			useClientSideSorting
		]
	);

	// Generate the query key, this is exposed as you could use it for mutations to update the cache
	const generatedQueryKey: QueryKey = React.useMemo(
		() => [
			{
				// Base key e.g. "audits", "hostlmss" etc
				key: baseQueryKey,

				// Define the dependencies for the query
				// this is what breaks when we switch to useResource for all, as GQL doesn't have them
				dependencies: dependencies
			}
		],
		[baseQueryKey, dependencies]
	);

	// we probably want to split this into a rest function and a GQL function
	// set queryFn equal to either the REST or the GraphQL function, depending on type
		const details = {
		client_id: process.env.KEYCLOAK_CLIENT_ID!,
		client_secret: process.env.KEYCLOAK_SECRET!,
		grant_type: ['refresh_token'],
		// find how to get at the refresh token
		refresh_token: accessToken,
	  };
	  const formBody: string[] = [];
	  Object.entries(details).forEach(([key, value]: [string, any]) => {
		const encodedKey = encodeURIComponent(key);
		const encodedValue = encodeURIComponent(value);
		formBody.push(encodedKey + '=' + encodedValue);
	  });
	  const formData = formBody.join('&');
	  const refreshUrl = process.env.KEYCLOAK_REFRESH!;
	const refreshToken = async () => {
		// This is where we hit Keycloak for the refreshing of our access token
		const response = await axios.post(refreshUrl, formData, { headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'}})
		return response.data.access_token;
	  };
	  
	// This is an alternative mutation method for setting new access tokens. 
	//const queryClient = useQueryClient();
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

	const fetchGraphQLData:any = async () => {
		try {
		  let headers: AxiosRequestHeaders = {};
		  // queryClient.invalidateQueries([generatedQueryKey]);
	
		  if (accessToken !== null) {
			headers = {
			  ...headers,
			  Authorization: 'Bearer ' + accessToken
			};
		  }
			  const response = await axios.post(
			url,
			{ query: graphQLQuery, variables: graphQLVariables },
			{
			  headers: {
				Authorization: `Bearer ${accessToken}`, // Use the updated access token
				'Content-Type': 'application/json', // You can adjust the content type as needed
			  },
			}
		  );
		  if (response.status === 200) {
			if(baseQueryKey == "groups")
			{
				const responseData = response.data.data?.agencyGroups;
				console.log("Special groups response handling activated", responseData)
				return Promise.resolve(newGraphQLResource<T>(responseData));
			}
			const responseData = response.data.data;
			return Promise.resolve(newGraphQLResource<T>(responseData));
		  }
		  else if (response.status === 401)
			{
				// refresh access token method
				const newAccessToken = await refreshToken();
				console.log("401 encountered, new token is being generated.");
				// Update the accessToken variable with the new token
				accessToken = newAccessToken;
				// retry
				return fetchGraphQLData();
			} 
		else {
			console.log("Different kind of error")
			throw Error();
		
		}
		} catch {
			// If the above promise does not resolve
			console.log("Promise has not resolved");
		  	return Promise.reject(`Failed to perform a GraphQL request for ${generatedQueryKey.toString()}`);
		}
	  };

	  const fetchRestData = async () => {
		try {
		  let headers: AxiosRequestHeaders = {};
	
		  if (accessToken !== null) {
			headers = {
			  ...headers,
			  Authorization: 'Bearer ' + accessToken
			};
		  }
	
		  let requestUrl = url;
	
		  const response = await axios.get<AxiosResponse<T>>(requestUrl, {
			headers: { ...headers }
		  });
		  console.log("Response received", response, response.data.pageable);

	
		  if (response.status !== 200) {
			if(response.status === 401)
			{
				console.log("401");
				// refresh access token method
			}
			throw Error();
		  }
		  return Promise.resolve(newResource<T>(response.data.content, response.data.pageable, response.data.totalSize));
		} catch {
		  return Promise.reject(`Failed to perform a REST request for ${generatedQueryKey.toString()}`);
		}
	  };


	  const fetcher = type === 'GraphQL' ? fetchGraphQLData : fetchRestData;


	const { status, isRefetching, fetchStatus, data } = useQuery<
		ReturnType<typeof newGraphQLResource<T>>,
		Error
	>(
		{
		queryKey: generatedQueryKey,
		queryFn: fetcher,
		enabled: isQueryEnabled,
		initialData: initialData,
		keepPreviousData: true
	});

	return {
		// Return the actual data
		resource: data,

		// Return the key incase it's needed for a mutation
		queryKey: generatedQueryKey,

		// Status contains error or success
		status: status,

		// In TanStack query v4 the idle status is found in the fetchStatus, this will probably change in v5 or may not who knows but Typescript will let us know
		isIdle: fetchStatus === 'idle',

		// A small bool flag to indicate if a refetch is appearing, can happen automatically in the background
		isRefetching,

		// Contains both reducer state and rerived state
		// Derived state will always be available reguardless of the mode (externalData or not), so if your using externalData you can still read properties like totalNumberOfPages
		state: {
			// Copy any existing state, this is available reguardless of the mode, just don't use it when you rely on externalData
			...state,

			// Calculate the total number of pages available e.g. 1000/20 = 50 items per page
			// totalNumberOfPages: Math.ceil((data?.meta?.total ?? 0) / dependencies.pageSize)
		},
		dispatch
	};
};

export default useResource;


// 	LEGACY CODE TO BE REMOVED AFTER SERVER-SIDE PAGINATION CONFIRMED WORKING	
// queryFn: async () => {
		// 	try {
		// 		// Stores the requests headers
		// 		let headers: AxiosRequestHeaders = {};

		// 		// If available the accessToken is available append it to the Authorization Header
		// 		if (accessToken !== null) {
		// 			headers = {
		// 				...headers,
		// 				Authorization: 'Bearer ' + accessToken
		// 			};
		// 		}

		// 		// Includes the base url e.g. /audit, /hostlms
		// 		let requestUrl = url;

		// 		// TODO: Append the new data to the url to update the current resource being displayed
		// 		// NOTE: When appending the parameters read from the "dependencies" as that contains the data we need e.g. sorting or paging etc

		// 		// Perform the request and wait for the response to resolve

		// 		// Potentially needs to be altered for GraphQL - selection to send different requests
	
		// 		const response = await axios.get<AxiosResponse<T>>(requestUrl, {
		// 			headers: { ...headers }
		// 		});
	
		// 		console.log("RESPONSE", response)

		// 		// If the status isn't 200 then throw an error to put the query in rejected mode
		// 		if (response.status !== 200) {
		// 			throw Error();
		// 		}

		// 		// Return the data in the approproiate format
		// 		return Promise.resolve(
		// 			newResource<T>(response.data.content, response.data.pageable, response.data.totalSize)
		// 		);
		// 	} catch {
		// 		return Promise.reject(
		// 			`Failed to perform a fetch request for ${generatedQueryKey.toString()}`
		// 		);
		// 	}
		// },