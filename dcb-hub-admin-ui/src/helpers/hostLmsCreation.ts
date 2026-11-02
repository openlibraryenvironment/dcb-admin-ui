import type { GraphQLClient } from "graphql-request";

import { createHostLmsMutation } from "@mutations/createHostLms";
import { updateHostLmsMutation } from "@mutations/updateHostLms";
import { ingestSourceClassToUpdate } from "@helpers/hostLmsClientConfig";
import { errorForLog } from "@helpers/safeErrorLog";
import type {
	CreateHostLmsInput,
	CreateHostLmsMutation,
	CreateHostLmsMutationVariables,
	UpdateHostLmsMutation,
	UpdateHostLmsMutationVariables,
} from "@generated/graphql";

export type HostLmsCreation = CreateHostLmsMutation & {
	/** Created, but the ingest source class it needs could not be stored. */
	ingestSourceMissing: boolean;
};

/**
 * Creates a Host LMS, then stores the ingest source class createHostLms will not.
 *
 * The follow-up re-probes the system, so a Sierra or Polaris create contacts it twice;
 * the create's own verification is the one returned. A failed follow-up is reported
 * rather than thrown: the Host LMS exists, and throwing would invite a second create.
 */
export const createHostLmsRecord = async (
	gqlClient: GraphQLClient,
	input: CreateHostLmsInput,
): Promise<HostLmsCreation> => {
	const result = await gqlClient.request<
		CreateHostLmsMutation,
		CreateHostLmsMutationVariables
	>(createHostLmsMutation(), { input });

	const id = result?.createHostLms?.hostLms?.id;
	const ingestSourceClass = ingestSourceClassToUpdate(input.lmsClientClass);
	if (!id || !ingestSourceClass)
		return { ...result, ingestSourceMissing: false };

	try {
		await gqlClient.request<
			UpdateHostLmsMutation,
			UpdateHostLmsMutationVariables
		>(updateHostLmsMutation(), {
			input: {
				id,
				ingestSourceClass,
				reason: input.reason,
				changeCategory: input.changeCategory ?? "New Host LMS",
			},
		});
		return { ...result, ingestSourceMissing: false };
	} catch (error) {
		console.error(
			"Created a Host LMS but could not store its ingest source class:",
			errorForLog(error),
		);
		return { ...result, ingestSourceMissing: true };
	}
};
