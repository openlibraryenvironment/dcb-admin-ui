// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

import "@/i18n";
import { ALL_FEATURE_FLAGS } from "@constants/serviceCapabilities";

const service = vi.hoisted(() => ({ version: "9.2.0" as string | null }));
vi.mock("@hooks/useDCBServiceInfo", () => ({
	default: () => ({ version: service.version }),
}));

const { default: ServiceCapabilities } = await import("./ServiceCapabilities");

/** Every flag set, so a developer's own .env cannot decide a row. */
const switchedOn = (...on: string[]) => {
	window.__APP_ENV__ = Object.fromEntries(
		ALL_FEATURE_FLAGS.map((flag) => [flag, String(on.includes(flag))]),
	) as Window["__APP_ENV__"];
};

const row = (feature: string) =>
	screen.getByRole("rowheader", { name: feature }).closest("tr")!;

afterEach(() => {
	cleanup();
	window.__APP_ENV__ = undefined;
});

describe("Feature availability", () => {
	it("lists the features staff are told about, Insights once", () => {
		switchedOn();
		render(<ServiceCapabilities />);

		expect(
			screen.getAllByRole("rowheader").map((cell) => cell.textContent),
		).toEqual([
			"Consortium branding",
			"DCB NCIP onboarding",
			"Insights",
			"Guarded clean up",
			"Maximum local holds per agency",
			"Consortium patron support link",
			"Host LMS checks, the last connection check and ingest counts for chosen libraries",
			"Patron announcements",
			"Request tags",
			"Request notes",
		]);
	});

	it("says Insights needs 9.2.0, and shows both of its switches", () => {
		switchedOn("VITE_FEATURE_INSIGHTS");
		render(<ServiceCapabilities />);

		const insights = within(row("Insights"));
		expect(
			insights.getByText("dcb-service 9.2.0 or later"),
		).toBeInTheDocument();
		expect(row("Insights")).toHaveTextContent(
			"VITE_FEATURE_INSIGHTS: onVITE_FEATURE_INSIGHTS_TRENDS: off",
		);
	});

	it("on 9.1.0, calls Insights switched on too early and names the switch to turn off", () => {
		service.version = "9.1.0";
		switchedOn("VITE_FEATURE_INSIGHTS");
		render(<ServiceCapabilities />);

		expect(row("Insights")).toHaveTextContent(
			"Switched on, but this dcb-service is too old",
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Insights is switched on, but this dcb-service does not serve it. Set VITE_FEATURE_INSIGHTS=false until the service is upgraded.",
		);
	});

	it("on 9.2.0, calls Insights available until both switches are on, and names the ones still off", () => {
		service.version = "9.2.0";
		switchedOn("VITE_FEATURE_INSIGHTS");
		render(<ServiceCapabilities />);

		expect(row("Insights")).toHaveTextContent(
			"Available - not switched on yet",
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Set VITE_FEATURE_INSIGHTS_TRENDS=true to switch it on.",
		);
	});

	it("is ready once both Insights switches are on", () => {
		service.version = "9.2.0";
		switchedOn("VITE_FEATURE_INSIGHTS", "VITE_FEATURE_INSIGHTS_TRENDS");
		render(<ServiceCapabilities />);

		expect(row("Insights")).toHaveTextContent(
			"On, and served by this dcb-service",
		);
	});
});
