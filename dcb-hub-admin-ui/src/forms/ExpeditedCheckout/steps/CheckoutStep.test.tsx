// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import { CheckoutStep } from "./CheckoutStep";

vi.mock("react-oidc-context", () => ({
	useAuth: () => ({ user: { profile: { roles: ["CONSORTIUM_ADMIN"] } } }),
}));

const t = ((key: string, options?: { dueDate?: string }) =>
	options?.dueDate ? `${key} ${options.dueDate}` : key) as unknown as TFunction;

const renderStep = (props: {
	checkoutCompleted: boolean;
	stepError: number | null;
}) =>
	render(
		<CheckoutStep
			{...props}
			dueDate="2026-11-14T10:00:00Z"
			handleViewRequest={() => {}}
			handleReadOnlyReturn={() => {}}
			t={t}
		/>,
	);

afterEach(cleanup);

describe("CheckoutStep", () => {
	it("announces the outcome, and names the progress bar with it", () => {
		renderStep({ checkoutCompleted: true, stepError: null });

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent(
			"requesting.expedited_checkout.steps.checkout_success",
		);
		expect(screen.getByRole("progressbar")).toHaveAccessibleName(
			status.textContent ?? "",
		);
	});

	it("announces a timeout", () => {
		renderStep({ checkoutCompleted: false, stepError: 2 });

		expect(screen.getByRole("status")).toHaveTextContent(
			"requesting.expedited_checkout.steps.checkout_failure",
		);
	});

	it("writes the due date in the application's language, not a fixed US format", () => {
		renderStep({ checkoutCompleted: true, stepError: null });

		const expected = new Intl.DateTimeFormat(
			i18n.resolvedLanguage ?? i18n.language,
			{ dateStyle: "full", timeStyle: "short" },
		).format(new Date("2026-11-14T10:00:00Z"));
		expect(screen.getByRole("status")).toHaveTextContent(expected);
		expect(screen.getByRole("status")).not.toHaveTextContent(
			"November 14, 2026",
		);
	});
});
