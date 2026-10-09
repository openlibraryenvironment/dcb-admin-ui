// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import Loading from "./Loading";

/**
 * 45 routes and components swap their content for this while a query is in flight.
 *
 * Why a DOM test and not an e2e or an axe scan: no axe rule can tell that a status
 * change was never announced, and a loading state is by definition the frame a
 * passing e2e assertion has already waited past. docs/testing.md.
 */

afterEach(cleanup);

describe("Loading is announced", () => {
	it("puts the message in a polite live region", () => {
		render(<Loading title="Loading libraries" subtitle="Please wait" />);

		const status = screen.getByRole("status");
		expect(status).toHaveAttribute("aria-live", "polite");
		expect(status).toHaveTextContent("Loading libraries");
		expect(status).toHaveTextContent("Please wait");
	});

	it("hides the spinner from assistive technology", () => {
		// The text above IS the message. Left exposed, CircularProgress adds a
		// "progressbar" with no name in front of it.
		const { container } = render(
			<Loading title="Loading libraries" subtitle="Please wait" />,
		);

		expect(screen.queryByRole("progressbar")).toBeNull();
		expect(
			container.querySelector('[aria-hidden="true"].MuiCircularProgress-root'),
		).not.toBeNull();
	});
});
