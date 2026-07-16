import { describe, expect, it } from "vitest";
import { stripBrackets } from "./stripBrackets";

describe("stripBrackets", () => {
	it("unwraps a bracketed barcode", () => {
		expect(stripBrackets("[26060]")).toBe("26060");
	});

	it("leaves a plain barcode alone", () => {
		expect(stripBrackets("26060")).toBe("26060");
	});

	it("produces a value the request forms will accept", () => {
		// StaffRequest/ExpeditedCheckout reject any value containing a bracket, so
		// this is the property that actually matters at the paste site.
		const copied = stripBrackets("[26060]");
		expect(copied.includes("[")).toBe(false);
		expect(copied.includes("]")).toBe(false);
	});

	it("removes brackets that are not a wrapping pair", () => {
		expect(stripBrackets("[26060")).toBe("26060");
		expect(stripBrackets("26060]")).toBe("26060");
	});

	it("keeps the separator for a multi-barcode list", () => {
		expect(stripBrackets("[26060, 26061]")).toBe("26060, 26061");
	});

	it("trims the whitespace unwrapping can leave behind", () => {
		expect(stripBrackets("[ 26060 ]")).toBe("26060");
		expect(stripBrackets("  26060  ")).toBe("26060");
	});

	it("returns an empty string when there is nothing but brackets", () => {
		expect(stripBrackets("[]")).toBe("");
		expect(stripBrackets("")).toBe("");
	});
});
