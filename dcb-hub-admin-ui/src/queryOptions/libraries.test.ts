import { describe, expect, it, vi } from "vitest";
import { GraphQLClient } from "graphql-request";

import {
	allLibrariesQuery,
	borrowingLibraryOptionsQuery,
	libraryOptionsQuery,
	toLibraryOption,
} from "@/queryOptions/libraries";

const client = {} as GraphQLClient;

const library = (overrides: any = {}) => ({
	id: "lib-1",
	fullName: "Test Library",
	agencyCode: "TEST",
	agency: {
		id: "agency-1",
		hostLms: { code: "TEST-HOST" },
		isBorrowingAgency: true,
		...overrides.agency,
	},
	membership: [
		{
			libraryGroup: {
				type: "CONSORTIUM",
				consortium: {
					functionalSettings: [{ name: "PICKUP_ANYWHERE", enabled: true }],
				},
			},
		},
	],
	...overrides,
});

const asData = (libraries: any[]) => ({ libraries: { content: libraries } });

describe("toLibraryOption", () => {
	it("maps a library to the shape every dropdown uses", () => {
		expect(toLibraryOption(library())).toEqual({
			label: "Test Library",
			value: "TEST",
			id: "lib-1",
			agencyId: "agency-1",
			hostLmsCode: "TEST-HOST",
			functionalSettings: [{ name: "PICKUP_ANYWHERE", enabled: true }],
		});
	});

	it("includes hostLmsCode for every consumer", () => {
		// StaffRequest used to build a second array from the same data purely to
		// add this field; both pickers now read one mapping.
		expect(toLibraryOption(library()).hostLmsCode).toBe("TEST-HOST");
	});

	it("survives a library with no agency or consortium membership", () => {
		const option = toLibraryOption({
			id: "lib-2",
			fullName: "Bare",
			agencyCode: "BARE",
		});
		expect(option.label).toBe("Bare");
		expect(option.agencyId).toBeUndefined();
		expect(option.functionalSettings).toBeUndefined();
	});
});

describe("allLibrariesQuery", () => {
	it("uses one cache key for every consumer", () => {
		expect(allLibrariesQuery(client).queryKey).toEqual(["libraries", "all"]);
	});

	it("requests the whole list, unfiltered and name-ordered", async () => {
		const request = vi.fn().mockResolvedValue(asData([]));
		await (allLibrariesQuery({ request } as any).queryFn as any)();
		expect(request).toHaveBeenCalledWith(expect.anything(), {
			query: "",
			pageno: 0,
			pagesize: 1000,
			order: "fullName",
			orderBy: "ASC",
		});
	});
});

describe("libraryOptionsQuery", () => {
	it("returns every library, borrowing or not", () => {
		const select = libraryOptionsQuery(client).select!;
		const options = select(
			asData([
				library({ agency: { isBorrowingAgency: true } }),
				library({ id: "l2", agency: { isBorrowingAgency: false } }),
				library({ id: "l3", agency: { isBorrowingAgency: null } }),
			]),
		);
		expect(options).toHaveLength(3);
	});

	it("returns an empty list rather than throwing on an empty response", () => {
		const select = libraryOptionsQuery(client).select!;
		expect(select(undefined)).toEqual([]);
		expect(select({})).toEqual([]);
	});
});

describe("borrowingLibraryOptionsQuery", () => {
	const select = borrowingLibraryOptionsQuery(client).select!;

	it("shares the cache entry with the unfiltered query", () => {
		// Same key: one network request feeds both dropdowns.
		expect(borrowingLibraryOptionsQuery(client).queryKey).toEqual(
			allLibrariesQuery(client).queryKey,
		);
	});

	it("keeps libraries whose agency can borrow", () => {
		const options = select(
			asData([library({ agency: { isBorrowingAgency: true } })]),
		);
		expect(options.map((option: any) => option.value)).toEqual(["TEST"]);
	});

	it("excludes libraries whose agency cannot borrow", () => {
		const options = select(
			asData([library({ agency: { isBorrowingAgency: false } })]),
		);
		expect(options).toEqual([]);
	});

	it("excludes agencies where borrowing has not been configured", () => {
		// `=== true`, not `!== false`: an agency nobody has set up has not been
		// cleared to borrow, and offering it only produces a request the backend
		// will refuse.
		expect(
			select(asData([library({ agency: { isBorrowingAgency: null } })])),
		).toEqual([]);
		expect(
			select(asData([library({ agency: { isBorrowingAgency: undefined } })])),
		).toEqual([]);
	});

	it("excludes libraries with no agency at all", () => {
		expect(
			select(asData([{ id: "x", fullName: "No agency", agencyCode: "X" }])),
		).toEqual([]);
	});

	it("filters before mapping, so the options are the surviving libraries", () => {
		const options = select(
			asData([
				library({ id: "a", fullName: "Can borrow" }),
				library({
					id: "b",
					fullName: "Cannot borrow",
					agencyCode: "NOPE",
					agency: { isBorrowingAgency: false },
				}),
			]),
		);
		expect(options.map((option: any) => option.label)).toEqual(["Can borrow"]);
	});
});
