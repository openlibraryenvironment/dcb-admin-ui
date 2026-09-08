/**
 * Turning a GraphQL failure into something a user can act on.
 *
 * graphql-request throws a `ClientError` whose `.message` is the whole
 * exchange serialised - the errors array, the status, the headers AND the
 * request document. Anything that renders `error.message` shows the user a
 * JSON dump, which is what every form in this app currently does.
 *
 * A GraphQL response can also carry SEVERAL errors, and a 200 response with a
 * populated `errors` array is a failure that never throws at all, so code that
 * only handles the throw path can report success for a request the server
 * rejected.
 */

export interface GraphQLErrorEntry {
	message: string;
	path?: (string | number)[];
	extensions?: Record<string, any>;
}

const isRecord = (value: unknown): value is Record<string, any> =>
	typeof value === "object" && value !== null;

/**
 * Every error the server reported, in order. Empty when the failure was not a
 * GraphQL one (network, abort, thrown TypeError...).
 */
export const graphQLErrorsOf = (error: unknown): GraphQLErrorEntry[] => {
	if (!isRecord(error)) return [];
	const errors = error.response?.errors;
	return Array.isArray(errors) ? errors : [];
};

/**
 * The same, for a successful-looking response body. A GraphQL server answers
 * 200 with `{ data: null, errors: [...] }`, and graphql-request only throws
 * when `data` is absent - so a partial response resolves normally with errors
 * attached. Check this on the success path too.
 */
export const graphQLErrorsIn = (response: unknown): GraphQLErrorEntry[] => {
	if (!isRecord(response)) return [];
	return Array.isArray(response.errors) ? response.errors : [];
};

/**
 * One line per problem, in the server's own words. dcb-service's messages are
 * written for humans ("Invalid role: 'x'. The roles currently available
 * are: ...", "Please provide a valid Host LMS code."), so they are worth
 * showing verbatim; the fallback exists for the failures that are not.
 */
export const describeGraphQLError = (
	error: unknown,
	fallback: string,
): string => {
	const errors = graphQLErrorsOf(error);
	if (errors.length > 0) {
		return errors.map((entry) => entry.message).join("\n");
	}

	// A network failure has a usable message; a ClientError does not, because
	// its message is the serialised exchange.
	if (isRecord(error) && typeof error.message === "string") {
		const looksSerialised =
			error.message.includes('"response"') ||
			error.message.startsWith("GraphQL Error");
		if (!looksSerialised) return error.message;
	}

	return fallback;
};

/**
 * Maps server errors onto form fields where the server said which field it
 * meant, so they land under the input instead of in a toast the user has to
 * remember while scrolling.
 *
 * `path` is the GraphQL response path (["createLibrary", "contacts", 0,
 * "role"]); `fieldForPath` translates that into a react-hook-form field name,
 * because only the caller knows its own form's shape. Errors with no usable
 * path are returned under `unattached` for the caller to show at form level -
 * they must not be dropped.
 */
export const partitionGraphQLErrors = (
	error: unknown,
	fieldForPath: (path: (string | number)[]) => string | undefined,
): {
	fieldErrors: { field: string; message: string }[];
	unattached: string[];
} => {
	const fieldErrors: { field: string; message: string }[] = [];
	const unattached: string[] = [];

	for (const entry of graphQLErrorsOf(error)) {
		const field = entry.path ? fieldForPath(entry.path) : undefined;
		if (field) fieldErrors.push({ field, message: entry.message });
		else unattached.push(entry.message);
	}

	return { fieldErrors, unattached };
};
