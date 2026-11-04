import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { createLibraryMutation } from "@mutations/createLibrary";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import { updateAgencyQuery } from "@mutations/updateAgency";
import { createLibraryContact } from "@mutations/createLibraryContact";
import { addLibraryToGroup } from "@mutations/addLibraryToGroup";
import { invalidateLibraryCaches } from "@forms/NewLibrary/libraryCaches";
import type {
	AddLibraryToGroupMutation,
	AddLibraryToGroupMutationVariables,
	CreateLibraryContactInput,
	CreateLibraryContactMutation,
	CreateLibraryContactMutationVariables,
	CreateLibraryMutation,
	CreateLibraryMutationVariables,
	LibraryInput,
	UpdateAgencyInput,
	UpdateAgencyMutation,
	UpdateAgencyMutationVariables,
	UpdateLibraryInput,
	UpdateLibraryMutation,
	UpdateLibraryMutationVariables,
} from "@generated/graphql";

/**
 * The writes library setup makes. Every one refreshes the library, its lists and its
 * setup counts, which is what the rail and the banner read completion from.
 */
export function useLibrarySetupWrites() {
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const settle = () => invalidateLibraryCaches(queryClient);

	const createLibrary = useMutation({
		mutationFn: (input: LibraryInput) =>
			gqlClient.request<CreateLibraryMutation, CreateLibraryMutationVariables>(
				createLibraryMutation,
				{ input },
			),
		onSuccess: settle,
	});
	const updateLibrary = useMutation({
		mutationFn: (input: UpdateLibraryInput) =>
			gqlClient.request<UpdateLibraryMutation, UpdateLibraryMutationVariables>(
				updateLibraryMutation(),
				{ input },
			),
		onSuccess: settle,
	});
	const updateAgency = useMutation({
		mutationFn: (input: UpdateAgencyInput) =>
			gqlClient.request<UpdateAgencyMutation, UpdateAgencyMutationVariables>(
				updateAgencyQuery(),
				{ input },
			),
		onSuccess: settle,
	});
	const createContact = useMutation({
		mutationFn: (input: CreateLibraryContactInput) =>
			gqlClient.request<
				CreateLibraryContactMutation,
				CreateLibraryContactMutationVariables
			>(createLibraryContact, { input }),
		onSuccess: settle,
	});
	const joinGroup = useMutation({
		mutationFn: ({
			groupId,
			libraryId,
		}: {
			groupId: string;
			libraryId: string;
		}) =>
			gqlClient.request<
				AddLibraryToGroupMutation,
				AddLibraryToGroupMutationVariables
			>(addLibraryToGroup, {
				input: { libraryGroup: groupId, library: libraryId },
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["groups"] });
			return settle();
		},
	});

	const busy =
		createLibrary.isPending ||
		updateLibrary.isPending ||
		updateAgency.isPending ||
		createContact.isPending ||
		joinGroup.isPending;

	return {
		createLibrary,
		updateLibrary,
		updateAgency,
		createContact,
		joinGroup,
		busy,
	};
}
