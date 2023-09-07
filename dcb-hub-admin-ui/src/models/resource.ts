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