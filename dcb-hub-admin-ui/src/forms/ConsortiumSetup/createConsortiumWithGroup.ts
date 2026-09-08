import { GraphQLClient } from "graphql-request";

import { getGroupsSelection } from "@queries/getGroupsSelection";
import { createLibraryGroup } from "@mutations/createLibraryGroup";
import { createConsortiumMutation } from "@mutations/createConsortium";
import {
	CONSORTIUM_FUNCTIONAL_SETTINGS,
	storedDescription,
} from "@constants/functionalSettings";
import type { NewConsortiumFormValues } from "@schemas/newConsortiumSchema";
import type {
	CreateConsortiumMutationVariables,
	CreateLibraryGroupMutationVariables,
	LoadGroupsSelectionQueryVariables,
} from "@generated/graphql";

/**
 * Standing a consortium up, in the order dcb-service requires — W-7.
 *
 * `CreateConsortiumDataFetcher` resolves `groupName` against an existing `LibraryGroup` of
 * type "Consortium" and refuses outright if there is not one, so the group has to be
 * created first. Both callers - the New Consortium dialog and setup's chapter 2 - need
 * exactly this sequence, and having written it twice once already is how the two would
 * drift on the next dcb-service change.
 *
 * A RETRY AFTER A HALF-FAILED ATTEMPT MUST NOT CREATE THE GROUP TWICE. The consortium
 * mutation is the one that fails (a duplicate name, a validation refusal), and by then the
 * group exists; creating it again fails on the duplicate and the user can never get past
 * their own first attempt. Hence the lookup.
 */

export interface CreateConsortiumOptions {
	values: NewConsortiumFormValues;
	/**
	 * Whether to send the functional settings the form collected.
	 *
	 * The dialog collects them on a step of its own and sends them with the create. Setup
	 * COMMITS EARLY - chapter 2 writes the consortium so that abandoning at chapter 3
	 * leaves a real record rather than nothing - and so sends an empty list here and
	 * writes the settings afterwards, through the ordinary mutations the settings page
	 * already uses.
	 */
	includeFunctionalSettings: boolean;
	/** Same reasoning as the settings: setup adds its contact in chapter 4. */
	includeContacts: boolean;
	/**
	 * The caller's `t`.
	 *
	 * A functional setting's stored description has to be the same sentence the user read
	 * when they ticked it, and that sentence only exists translated. This module is called
	 * from a mutation function rather than from render, so it cannot hold a hook - the
	 * translator is passed in instead. Only needed when `includeFunctionalSettings` is set.
	 */
	translate?: (key: string) => string;
	/** Reported so the caller can name what is happening while it happens. */
	onProgress?: (stage: "group" | "consortium") => void;
}

export async function createConsortiumWithGroup(
	gqlClient: GraphQLClient,
	{
		values,
		includeFunctionalSettings,
		includeContacts,
		translate,
		onProgress,
	}: CreateConsortiumOptions,
): Promise<{ groupCreated: boolean }> {
	const groups = await gqlClient.request<
		any,
		LoadGroupsSelectionQueryVariables
	>(getGroupsSelection, {
		order: "name",
		orderBy: "ASC",
		pageno: 0,
		pagesize: 1000,
	});

	const existingGroup = (groups?.libraryGroups?.content ?? []).find(
		(group: any) =>
			group?.type?.toLowerCase() === "consortium" &&
			group?.name?.toLowerCase() === values.groupName.toLowerCase(),
	);

	if (!existingGroup) {
		onProgress?.("group");
		await gqlClient.request<any, CreateLibraryGroupMutationVariables>(
			createLibraryGroup,
			{
				input: {
					name: values.groupName,
					code: values.groupCode,
					// The data fetcher matches on this exact type, case-insensitively.
					type: "Consortium",
				},
			},
		);
	}

	onProgress?.("consortium");
	await gqlClient.request<any, CreateConsortiumMutationVariables>(
		createConsortiumMutation,
		{
			input: {
				name: values.name,
				displayName: values.displayName,
				groupName: values.groupName,
				dateOfLaunch: values.dateOfLaunch,
				websiteUrl: values.websiteUrl || undefined,
				catalogueSearchUrl: values.catalogueSearchUrl || undefined,
				description: values.description || undefined,
				reason: values.reason,
				changeCategory: "Initial setup",
				changeReferenceUrl: values.changeReferenceUrl || undefined,
				contacts: includeContacts
					? values.contacts.map((contact) => ({
							firstName: contact.firstName.trim(),
							lastName: contact.lastName.trim(),
							email: contact.email.trim(),
							role: contact.role,
							isPrimaryContact: contact.isPrimaryContact,
						}))
					: [],
				// CreateConsortiumDataFetcher calls Flux.fromIterable on both of these
				// without a null check, so omitting either is an NPE rather than a
				// default. An EMPTY list is fine - it iterates nothing - which is what
				// makes commit-early safe. It also reads `description` with .toString(),
				// so every entry that IS sent must carry one.
				functionalSettings: includeFunctionalSettings
					? CONSORTIUM_FUNCTIONAL_SETTINGS.map((setting) => ({
							name: setting.name,
							enabled: values.functionalSettings[setting.name] === true,
							// The same wording the user read when they chose it, trimmed
							// to what the column accepts - see storedDescription.
							description: storedDescription(
								translate?.(setting.descriptionKey) ?? setting.name,
							),
						}))
					: [],
			},
		},
	);

	return { groupCreated: !existingGroup };
}
