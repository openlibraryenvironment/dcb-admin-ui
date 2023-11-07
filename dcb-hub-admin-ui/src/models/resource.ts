export interface Resource<T> {
	content: T[];
	meta: {
		from: number;
		to: number;
		size: number;
		total: number;
		last_page: number;
		current_page: number;
		sort?: any;
	};
	totalSize: number;
}

// Also part of workaround - to be removed as part of server side pagination work
export interface NonPageableResource<T> {
	content: T[];
}

export interface GraphQLResource<T> {
	content: T[];
	meta: {};
}

export const newResource = <T>(content: T[], pageable: any, totalSize: number): Resource<T> => ({
	content: content,
	meta: {
		from: 1,
		to: totalSize,
		total: totalSize,
		size: pageable.size,
		last_page: Math.floor(totalSize / pageable.size + 1),
		current_page: 1 // (pageable.number)+1,
	},
	totalSize: totalSize
});

// To be made redundant by proper server-side pagination 
// Workaround as it's too complex to fix as part of this ticket
export const newNonPageableResource = <T>(content: T[]): NonPageableResource<T> => ({
	content: content,
});

// We've temporarily switched to using this UNTIL server-side pagination is working for both REST and GraphQL responses.
export const newGraphQLResource = <T>(content: T[]): GraphQLResource<T> => ({
	content: content,
	meta: {},
// 	meta: {
// 		from: 1,
// 		to: totalSize,
// 		total: totalSize,
// 		size: pageable.size,
// 		last_page: Math.floor(totalSize / pageable.size + 1),
// 		current_page: 1 // (pageable.number)+1,
// 	},
// 	totalSize: totalSize
// To be implemented when GraphQL requests support server side pagination - in the mean-time we have to use this workaround
});