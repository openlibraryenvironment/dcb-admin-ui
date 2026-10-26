import type { GraphQLClient } from "graphql-request";

import { getLibraries } from "@queries/getLibraries";
import { welcomeLibrariesView } from "@constants/dataGrid/gridViews";
import { serverGridQuery, type GridQueryModels } from "./serverGrid";

/** The home page's libraries list, for the route's loader and the grid alike. */
export const welcomeLibrariesQuery = (
	gqlClient: GraphQLClient,
	models: GridQueryModels,
) =>
	serverGridQuery(gqlClient, {
		// Its own edits invalidate ["LoadLibraries"]
		root: "LoadLibraries",
		gridId: welcomeLibrariesView.id,
		document: getLibraries,
		defaultOrder: "fullName",
		defaultPageSize: welcomeLibrariesView.defaultPageSize,
		...models,
	});
