// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import {
	HOST_LMS_CLASSES,
	HOST_LMS_PROFILES,
	type ClientConfigField,
	clientConfigFieldsFor,
} from "@helpers/hostLmsClientConfig";
import ClientConfigView from "./ClientConfigView";

// Uninitialised i18n renders the key, which is what these assert on

const flags = (on: boolean) => {
	window.__APP_ENV__ = {
		VITE_FEATURE_HOST_LMS_EXTENDED_CONFIG: String(on),
		VITE_FEATURE_HOST_LMS_CIRCULATION_SETTINGS: String(on),
	} as unknown as Window["__APP_ENV__"];
};

afterEach(() => {
	cleanup();
	window.__APP_ENV__ = undefined;
});

const setPath = (target: any, path: string[], value: unknown) => {
	let node = target;
	for (const segment of path.slice(0, -1)) node = node[segment] ??= {};
	node[path[path.length - 1]] = value;
};

const isConditional = (
	lmsClientClass: string,
	configField: ClientConfigField,
) =>
	!!configField.shownWhen ||
	HOST_LMS_PROFILES.find(
		(profile) => profile.lmsClientClass === lmsClientClass,
	)!.groups.some(
		(group) => !!group.shownWhen && group.fields.includes(configField),
	);

/** A distinct value per setting, so each can be found on the page. */
const sample = (configField: ClientConfigField, index: number): unknown => {
	switch (configField.type) {
		case "url":
			return `https://v${index}.example.org`;
		case "number":
			return 9000 + index;
		case "stringList":
			return [`v${index}`];
		case "jsonObject":
			return { [`k${index}`]: `v${index}` };
		case "boolean":
			return true;
		default:
			return `v${index}`;
	}
};

describe("every setting the edit form offers is shown", () => {
	it.each(HOST_LMS_PROFILES.map((profile) => profile.lmsClientClass))(
		"%s",
		(lmsClientClass) => {
			flags(true);
			const fields = clientConfigFieldsFor(lmsClientClass).filter(
				(configField) =>
					configField.type !== "boolean" &&
					!isConditional(lmsClientClass, configField),
			);
			const config: Record<string, unknown> = {};
			fields.forEach((configField, index) =>
				setPath(config, configField.path, sample(configField, index)),
			);

			render(
				<ClientConfigView lmsClientClass={lmsClientClass} config={config} />,
			);

			fields.forEach((configField, index) => {
				if (configField.type === "secret") {
					expect(screen.getByLabelText(configField.labelKey)).toHaveValue(
						`v${index}`,
					);
					expect(screen.queryByText(`v${index}`)).toBeNull();
				} else if (configField.type === "jsonObject") {
					expect(screen.getByTitle(`k${index}: v${index}`)).toBeInTheDocument();
				} else {
					expect(
						screen.getByText(String(sample(configField, index))),
					).toBeInTheDocument();
				}
			});
			expect(
				screen.queryByText("hostlms.client_config.other_settings"),
			).toBeNull();
		},
	);
});

describe("on dcb-service 8.71.0", () => {
	it("names stored settings it does not read instead of showing their values", () => {
		flags(false);
		render(
			<ClientConfigView
				lmsClientClass={HOST_LMS_CLASSES.polaris}
				config={{
					"shared-system": true,
					item: { "renewal-limit": "3", "av-renewal-limit": "7" },
				}}
			/>,
		);

		expect(
			screen.queryByText("hostlms.client_config.renewal_limit_av"),
		).toBeNull();
		expect(screen.queryByText("7")).toBeNull();
		expect(
			screen.getByText("shared-system, item.av-renewal-limit"),
		).toBeInTheDocument();
	});
});

it("shows the copy dcb-service reads first", () => {
	flags(true);
	render(
		<ClientConfigView
			lmsClientClass={HOST_LMS_CLASSES.orsAppliance}
			config={{ ncipSystemId: "preferred", "ncip-system-id": "shadowed" }}
		/>,
	);

	expect(screen.getByText("preferred")).toBeInTheDocument();
	expect(screen.queryByText("shadowed")).toBeNull();
});

it("shows the adapter's default for a setting left unset, saying so", () => {
	render(
		<ClientConfigView lmsClientClass={HOST_LMS_CLASSES.sierra} config={{}} />,
	);

	expect(
		screen.getByText("hostlms.client_config.hold_policy").parentElement,
	).toHaveTextContent("hostlms.client_config.default_value");
});
