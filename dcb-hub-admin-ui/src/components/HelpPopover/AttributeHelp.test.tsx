// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";

import "@/i18n";
import enGB from "@/locales/en-GB/application.json";
import { DCBStatus } from "@constants/statuses/DCBStatuses";
import AttributeHelp from "./AttributeHelp";

afterEach(cleanup);

const statusHelp = (status: string | null) =>
	render(
		<AttributeHelp
			topic="patron_request_status"
			label="Current status"
			value={status}
			valueLabel={
				status === "READY_FOR_PICKUP" ? "Ready for pickup" : undefined
			}
		/>,
	);

describe("AttributeHelp", () => {
	it("explains the value it holds, in a dialog named for it", () => {
		statusHelp("READY_FOR_PICKUP");

		fireEvent.click(
			screen.getByRole("button", { name: "About Current status" }),
		);

		const dialog = screen.getByRole("dialog", {
			name: "Current status: Ready for pickup",
		});
		const parts = within(dialog).getAllByRole("term");
		expect(parts.map((term) => term.textContent)).toEqual([
			"What it means",
			"If it stays here",
		]);
		expect(dialog).toHaveTextContent("that the item is on the hold shelf");
		expect(dialog).toHaveTextContent(
			"The item has not yet been checked out to the patron.",
		);
		expect(dialog).toHaveTextContent(
			"DCB moves a request through these statuses",
		);
	});

	it("says nothing about waiting where a status is final", () => {
		statusHelp("FINALISED");

		fireEvent.click(
			screen.getByRole("button", { name: "About Current status" }),
		);

		const dialog = screen.getByRole("dialog");
		expect(within(dialog).getAllByRole("term")).toHaveLength(1);
		expect(dialog).not.toHaveTextContent("If it stays here");
	});

	it("explains only the attribute for a value the catalogue does not know", () => {
		statusHelp("A_STATUS_THE_SERVICE_ADDED_LATER");

		fireEvent.click(
			screen.getByRole("button", { name: "About Current status" }),
		);

		const dialog = screen.getByRole("dialog", { name: "Current status" });
		expect(dialog).toHaveTextContent(
			"DCB moves a request through these statuses",
		);
		expect(dialog).not.toHaveTextContent("A_STATUS_THE_SERVICE_ADDED_LATER");
	});
});

// The keys are built from data, so translationKeys.test.ts cannot see them.
describe("the patron request status help", () => {
	const statuses = Object.keys(DCBStatus).filter((key) => isNaN(Number(key)));
	const described = Object.keys(enGB.help.patron_request_status.values);

	it("describes every status", () => {
		expect(statuses.filter((status) => !described.includes(status))).toEqual(
			[],
		);
	});

	it("describes no status that no longer exists", () => {
		const waiting = Object.keys(enGB.help.patron_request_status.waiting);
		expect(
			[...described, ...waiting].filter((status) => !statuses.includes(status)),
		).toEqual([]);
	});
});
