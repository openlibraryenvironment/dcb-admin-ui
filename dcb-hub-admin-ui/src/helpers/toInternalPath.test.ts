import { describe, it, expect } from "vitest";
import { toInternalPath } from "./appBase";

describe("toInternalPath", () => {
	it("keeps ordinary in-app paths, including hyphens and query strings", () => {
		expect(toInternalPath("/libraries")).toBe("/libraries");
		expect(toInternalPath("/patronRequests/out-of-sequence")).toBe(
			"/patronRequests/out-of-sequence",
		);
		expect(toInternalPath("/libraries?page=2&sort=name")).toBe(
			"/libraries?page=2&sort=name",
		);
		expect(toInternalPath("/")).toBe("/");
	});

	it("rejects absolute URLs", () => {
		expect(toInternalPath("https://evil.example/x")).toBeUndefined();
		expect(toInternalPath("http://evil.example")).toBeUndefined();
		expect(toInternalPath("javascript:alert(1)")).toBeUndefined();
	});

	it("rejects protocol-relative and backslash-smuggled hosts", () => {
		// The two that actually escape the origin while looking like a path.
		expect(toInternalPath("//evil.example")).toBeUndefined();
		expect(toInternalPath("/\\evil.example")).toBeUndefined();
		expect(toInternalPath("///evil.example")).toBeUndefined();
	});

	it("rejects values carrying whitespace or control characters", () => {
		expect(toInternalPath("/ /evil.example")).toBeUndefined();
		expect(toInternalPath("/\tlibraries")).toBeUndefined();
		expect(toInternalPath("/\nlibraries")).toBeUndefined();
		// A leading control char is stripped by URL parsers, exposing "//host".
		expect(toInternalPath(String.fromCharCode(1) + "//evil.example")).toBe(
			undefined,
		);
	});

	it("rejects relative paths and empty or absent values", () => {
		expect(toInternalPath("libraries")).toBeUndefined();
		expect(toInternalPath("../../etc")).toBeUndefined();
		expect(toInternalPath("")).toBeUndefined();
		expect(toInternalPath(undefined)).toBeUndefined();
	});
});
