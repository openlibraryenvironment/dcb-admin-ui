// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	muiXTelemetryEvents,
	muiXTelemetrySettings,
	sendMuiXTelemetryEvent,
} from "@mui/x-telemetry";

import { keepMuiXTelemetryOff } from "./muiXTelemetry";

const licenceCheck = () =>
	muiXTelemetryEvents.licenseVerification(
		{ licenseKey: "", xLicenseClientVersion: "test" },
		{
			packageName: "x-data-grid-premium",
			packageReleaseInfo: "test",
			licenseStatus: "NotFound",
		},
	);

afterEach(() => {
	vi.unstubAllGlobals();
});

// One file, in order: the telemetry setting is module state, cached on first read
describe("keepMuiXTelemetryOff", () => {
	it("is needed: outside production MUI X sends a licence check when collecting", async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal("fetch", fetch);
		muiXTelemetrySettings.enableTelemetry();

		await sendMuiXTelemetryEvent(licenceCheck());

		expect(fetch).toHaveBeenCalledWith(
			"https://x-telemetry.mui.com/v2/telemetry/record",
			expect.anything(),
		);
	});

	it("stops it", async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal("fetch", fetch);

		keepMuiXTelemetryOff();
		await sendMuiXTelemetryEvent(licenceCheck());

		expect(fetch).not.toHaveBeenCalled();
	});
});
