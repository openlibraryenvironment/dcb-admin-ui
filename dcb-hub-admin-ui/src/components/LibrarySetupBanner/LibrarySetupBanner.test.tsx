// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { LibrarySetupCounts } from "@helpers/librarySetup";
import LibrarySetupBanner from "./LibrarySetupBanner";

const fetchCounts = vi.fn<() => Promise<LibrarySetupCounts>>();

vi.mock("@hooks/useGraphQLClient", () => ({ useGraphQLClient: () => ({}) }));
// A router link needs a router; what matters here is where it points
vi.mock("@components/CustomLink/CustomLink", () => ({
	CustomLinkButton: ({ children, params }: any) => (
		<a href={`#/libraries/${params.libraryId}/setup/${params.step}`}>
			{children}
		</a>
	),
}));
vi.mock("@/queryOptions/librarySetup", () => ({
	librarySetupCountsQuery: () => ({
		queryKey: ["library", "setupCounts", "lib-1"],
		queryFn: fetchCounts,
		retry: false,
		throwOnError: false,
	}),
}));

afterEach(() => {
	cleanup();
	fetchCounts.mockReset();
});

const library = {
	id: "lib-1",
	fullName: "Example Library",
	shortName: "Example",
	abbreviatedName: "EX",
	address: "1 Example Street",
	type: "Academic",
	agencyCode: "ex",
	latitude: 36.1,
	longitude: -97.1,
	contacts: [{ id: "c-1" }],
	membership: [{ libraryGroup: { id: "g-1" } }],
	agency: {
		hostLms: {
			id: "h-1",
			code: "EXAMPLE",
			lmsClientClass:
				"org.olf.dcb.core.interaction.folio.ConsortialFolioHostLmsClient",
		},
	},
};

const everythingCounted: LibrarySetupCounts = {
	itemTypeMappingCount: 1,
	patronTypeMappingCount: 1,
	locationMappingCount: 1,
	pickupLocationCount: 1,
	numericRangeMappingCount: null,
};

const renderBanner = (client = new QueryClient()) =>
	render(
		<QueryClientProvider client={client}>
			<LibrarySetupBanner library={library} canEdit />
		</QueryClientProvider>,
	);

// Uninitialised i18n renders the key, which is what these assert on
describe("LibrarySetupBanner", () => {
	it("says setup is complete for a library with nothing outstanding", async () => {
		fetchCounts.mockResolvedValue(everythingCounted);
		renderBanner();

		expect(
			await screen.findByText("libraries.setup.complete_title"),
		).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveTextContent(
			"libraries.setup.complete_body",
		);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("says what is outstanding for an incomplete library", async () => {
		fetchCounts.mockResolvedValue({
			...everythingCounted,
			pickupLocationCount: 0,
		});
		renderBanner();

		expect(
			await screen.findByText("libraries.setup.incomplete_title"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("libraries.setup.complete_title"),
		).not.toBeInTheDocument();
	});

	it("links to the first chapter still outstanding", async () => {
		fetchCounts.mockResolvedValue({
			...everythingCounted,
			pickupLocationCount: 0,
		});
		renderBanner();

		expect(
			await screen.findByRole("link", { name: "libraries.setup.finish" }),
		).toHaveAttribute("href", "#/libraries/lib-1/setup/locations");
	});

	it("claims neither when the counts could not be fetched", async () => {
		fetchCounts.mockRejectedValue(new Error("network"));
		const client = new QueryClient();
		renderBanner(client);

		await vi.waitFor(() =>
			expect(
				client.getQueryState(["library", "setupCounts", "lib-1"])?.status,
			).toBe("error"),
		);

		expect(
			screen.queryByText("libraries.setup.incomplete_title"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("libraries.setup.complete_title"),
		).not.toBeInTheDocument();
	});
});
