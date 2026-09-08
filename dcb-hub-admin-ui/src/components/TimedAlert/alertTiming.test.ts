import { describe, expect, it } from "vitest";
import {
	alertRole,
	resolveAutoHideDuration,
	shouldCloseOnReason,
} from "@components/TimedAlert/alertTiming";

describe("resolveAutoHideDuration", () => {
	it("never times out an error", () => {
		// An error is the only account the user gets of why their work did not
		// save, and server errors run to several lines. WCAG 2.2.1.
		expect(resolveAutoHideDuration("error", 6000)).toBeNull();
		expect(resolveAutoHideDuration("error", undefined)).toBeNull();
	});

	it("honours a requested duration for anything else", () => {
		expect(resolveAutoHideDuration("success", 6000)).toBe(6000);
		expect(resolveAutoHideDuration("info", 2000)).toBe(2000);
	});

	it("leaves an alert up when no duration was asked for", () => {
		expect(resolveAutoHideDuration("success", undefined)).toBeNull();
	});
});

describe("alertRole", () => {
	it("announces errors immediately", () => {
		expect(alertRole("error")).toBe("alert");
	});

	it("announces everything else politely", () => {
		expect(alertRole("success")).toBe("status");
		expect(alertRole(undefined)).toBe("status");
	});
});

describe("shouldCloseOnReason", () => {
	it("does not let a stray click discard an unread error", () => {
		expect(shouldCloseOnReason("error", "clickaway")).toBe(false);
	});

	it("still closes an error the user dismissed deliberately", () => {
		expect(shouldCloseOnReason("error", "escapeKeyDown")).toBe(true);
		expect(shouldCloseOnReason("error", undefined)).toBe(true);
	});

	it("closes a success on any reason", () => {
		expect(shouldCloseOnReason("success", "clickaway")).toBe(true);
		expect(shouldCloseOnReason("success", "timeout")).toBe(true);
	});
});
