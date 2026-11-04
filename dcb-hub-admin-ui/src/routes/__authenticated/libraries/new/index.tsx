import { createFileRoute, redirect } from "@tanstack/react-router";

/** The conversation starts with its first question. */
export const Route = createFileRoute("/__authenticated/libraries/new/")({
	beforeLoad: () => {
		throw redirect({
			to: "/libraries/new/$step",
			params: { step: "system" },
			search: {},
		});
	},
});
