import { describe, expect, it } from "vitest";
import {
	describeGraphQLError,
	graphQLErrorsIn,
	graphQLErrorsOf,
	partitionGraphQLErrors,
} from "@helpers/graphQLErrors";

/** What graphql-request actually throws: a serialised exchange as `message`. */
const clientError = (messages: string[], paths?: (string | number)[][]) => {
	const errors = messages.map((message, index) => ({
		message,
		...(paths?.[index] ? { path: paths[index] } : {}),
	}));
	const error: any = new Error(
		`GraphQL Error (Code: 200): ${JSON.stringify({
			response: { errors, status: 200, headers: {} },
			request: { query: "mutation CreateLibrary ..." },
		})}`,
	);
	error.response = { errors, status: 200 };
	error.request = { query: "mutation CreateLibrary ..." };
	return error;
};

describe("graphQLErrorsOf", () => {
	it("pulls out every error the server reported", () => {
		expect(graphQLErrorsOf(clientError(["a", "b"]))).toHaveLength(2);
	});

	it("returns nothing for a non-GraphQL failure", () => {
		expect(graphQLErrorsOf(new Error("Failed to fetch"))).toEqual([]);
		expect(graphQLErrorsOf(undefined)).toEqual([]);
		expect(graphQLErrorsOf("boom")).toEqual([]);
	});
});

describe("graphQLErrorsIn", () => {
	it("finds errors on a resolved response", () => {
		// 200 + { data: null, errors: [...] } does not throw, so the success path
		// has to look too.
		expect(
			graphQLErrorsIn({ data: null, errors: [{ message: "nope" }] }),
		).toHaveLength(1);
	});

	it("finds nothing on a clean response", () => {
		expect(graphQLErrorsIn({ data: { createLibrary: { id: "1" } } })).toEqual(
			[],
		);
		expect(graphQLErrorsIn(null)).toEqual([]);
	});
});

describe("describeGraphQLError", () => {
	it("shows the server's message, not the serialised exchange", () => {
		const error = clientError(["Please provide a valid Host LMS code."]);
		expect(describeGraphQLError(error, "fallback")).toBe(
			"Please provide a valid Host LMS code.",
		);
	});

	it("never leaks the request document into the UI", () => {
		const error = clientError(["Invalid role: 'x'."]);
		const described = describeGraphQLError(error, "fallback");
		expect(described).not.toContain("mutation CreateLibrary");
		expect(described).not.toContain('"response"');
	});

	it("reports every problem, not just the first", () => {
		// The old `error.message` path showed one blob; a library rejected for
		// two reasons has to name both or the user fixes one and resubmits.
		const error = clientError(["Bad agency code", "Invalid role: 'x'."]);
		expect(describeGraphQLError(error, "fallback")).toBe(
			"Bad agency code\nInvalid role: 'x'.",
		);
	});

	it("keeps a plain error's own message", () => {
		expect(describeGraphQLError(new Error("Failed to fetch"), "fallback")).toBe(
			"Failed to fetch",
		);
	});

	it("falls back when there is nothing usable to say", () => {
		expect(describeGraphQLError(undefined, "Something went wrong")).toBe(
			"Something went wrong",
		);
		expect(describeGraphQLError({}, "Something went wrong")).toBe(
			"Something went wrong",
		);
	});

	it("falls back rather than showing a ClientError with no errors array", () => {
		const error: any = new Error(
			'GraphQL Error (Code: 500): {"response":{"status":500}}',
		);
		expect(describeGraphQLError(error, "Something went wrong")).toBe(
			"Something went wrong",
		);
	});
});

describe("partitionGraphQLErrors", () => {
	const fieldForPath = (path: (string | number)[]) => {
		if (path[1] === "contacts" && typeof path[2] === "number") {
			return `contacts.${path[2]}.${path[3]}`;
		}
		if (path[1] === "agencyCode") return "agencyCode";
		return undefined;
	};

	it("attaches an error to the field the server named", () => {
		const error = clientError(
			["Invalid role: 'x'."],
			[["createLibrary", "contacts", 0, "role"]],
		);
		expect(partitionGraphQLErrors(error, fieldForPath)).toEqual({
			fieldErrors: [
				{ field: "contacts.0.role", message: "Invalid role: 'x'." },
			],
			unattached: [],
		});
	});

	it("keeps errors it cannot place, rather than dropping them", () => {
		// Silently discarding an unmapped error is worse than a generic toast:
		// the submission failed and the user would be told nothing.
		const error = clientError(
			["Access denied: you do not have the required role."],
			[["createLibrary"]],
		);
		expect(partitionGraphQLErrors(error, fieldForPath)).toEqual({
			fieldErrors: [],
			unattached: ["Access denied: you do not have the required role."],
		});
	});

	it("handles a mix of placed and unplaced errors", () => {
		const error = clientError(
			["Bad agency", "Server exploded"],
			[["createLibrary", "agencyCode"], ["createLibrary"]],
		);
		const { fieldErrors, unattached } = partitionGraphQLErrors(
			error,
			fieldForPath,
		);
		expect(fieldErrors).toEqual([
			{ field: "agencyCode", message: "Bad agency" },
		]);
		expect(unattached).toEqual(["Server exploded"]);
	});

	it("treats a pathless error as unattached", () => {
		const error = clientError(["No path here"]);
		expect(partitionGraphQLErrors(error, fieldForPath).unattached).toEqual([
			"No path here",
		]);
	});
});
