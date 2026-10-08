// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({ navigate }),
}));

const { default: ErrorPanel } = await import("./Error");

/**
 * The error page every failed route and every failed detail query renders.
 *
 * `useRouter` is mocked rather than wrapped in a real RouterProvider: what is being
 * pinned is the announcement and which button does what, neither of which needs a
 * route tree. fireEvent rather than user-event, which is not a dependency here and is
 * not worth becoming one for a button click. docs/testing.md.
 */

afterEach(() => {
	cleanup();
	navigate.mockClear();
});

const props = {
	title: "500 Server error",
	message: "This doesn't seem to be working at the moment",
	action: "Try again",
};

describe("the error page is announced", () => {
	it("is an alert, so a reader is told the thing did not happen", () => {
		render(<ErrorPanel {...props} />);
		expect(screen.getByRole("alert")).toHaveTextContent("500 Server error");
	});
});

describe("the primary button", () => {
	it("runs onAction when one is given", () => {
		const onAction = vi.fn();
		render(<ErrorPanel {...props} onAction={onAction} />);

		fireEvent.click(screen.getByRole("button", { name: "Try again" }));

		expect(onAction).toHaveBeenCalledOnce();
		expect(navigate).not.toHaveBeenCalled();
	});

	it("navigates to goBack when there is no onAction", () => {
		render(<ErrorPanel {...props} action="Go back" goBack="/libraries" />);

		fireEvent.click(screen.getByRole("button", { name: "Go back" }));

		expect(navigate).toHaveBeenCalledWith({ to: "/libraries" });
	});

	it("falls back to the home page when neither is given", () => {
		render(<ErrorPanel {...props} action="Go back" />);
		fireEvent.click(screen.getByRole("button", { name: "Go back" }));
		expect(navigate).toHaveBeenCalledWith({ to: "/" });
	});
});

describe("the secondary button", () => {
	it("is absent unless asked for, so every other caller keeps one action", () => {
		render(<ErrorPanel {...props} onAction={() => {}} />);
		expect(screen.getAllByRole("button")).toHaveLength(1);
	});

	it("runs its own handler, leaving the primary one alone", () => {
		const onAction = vi.fn();
		const onSecondary = vi.fn();
		render(
			<ErrorPanel
				{...props}
				onAction={onAction}
				secondary={{ label: "Go back", onClick: onSecondary }}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Go back" }));

		expect(onSecondary).toHaveBeenCalledOnce();
		expect(onAction).not.toHaveBeenCalled();
	});
});
