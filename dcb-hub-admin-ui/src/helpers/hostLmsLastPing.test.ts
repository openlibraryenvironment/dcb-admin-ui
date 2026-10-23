import { describe, expect, it } from "vitest";

import { lastPingView } from "./hostLmsLastPing";

describe("lastPingView", () => {
	it("reads a successful check", () => {
		expect(
			lastPingView({
				status: "OK",
				checkedAt: "2026-10-21T09:00:00Z",
				lastOkAt: "2026-10-21T09:00:00Z",
				versionInfo: "Sierra 6.2",
				pingMillis: 412,
			}),
		).toEqual({
			state: "ok",
			severity: "success",
			checkedAt: "2026-10-21T09:00:00Z",
			lastOkAt: "2026-10-21T09:00:00Z",
			versionInfo: "Sierra 6.2",
			pingMillis: 412,
		});
	});

	it.each([
		["REFUSED", "refused", "error"],
		["MISCONFIGURED", "misconfigured", "error"],
		["UNREACHABLE", "unreachable", "warning"],
		["FAILING", "failing", "warning"],
		["UNKNOWN", "unknown", "warning"],
		["SOMETHING_NEW", "unknown", "warning"],
	])("reads an ERROR with failure %s as %s", (failure, state, severity) => {
		const view = lastPingView({
			status: "ERROR",
			failure,
			checkedAt: "2026-10-21T09:00:00Z",
			lastOkAt: "2026-10-01T09:00:00Z",
		});

		expect(view?.state).toBe(state);
		expect(view?.severity).toBe(severity);
		expect(view?.lastOkAt).toBe("2026-10-01T09:00:00Z");
	});

	it.each([[null], [undefined], [{}], ["not an object"]])(
		"says nothing for a Host LMS never checked: %s",
		(lastPing) => {
			expect(lastPingView(lastPing)).toBeNull();
		},
	);

	it("leaves out values the check did not record", () => {
		const view = lastPingView({ status: "ERROR", failure: "REFUSED" });

		expect(view?.checkedAt).toBeNull();
		expect(view?.lastOkAt).toBeNull();
		expect(view?.versionInfo).toBeNull();
		expect(view?.pingMillis).toBeNull();
	});
});
