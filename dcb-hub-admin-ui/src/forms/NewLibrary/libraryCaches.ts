import type { QueryClient } from "@tanstack/react-query";

import { LIBRARY_COUNT_QUERY_KEY } from "@/queryOptions/setup";

const LIBRARY_KEY_PREFIXES = [
	"library",
	"libraries",
	"librariesList",
	"agencies",
	"agency",
];

/**
 * Everything that mentions a library the wizard has just created or changed.
 *
 * The prefixes are the ones the entity registry sweeps. The setup flow's count is named
 * separately because its key starts with the operation name, which no prefix matches.
 */
export const invalidateLibraryCaches = (queryClient: QueryClient) =>
	Promise.all([
		queryClient.invalidateQueries({
			predicate: (query) => {
				const root = query.queryKey[0];
				return (
					typeof root === "string" &&
					LIBRARY_KEY_PREFIXES.some((prefix) => root.startsWith(prefix))
				);
			},
		}),
		queryClient.invalidateQueries({ queryKey: LIBRARY_COUNT_QUERY_KEY }),
	]);
