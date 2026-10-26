// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import OnboardingStats from "./OnboardingStats";

afterEach(cleanup);

const library = (lmsClientClass: string, isComplete: boolean) => ({
	agency: { hostLms: { lmsClientClass } },
	setup: { isComplete },
});

describe("OnboardingStats", () => {
	it("holds its place while loading, so the grid below it does not move", () => {
		const { container } = render(<OnboardingStats libraries={[]} loading />);

		expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
		const tiles = container.querySelector("[aria-hidden='true']");
		expect(tiles?.children).toHaveLength(3);
	});

	it("shows no numbers while loading", () => {
		const { container } = render(<OnboardingStats libraries={[]} loading />);

		expect(container).not.toHaveTextContent(/\d/);
	});

	it("renders nothing for a consortium with no libraries", () => {
		const { container } = render(<OnboardingStats libraries={[]} />);

		expect(container).toBeEmptyDOMElement();
	});

	it("exposes the counts once loaded", () => {
		const { container } = render(
			<OnboardingStats
				libraries={[
					library("org.olf.dcb.core.interaction.sierra.SierraLmsClient", true),
					library("org.olf.dcb.core.interaction.sierra.SierraLmsClient", false),
				]}
			/>,
		);

		expect(container.querySelector("[aria-hidden='true']")).toBeNull();
		expect(screen.getAllByText("2").length).toBeGreaterThan(0);
	});
});
