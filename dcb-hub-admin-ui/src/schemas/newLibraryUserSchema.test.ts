import { describe, expect, it } from "vitest";

import {
	buildNewLibraryUserSchema,
	PROVISIONABLE_ROLES,
} from "./newLibraryUserSchema";

// The form passes a real `t`; the tests do not need translations, only stable messages.
const t = (key: string) => key;

const schema = buildNewLibraryUserSchema(t);

const valid = {
	email: "someone@library.example",
	firstName: "Ada",
	lastName: "Lovelace",
	role: "LIBRARY_ADMIN" as const,
};

describe("provisioning a library account", () => {
	it("accepts a complete entry", async () => {
		await expect(schema.validate(valid)).resolves.toBeTruthy();
	});

	it("offers exactly the two roles the server will provision", () => {
		// Two vocabularies for one fact drift. If the server's enum gains or loses a
		// value this is the test that says so, rather than a 400 in production.
		expect([...PROVISIONABLE_ROLES]).toEqual([
			"LIBRARY_ADMIN",
			"LIBRARY_READ_ONLY",
		]);
	});

	it("refuses a role that would be an escalation", async () => {
		// Not the control — the server refuses this four separate ways — but the person
		// filling the form should be told before they submit.
		await expect(schema.validate({ ...valid, role: "ADMIN" })).rejects.toThrow();

		await expect(
			schema.validate({ ...valid, role: "CONSORTIUM_ADMIN" }),
		).rejects.toThrow();
	});

	it("requires an email that could reach a person", async () => {
		// The account's whole credential flow is an email the provider sends. An address
		// nobody receives is an account nobody can activate.
		await expect(schema.validate({ ...valid, email: "" })).rejects.toThrow();
		await expect(
			schema.validate({ ...valid, email: "not-an-address" }),
		).rejects.toThrow();
	});

	it("requires a name, because the grid and the provider both show one", async () => {
		await expect(
			schema.validate({ ...valid, firstName: "" }),
		).rejects.toThrow();
		await expect(schema.validate({ ...valid, lastName: "" })).rejects.toThrow();
	});

	it("treats whitespace-only entries as absent", async () => {
		await expect(
			schema.validate({ ...valid, firstName: "   " }),
		).rejects.toThrow();
	});
});
