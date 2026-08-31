import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	AlertTitle,
	LinearProgress,
	List,
	ListItem,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";

import ConsortiumContactFields from "@forms/ConsortiumSetup/steps/ConsortiumContactFields";
import SetupFooter from "../SetupFooter";
import { useSetupNavigation } from "@hooks/useSetupNavigation";
import { useConsortiumSetup } from "@hooks/useConsortiumSetup";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { createConsortiumContact } from "@mutations/createConsortiumContact";
import {
	newConsortiumSchema,
	type NewConsortiumFormValues,
} from "@schemas/newConsortiumSchema";
import { CONSORTIUM_BASICS_QUERY_KEY } from "@/queryOptions/consortium";
import type {
	ConsortiumContactInput,
	CreateConsortiumContactMutation,
	CreateConsortiumContactMutationVariables,
} from "@generated/graphql";

/**
 * C4 — "Who should we contact?"
 *
 * Adds ONE contact, through `createContact`, because the consortium was written without
 * any. Managing the full list - editing, removing, promoting a different primary - stays
 * on the Contacts page, which already does it: setup's job is to get a consortium off the
 * ground, not to become a second contact manager that has to be kept in step with the
 * first.
 *
 * Extending contacts to "who needs a DCB Admin for Libraries account" is deliberately out
 * of scope. The seam is the contact's `role`, which is already a fixed vocabulary in
 * `@constants/contactRoles`.
 */
export default function ContactsChapter() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const { goNext, goBack, skipAndContinue } = useSetupNavigation("contacts");
	const { consortium } = useConsortiumSetup();

	const [error, setError] = useState<string | null>(null);
	const [isBusy, setBusy] = useState(false);
	const isSubmitting = useRef(false);

	const alreadyHasContacts = (consortium?.contacts?.length ?? 0) > 0;

	const methods = useForm<NewConsortiumFormValues>({
		mode: "onTouched",
		resolver: zodResolver(newConsortiumSchema) as any,
		defaultValues: {
			// Only the contacts branch is validated here; the rest satisfies the shared
			// schema's shape and is never sent from this chapter.
			name: consortium?.name ?? "",
			displayName: consortium?.displayName ?? "",
			groupName: "",
			groupCode: "",
			dateOfLaunch: new Date().toISOString().slice(0, 10),
			websiteUrl: "",
			catalogueSearchUrl: "",
			description: "",
			reason: "Initial consortium setup",
			changeReferenceUrl: "",
			functionalSettings: {},
			contacts: [
				{
					firstName: "",
					lastName: "",
					email: "",
					role: "",
					// The first contact on a consortium that has none is the primary
					// one by default; there is nothing else for it to be.
					isPrimaryContact: !alreadyHasContacts,
				},
			],
		},
	});

	const { mutateAsync: addContact } = useMutation({
		mutationFn: (values: NewConsortiumFormValues) => {
			const contact = values.contacts[0];

			// TYPED, not `request<any>`. ConsortiumContactInput declares reason and
			// changeCategory as String! and this call omitted both, so every contact
			// failed with "Field 'reason' has coerced Null value for NonNull type" - and
			// no compiler complained, because `any` on the variables switched the
			// generated types off exactly where they would have caught it.
			//
			// The audit trail is why those fields are mandatory: a contact appears on a
			// consortium record and somebody has to be able to ask who put it there and
			// why. "Initial consortium setup" is the honest answer during first-run;
			// adding a field to collect one would be asking the user to justify the thing
			// they were just told to do.
			const input: ConsortiumContactInput = {
				consortiumId: consortium?.id ?? "",
				firstName: contact.firstName.trim(),
				lastName: contact.lastName.trim(),
				email: contact.email.trim(),
				role: contact.role,
				isPrimaryContact: contact.isPrimaryContact,
				reason: "Initial consortium setup",
				changeCategory: "Initial setup",
			};

			return gqlClient.request<
				CreateConsortiumContactMutation,
				CreateConsortiumContactMutationVariables
			>(createConsortiumContact, { input });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["LoadConsortium"] });
			queryClient.invalidateQueries({ queryKey: CONSORTIUM_BASICS_QUERY_KEY });
		},
	});

	const handleContinue = async () => {
		if (isSubmitting.current) return;
		isSubmitting.current = true;
		setBusy(true);
		setError(null);
		try {
			if (!(await methods.trigger("contacts"))) {
				methods.setFocus("contacts.0.firstName");
				return;
			}
			await addContact(methods.getValues());
			goNext();
		} catch (failure: any) {
			console.error("Consortium contact creation failed:", failure);
			setError(describeGraphQLError(failure, t("setup.contacts.error")));
		} finally {
			setBusy(false);
			isSubmitting.current = false;
		}
	};

	return (
		<Stack spacing={2}>
			<div style={{ height: 4 }}>{isBusy && <LinearProgress />}</div>

			{error && (
				<Alert severity="error" role="alert" onClose={() => setError(null)}>
					<AlertTitle>{t("setup.contacts.error")}</AlertTitle>
					{error}
				</Alert>
			)}

			{alreadyHasContacts && (
				<Stack spacing={1}>
					<Typography variant="attributeTitle">
						{t("setup.contacts.existing")}
					</Typography>
					<List dense sx={{ py: 0 }}>
						{consortium.contacts.map((contact: any) => (
							<ListItem key={contact.id} sx={{ px: 0 }}>
								<ListItemText primary={contact.email} />
							</ListItem>
						))}
					</List>
					<Alert severity="info">{t("setup.contacts.add_another")}</Alert>
				</Stack>
			)}

			<FormProvider {...methods}>
				<ConsortiumContactFields showExplanation={false} />
			</FormProvider>

			<SetupFooter
				onBack={goBack}
				onContinue={handleContinue}
				continueLabel={t("setup.actions.save_and_continue")}
				onSkip={skipAndContinue}
				busy={isBusy}
			/>
		</Stack>
	);
}
