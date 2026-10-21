import { describe, expect, it } from "vitest";

import { durationSeconds, scheduledWorkFrom } from "./scheduledWork";

// The shape a running dcb-service returned on 2026-10-21
const INFO = {
	dcbNodes: {
		"9bebc860-4d2a-4a80-98ac-01197cd2ebc6": {
			name: "sleepy_driscoll",
			scheduledTasks: "true",
			nodeStart: "Mon Oct 19 16:02:39 UTC 2026",
			lastHeartbeat: "1792583884506",
		},
	},
	trackingStatus: { lastRunCount: 3, lastRunDuration: "PT3.2098726S" },
	harvest: { interval: "1m" },
	tracking: { interval: "5m" },
	dcb: { "sheduled-tasks": { enabled: true } },
};

describe("scheduledWorkFrom", () => {
	it("reads each node and the tracking run", () => {
		const work = scheduledWorkFrom(INFO);

		expect(work?.nodes).toEqual([
			{
				id: "9bebc860-4d2a-4a80-98ac-01197cd2ebc6",
				name: "sleepy_driscoll",
				runsScheduledWork: true,
				started: "Mon Oct 19 16:02:39 UTC 2026",
				lastHeartbeat: new Date(1792583884506).toISOString(),
			},
		]);
		expect(work?.scheduledWorkEnabled).toBe(true);
		expect(work?.trackingInterval).toBe("5m");
		expect(work?.trackingLastRunCount).toBe(3);
		expect(work?.trackingLastRunSeconds).toBe(3.2);
		expect(work?.harvestInterval).toBe("1m");
	});

	it("leaves out what an older dcb-service does not report", () => {
		const work = scheduledWorkFrom({ tracking: { interval: "5m" } });

		expect(work?.nodes).toEqual([]);
		expect(work?.trackingLastRunCount).toBeNull();
		expect(work?.scheduledWorkEnabled).toBeNull();
	});

	it.each([[null], ["text"], [[]]])("says nothing for %s", (info) => {
		expect(scheduledWorkFrom(info)).toBeNull();
	});
});

describe("durationSeconds", () => {
	it.each([
		["PT3.2098726S", 3.2],
		["PT1M5S", 65],
		["PT2H", 7200],
		["PT", null],
		["3 seconds", null],
		[undefined, null],
	])("reads %s as %s", (iso, seconds) => {
		expect(durationSeconds(iso)).toBe(seconds);
	});
});
