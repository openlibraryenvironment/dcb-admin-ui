import { describe, expect, it } from "vitest";

import { hostLmsAlarmsQuery } from "./hostLmsAlarms";

describe("hostLmsAlarmsQuery", () => {
	it("matches every alarm coded for the Host LMS", () => {
		expect(hostLmsAlarmsQuery("ALPHA")).toBe("code:ILS.ALPHA.*");
	});

	it("escapes what the query parser would read as syntax", () => {
		expect(hostLmsAlarmsQuery("a:b (test)")).toBe(
			String.raw`code:ILS.a\:b?\(test\).*`,
		);
	});
});
