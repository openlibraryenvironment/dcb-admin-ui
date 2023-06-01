import * as React from 'react';

import { useQuery, QueryKey } from '@tanstack/react-query';
import axios, { AxiosRequestHeaders } from 'axios';
import { newResource, Resource } from '@models/resource';
import { PaginationState, SortingState } from '@tanstack/react-table';

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
	useClientSideSorting?: boolean;
	useClientSidePaging?: boolean;
	externalState?: {
		pagination: PaginationState;
		sort: SortingState;
	};
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
	externalState
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

	// Creates the dependencies for the TanStack query, whenever these change a request will be performend.
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
				dependencies: dependencies
			}
		],
		[baseQueryKey, dependencies]
	);

	const { status, isRefetching, fetchStatus, data } = useQuery<
		ReturnType<typeof newResource<T>>,
		Error
	>({
		queryKey: generatedQueryKey,
		queryFn: async () => {
			try {
				// Stores the requests headers
				let headers: AxiosRequestHeaders = {};

				// If available the accessToken is available append it to the Authiruzation Header
				if (accessToken !== null) {
					headers = {
						...headers,
						Authorization: 'Bearer ' + accessToken
					};
				}

				// Includes the base url e.g. /audit, /hostlms
				let requestUrl = url;

				// TODO: Append the new data to the url to update the current resource being displayed
				// NOTE: When appending the parameters read from the "dependencies" as that contains the data we need e.g. sorting or paging etc

				// Perform the request and wait for the response to resolve
				const response = await axios.get<AxiosResponse<T>>(requestUrl, {
					headers: { ...headers }
				});

				// If the status isn't 200 then throw an error to put the query in rejected mode
				if (response.status !== 200) {
					throw Error();
				}

				// Return the data in the approproiate format
				return Promise.resolve(
					newResource<T>(response.data.content, response.data.pageable, response.data.totalSize)
				);
			} catch {
				return Promise.reject(
					`Failed to perform a fetch request for ${generatedQueryKey.toString()}`
				);
			}
		},
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
			totalNumberOfPages: Math.ceil((data?.meta?.total ?? 0) / dependencies.pageSize)
		},
		dispatch
	};
};

export default useResource;
