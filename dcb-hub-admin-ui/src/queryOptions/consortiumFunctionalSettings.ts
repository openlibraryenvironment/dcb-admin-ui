import { queryOptions } from "@tanstack/react-query";
import type { GraphQLClient } from "graphql-request";

import { getConsortiumFunctionalSettings } from "@queries/getConsortiumFunctionalSettings";
import type {
	LoadConsortiumFsQuery,
	LoadConsortiumFsQueryVariables,
} from "@generated/graphql";

export const consortiumFunctionalSettingsQuery = (gqlClient: GraphQLClient) =>
	queryOptions({
		queryKey: ["LoadConsortiumFunctionalSettings"],
		queryFn: () =>
			gqlClient.request<LoadConsortiumFsQuery, LoadConsortiumFsQueryVariables>(
				getConsortiumFunctionalSettings,
				{ order: "id", orderBy: "DESC" },
			),
	});

/** Whether a functional setting is on for the consortium; undefined while unknown. */
export const isFunctionalSettingEnabled = (
	data: LoadConsortiumFsQuery | undefined,
	name: string,
): boolean | undefined => {
	if (!data) return undefined;
	return (
		data.consortia?.content?.[0]?.functionalSettings?.some(
			(setting) => setting?.name === name && setting.enabled === true,
		) ?? false
	);
};
