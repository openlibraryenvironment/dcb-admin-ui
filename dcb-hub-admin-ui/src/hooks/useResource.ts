import { useQuery, QueryKey } from '@tanstack/react-query';
import axios, { AxiosRequestHeaders } from 'axios';
import { newGraphQLResource, newNonPageableResource, newResource, Resource } from '@models/resource';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { useMemo, useReducer } from 'react';
// This is the method of data fetching we use for the Admin UI application.
// It is a modified implementation of react-query's useQuery, and currently supports both GraphQL
// and REST requests. 


// To be removed in DCB-488 and superseded by Apollo GraphQL for data fetching. 
// This should massively simplify the process of data fetching and remove legacy code.
// It will also make the codebase more readable and improve debugging times.

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
	pageable?: {
		size: number;
		number: number;
		sort: Object;
	};
	totalSize: number;
};

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
	const [state, dispatch] = useReducer(
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
	const dependencies = useMemo(
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
	const generatedQueryKey: QueryKey = useMemo(
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

	  // We need to refresh token on 401 AND expiry
	const refreshToken = async () => {
		// This is where we hit Keycloak for the refreshing of our access token
		
		const response = await axios.post(refreshUrl, formData, { headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'}})
		return response.data.access_token;
	  };


	// Fetcher for GraphQL data

	const fetchGraphQLData:any = async () => {
		try {
		  let headers: AxiosRequestHeaders = {};
		  // console.log("The GraphQL fetcher has been called.")
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
				console.info("Special groups response handling activated", responseData)
				return Promise.resolve(newGraphQLResource<T>(responseData));
			}
			const responseData = response.data.data;
			return Promise.resolve(newGraphQLResource<T>(responseData));
		  }
		  else if (response.status === 401)
			{
				// refresh access token method
				const newAccessToken = await refreshToken();
				console.info("401 encountered, new token is being generated.");
				// Update the accessToken variable with the new token
				accessToken = newAccessToken;
				// retry
				return fetchGraphQLData();
			}
		} catch {
			// If the above promise does not resolve
			console.info("GraphQL: Promise has not resolved", accessToken);
		  	return Promise.reject(`Failed to perform a GraphQL request for ${generatedQueryKey.toString()}`);
		}
	  };

	  // Fetcher for REST endpoints.
	  const fetchRestData:any = async () => {
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
		  console.info("Response received", response, response.data.pageable);

	
		  if (response.status !== 200) {
			if(response.status === 401)
			{
				const newAccessToken = await refreshToken();
				console.info("401 encountered, new token is being generated.");
				// Update the accessToken variable with the new token
				accessToken = newAccessToken;
				// retry
				return fetchRestData();				
				// refresh access token method
			}
			throw Error();
		  }
		  if (response?.data?.pageable!=null)
		  {
			return Promise.resolve(newResource<T>(response.data.content, response.data.pageable, response.data.totalSize));
		  }
		  // @ts-ignore
		  else return Promise.resolve(newNonPageableResource<T>(response.data)); 	
		  // come back and fix this - Axios type weirdness needs to be investigated.
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

// We should consider deconstructing this further to make it more accessible.