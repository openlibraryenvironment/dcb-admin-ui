import { describe, it, expect } from "vitest";

import { readConsortiumPresence } from "./consortium";
import { getConsortiumBasics } from "@queries/getConsortiumBasics";

const answered = (data: any) => ({ data, isPending: false, isError: false });

describe("readConsortiumPresence", () => {
	it("reports a consortium and its group when one exists", () => {
		const presence = readConsortiumPresence(
			answered({
				consortia: {
					content: [
						{ id: "c1", displayName: "Example", libraryGroup: { id: "g1" } },
					],
				},
			}),
		);

		expect(presence.hasConsortium).toBe(true);
		expect(presence.consortiumGroup).toEqual({ id: "g1" });
	});

	it("reports no consortium on an empty answer", () => {
		expect(
			readConsortiumPresence(answered({ consortia: { content: [] } }))
				.hasConsortium,
		).toBe(false);
	});

	describe("does not mistake an unanswered question for an empty instance", () => {
		it("stays undefined while the query is in flight", () => {
			expect(
				readConsortiumPresence({
					data: undefined,
					isPending: true,
					isError: false,
				}).hasConsortium,
			).toBeUndefined();
		});

		it("stays undefined when the query failed", () => {
			// The regression: a GraphQL non-null violation nulled the whole
			// response, `data` arrived undefined, and every page that asks this
			// told an already-configured instance to go and create a consortium.
			expect(
				readConsortiumPresence({
					data: undefined,
					isPending: false,
					isError: true,
				}).hasConsortium,
			).toBeUndefined();
		});

		it("stays undefined when a failure leaves stale data behind", () => {
			// react-query keeps the last good data on a background refetch that
			// errors; the error still has to win, because we cannot tell how old
			// that data is.
			expect(
				readConsortiumPresence({
					data: { consortia: { content: [{ id: "c1" }] } },
					isPending: false,
					isError: true,
				}).hasConsortium,
			).toBeUndefined();
		});
	});

	it("tolerates a consortium with no library group", () => {
		const presence = readConsortiumPresence(
			answered({ consortia: { content: [{ id: "c1" }] } }),
		);

		expect(presence.hasConsortium).toBe(true);
		expect(presence.consortiumGroup).toBeNull();
	});
});

describe("getConsortiumBasics", () => {
	it("asks for nothing on libraryGroup but its id", () => {
		// getConsortiaDataFetcher does not join the association, so name, code
		// and type come back null - and they are String! in the schema, which
		// nulls the entire response rather than just the field.
		const libraryGroupSelection = getConsortiumBasics
			.replace(/#[^\n]*/g, "")
			.match(/libraryGroup\s*{([^}]*)}/)?.[1];

		expect(libraryGroupSelection).toBeDefined();
		expect(
			(libraryGroupSelection as string)
				.split(/\s+/)
				.filter((token) => token.length > 0),
		).toEqual(["id"]);
	});
});
